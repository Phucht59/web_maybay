using System.Data;
using FlightBookingSystem.Web.Data;
using FlightBookingSystem.Web.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace FlightBookingSystem.Web.Services;

public sealed class BookingPaymentClosureService
{
    public const string UserCancellationReason = "UserCancelled";
    public const string PaymentTimeoutReason = "PaymentTimeout";

    private readonly ApplicationDbContext _db;
    private readonly PaymentSimulationService _paymentSimulationService;
    private readonly ILogger<BookingPaymentClosureService> _logger;

    public BookingPaymentClosureService(
        ApplicationDbContext db,
        PaymentSimulationService paymentSimulationService,
        ILogger<BookingPaymentClosureService> logger)
    {
        _db = db;
        _paymentSimulationService = paymentSimulationService;
        _logger = logger;
    }

    public async Task<BookingPaymentClosureResult> CancelByUserAsync(
        int bookingId,
        int accountId,
        bool isAdmin,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var ownsTransaction = _db.Database.CurrentTransaction is null;

        try
        {
            return await ExecuteWithTransactionAsync(
                async () =>
                {
                    var booking = await AggregateQuery()
                        .Where(candidate =>
                            candidate.MaPhieuDatCho == bookingId &&
                            (isAdmin || candidate.MaTaiKhoan == accountId))
                        .SingleOrDefaultAsync(cancellationToken);

                    if (booking is null)
                    {
                        return ClosureExecution.Unchanged(
                            BookingPaymentClosureResult.For(
                                BookingPaymentClosureState.NotFound,
                                bookingId,
                                "Không tìm thấy booking."));
                    }

                    if (string.Equals(booking.TrangThai, "Cancelled", StringComparison.Ordinal))
                    {
                        return IsValidCancelledAggregate(booking)
                            ? ClosureExecution.Unchanged(
                                BookingPaymentClosureResult.For(
                                    BookingPaymentClosureState.AlreadyCancelled,
                                    bookingId,
                                    "Booking đã được hủy trước đó."))
                            : ConflictExecution(bookingId, "CancelledAggregate");
                    }

                    if (booking.ThanhToans.Any(payment => payment.TrangThai == "Succeeded"))
                    {
                        return ClosureExecution.Unchanged(
                            BookingPaymentClosureResult.For(
                                BookingPaymentClosureState.PaymentAlreadySucceeded,
                                bookingId,
                                "Booking đã có thanh toán thành công."));
                    }

                    if (string.Equals(booking.TrangThai, "Confirmed", StringComparison.Ordinal))
                    {
                        return ClosureExecution.Unchanged(
                            BookingPaymentClosureResult.For(
                                BookingPaymentClosureState.BookingAlreadyConfirmed,
                                bookingId,
                                "Booking đã được xác nhận."));
                    }

                    if (string.Equals(booking.TrangThai, "Expired", StringComparison.Ordinal))
                    {
                        return ClosureExecution.Unchanged(
                            BookingPaymentClosureResult.For(
                                BookingPaymentClosureState.BookingAlreadyExpired,
                                bookingId,
                                "Booking đã hết hạn."));
                    }

                    if (!string.Equals(booking.TrangThai, "PaymentPending", StringComparison.Ordinal))
                    {
                        return ConflictExecution(bookingId, "BookingStatus");
                    }

                    if (!TryValidateOpenAggregate(booking, out var conflictReason))
                    {
                        return ConflictExecution(bookingId, conflictReason);
                    }

                    var cancelledPaymentCount = ApplyUserCancellation(booking, now);
                    return ClosureExecution.Changed(
                        BookingPaymentClosureResult.Changed(
                            BookingPaymentClosureState.Cancelled,
                            bookingId,
                            cancelledPaymentCount,
                            "Booking đã được hủy."));
                },
                cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception) when (ownsTransaction)
        {
            _logger.LogError(
                exception,
                "User cancellation failed. BookingId={BookingId}",
                bookingId);
            return await ResolveCancellationAfterFailureAsync(
                bookingId,
                accountId,
                isAdmin,
                cancellationToken);
        }
    }

    public async Task<BookingPaymentClosureResult> TimeoutPaymentIfGraceExpiredAsync(
        int paymentId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var ownsTransaction = _db.Database.CurrentTransaction is null;

        try
        {
            return await ExecuteWithTransactionAsync(
                async () =>
                {
                    var booking = await AggregateQuery()
                        .Where(candidate => candidate.ThanhToans.Any(payment =>
                            payment.MaThanhToan == paymentId))
                        .SingleOrDefaultAsync(cancellationToken);

                    if (booking is null)
                    {
                        return ClosureExecution.Unchanged(
                            BookingPaymentClosureResult.For(
                                BookingPaymentClosureState.NotFound,
                                0,
                                "Không tìm thấy thanh toán."));
                    }

                    var payment = booking.ThanhToans.Single(candidate =>
                        candidate.MaThanhToan == paymentId);

                    if (string.Equals(payment.TrangThai, "Succeeded", StringComparison.Ordinal))
                    {
                        return ClosureExecution.Unchanged(
                            BookingPaymentClosureResult.For(
                                BookingPaymentClosureState.AlreadySucceeded,
                                booking.MaPhieuDatCho,
                                "Thanh toán đã thành công."));
                    }

                    if (string.Equals(payment.TrangThai, "Failed", StringComparison.Ordinal) &&
                        string.Equals(payment.LyDoLoi, PaymentTimeoutReason, StringComparison.Ordinal))
                    {
                        return IsValidTimedOutAggregate(booking, payment)
                            ? ClosureExecution.Unchanged(
                                BookingPaymentClosureResult.For(
                                    BookingPaymentClosureState.AlreadyTimedOut,
                                    booking.MaPhieuDatCho,
                                    "Thanh toán đã được xử lý timeout trước đó."))
                            : ConflictExecution(booking.MaPhieuDatCho, "TimedOutAggregate");
                    }

                    if (!string.Equals(payment.TrangThai, "Pending", StringComparison.Ordinal))
                    {
                        return ClosureExecution.Unchanged(
                            BookingPaymentClosureResult.For(
                                BookingPaymentClosureState.NotApplicable,
                                booking.MaPhieuDatCho,
                                "Thanh toán không còn ở trạng thái Pending."));
                    }

                    var evaluation = _paymentSimulationService.Evaluate(payment, now);
                    if (evaluation.EvaluationState == PaymentSimulationState.Processing)
                    {
                        return ClosureExecution.Unchanged(
                            BookingPaymentClosureResult.For(
                                BookingPaymentClosureState.Processing,
                                booking.MaPhieuDatCho,
                                "Thanh toán vẫn đang xử lý."));
                    }

                    if (evaluation.EvaluationState == PaymentSimulationState.ReadyToFinalize)
                    {
                        return ClosureExecution.Unchanged(
                            BookingPaymentClosureResult.For(
                                BookingPaymentClosureState.ReadyToFinalize,
                                booking.MaPhieuDatCho,
                                "Thanh toán đang trong grace và có thể hoàn tất."));
                    }

                    if (evaluation.EvaluationState != PaymentSimulationState.GraceExpired)
                    {
                        return ClosureExecution.Unchanged(
                            BookingPaymentClosureResult.For(
                                BookingPaymentClosureState.NotApplicable,
                                booking.MaPhieuDatCho,
                                "Thanh toán không đủ điều kiện timeout."));
                    }

                    var pendingPayments = booking.ThanhToans
                        .Where(candidate => candidate.TrangThai == "Pending")
                        .ToList();
                    if (pendingPayments.Count != 1 ||
                        pendingPayments[0].MaThanhToan != paymentId)
                    {
                        return ConflictExecution(
                            booking.MaPhieuDatCho,
                            "PendingPaymentCount");
                    }

                    if (!TryValidateOpenAggregate(booking, out var conflictReason))
                    {
                        return ConflictExecution(
                            booking.MaPhieuDatCho,
                            conflictReason);
                    }

                    ApplyPaymentTimeout(booking, payment, now);
                    return ClosureExecution.Changed(
                        BookingPaymentClosureResult.Changed(
                            BookingPaymentClosureState.TimedOut,
                            booking.MaPhieuDatCho,
                            0,
                            "Thanh toán đã vượt grace và booking đã hết hạn."));
                },
                cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception) when (ownsTransaction)
        {
            _logger.LogError(
                exception,
                "Payment timeout failed. PaymentId={PaymentId}",
                paymentId);
            return await ResolveTimeoutAfterFailureAsync(paymentId, cancellationToken);
        }
    }

    public Task<BookingPaymentClosureResult> CloseBookingIfExpiredAsync(
        int bookingId,
        DateTime now,
        CancellationToken cancellationToken) =>
        ExecuteWithTransactionAsync(
            async () =>
            {
                var booking = await AggregateQuery()
                    .Where(candidate => candidate.MaPhieuDatCho == bookingId)
                    .SingleOrDefaultAsync(cancellationToken);

                if (booking is null)
                {
                    return ClosureExecution.Unchanged(
                        BookingPaymentClosureResult.For(
                            BookingPaymentClosureState.NotFound,
                            bookingId,
                            "Không tìm thấy booking."));
                }

                return EvaluateAutomaticClosure(booking, now);
            },
            cancellationToken);

    public Task<BookingClosureBatchResult> CloseExpiredBookingsForSeatsAsync(
        IReadOnlyCollection<int> selectedSeatIds,
        DateTime now,
        CancellationToken cancellationToken)
    {
        if (selectedSeatIds.Count == 0)
        {
            return Task.FromResult(BookingClosureBatchResult.Empty());
        }

        return ExecuteBatchSafelyAsync(
            async () =>
            {
                var bookings = await AggregateQuery()
                    .Where(booking =>
                        booking.TrangThai == "PaymentPending" &&
                        (booking.GheDangGius.Any(seat =>
                             selectedSeatIds.Contains(seat.MaGheChuyenBay)) ||
                         booking.Ves.Any(ticket =>
                             selectedSeatIds.Contains(ticket.MaGheChuyenBay))))
                    .ToListAsync(cancellationToken);

                return EvaluateAutomaticClosures(bookings, now);
            },
            "selected seats",
            cancellationToken);
    }

    public Task<BookingClosureBatchResult> CloseExpiredBookingsForFlightAsync(
        int flightId,
        DateTime now,
        CancellationToken cancellationToken) =>
        ExecuteBatchSafelyAsync(
            async () =>
            {
                var bookings = await AggregateQuery()
                    .Where(booking =>
                        booking.TrangThai == "PaymentPending" &&
                        (booking.GheDangGius.Any(seat => seat.MaChuyenBay == flightId) ||
                         booking.Ves.Any(ticket =>
                             ticket.GheChuyenBay.MaChuyenBay == flightId)))
                    .ToListAsync(cancellationToken);

                return EvaluateAutomaticClosures(bookings, now);
            },
            "flight",
            cancellationToken);

    private async Task<BookingClosureBatchResult> ExecuteBatchSafelyAsync(
        Func<Task<ClosureExecution<BookingClosureBatchResult>>> operation,
        string scope,
        CancellationToken cancellationToken)
    {
        var ownsTransaction = _db.Database.CurrentTransaction is null;

        try
        {
            return await ExecuteWithTransactionAsync(operation, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception) when (ownsTransaction)
        {
            _logger.LogError(
                exception,
                "Automatic booking closure failed for {Scope}.",
                scope);
            return BookingClosureBatchResult.Failure(
                "Không thể xử lý booking hết hạn.");
        }
    }

    private ClosureExecution<BookingPaymentClosureResult> EvaluateAutomaticClosure(
        PhieuDatCho booking,
        DateTime now)
    {
        if (!string.Equals(booking.TrangThai, "PaymentPending", StringComparison.Ordinal))
        {
            return ClosureExecution.Unchanged(
                BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.NotApplicable,
                    booking.MaPhieuDatCho,
                    "Booking không ở trạng thái chờ thanh toán."));
        }

        if (booking.ThanhToans.Any(payment => payment.TrangThai == "Succeeded"))
        {
            return ClosureExecution.Unchanged(
                BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.PaymentAlreadySucceeded,
                    booking.MaPhieuDatCho,
                    "Booking đã có thanh toán thành công."));
        }

        var pendingPayments = booking.ThanhToans
            .Where(payment => payment.TrangThai == "Pending")
            .ToList();

        if (pendingPayments.Count > 0)
        {
            if (pendingPayments.Count != 1)
            {
                return ConflictExecution(booking.MaPhieuDatCho, "PendingPaymentCount");
            }

            var payment = pendingPayments[0];
            var evaluation = _paymentSimulationService.Evaluate(payment, now);
            if (evaluation.EvaluationState == PaymentSimulationState.Processing)
            {
                return ClosureExecution.Unchanged(
                    BookingPaymentClosureResult.For(
                        BookingPaymentClosureState.Processing,
                        booking.MaPhieuDatCho,
                        "Thanh toán vẫn đang xử lý."));
            }

            if (evaluation.EvaluationState == PaymentSimulationState.ReadyToFinalize)
            {
                return ClosureExecution.Unchanged(
                    BookingPaymentClosureResult.For(
                        BookingPaymentClosureState.ReadyToFinalize,
                        booking.MaPhieuDatCho,
                        "Thanh toán vẫn trong grace."));
            }

            if (evaluation.EvaluationState == PaymentSimulationState.GraceExpired)
            {
                if (!TryValidateOpenAggregate(booking, out var timeoutConflict))
                {
                    return ConflictExecution(booking.MaPhieuDatCho, timeoutConflict);
                }

                ApplyPaymentTimeout(booking, payment, now);
                return ClosureExecution.Changed(
                    BookingPaymentClosureResult.Changed(
                        BookingPaymentClosureState.TimedOut,
                        booking.MaPhieuDatCho,
                        0,
                        "Thanh toán đã vượt grace."));
            }

            return ClosureExecution.Unchanged(
                BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.NotApplicable,
                    booking.MaPhieuDatCho,
                    "Thanh toán không đủ điều kiện đóng."));
        }

        if (!booking.GiuDenLuc.HasValue || booking.GiuDenLuc.Value > now)
        {
            return ClosureExecution.Unchanged(
                BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.NotApplicable,
                    booking.MaPhieuDatCho,
                    "Booking chưa hết hạn giữ chỗ."));
        }

        if (!TryValidateOpenAggregate(booking, out var expirationConflict))
        {
            return ConflictExecution(booking.MaPhieuDatCho, expirationConflict);
        }

        ApplyNoPaymentExpiration(booking, now);
        return ClosureExecution.Changed(
            BookingPaymentClosureResult.Changed(
                BookingPaymentClosureState.NoPaymentExpired,
                booking.MaPhieuDatCho,
                0,
                "Booking không có payment đang hoạt động đã hết hạn."));
    }

    private ClosureExecution<BookingClosureBatchResult> EvaluateAutomaticClosures(
        IReadOnlyCollection<PhieuDatCho> bookings,
        DateTime now)
    {
        var closedCount = 0;
        var conflictCount = 0;

        foreach (var booking in bookings)
        {
            var evaluation = EvaluateAutomaticClosure(booking, now);
            if (evaluation.HasChanges)
            {
                closedCount++;
            }
            else if (evaluation.Result.State == BookingPaymentClosureState.Conflict)
            {
                conflictCount++;
            }
        }

        var result = new BookingClosureBatchResult(
            closedCount > 0,
            closedCount,
            conflictCount,
            false,
            string.Empty);
        return new ClosureExecution<BookingClosureBatchResult>(result, result.HasChanges);
    }

    private async Task<T> ExecuteWithTransactionAsync<T>(
        Func<Task<ClosureExecution<T>>> operation,
        CancellationToken cancellationToken)
    {
        if (_db.Database.CurrentTransaction is not null)
        {
            var callerExecution = await operation();
            if (callerExecution.HasChanges)
            {
                await _db.SaveChangesAsync(cancellationToken);
            }

            return callerExecution.Result;
        }

        var connection = (SqliteConnection)_db.Database.GetDbConnection();
        var openedHere = connection.State != ConnectionState.Open;
        if (openedHere)
        {
            await connection.OpenAsync(cancellationToken);
        }

        try
        {
            await using var sqliteTransaction = connection.BeginTransaction(
                IsolationLevel.Serializable,
                deferred: false);
            var contextTransaction = await _db.Database.UseTransactionAsync(
                sqliteTransaction,
                cancellationToken)
                ?? throw new InvalidOperationException(
                    "Không thể liên kết transaction SQLite với DbContext.");

            await using (contextTransaction)
            {
                try
                {
                    var execution = await operation();
                    if (execution.HasChanges)
                    {
                        await _db.SaveChangesAsync(cancellationToken);
                        await contextTransaction.CommitAsync(cancellationToken);
                    }
                    else
                    {
                        await contextTransaction.RollbackAsync(cancellationToken);
                    }

                    _db.ChangeTracker.Clear();
                    return execution.Result;
                }
                catch
                {
                    try
                    {
                        await contextTransaction.RollbackAsync(CancellationToken.None);
                    }
                    catch
                    {
                    }

                    _db.ChangeTracker.Clear();
                    throw;
                }
            }
        }
        finally
        {
            if (openedHere)
            {
                await connection.CloseAsync();
            }
        }
    }

    private IQueryable<PhieuDatCho> AggregateQuery() =>
        _db.PhieuDatChos
            .Include(booking => booking.ThanhToans)
            .Include(booking => booking.Ves)
                .ThenInclude(ticket => ticket.GheChuyenBay)
            .Include(booking => booking.GheDangGius)
            .AsSplitQuery();

    private bool TryValidateOpenAggregate(
        PhieuDatCho booking,
        out string reason)
    {
        if (!string.Equals(booking.TrangThai, "PaymentPending", StringComparison.Ordinal) ||
            booking.ThanhToans.Any(payment => payment.TrangThai == "Succeeded"))
        {
            reason = "BookingOrPaymentStatus";
            return false;
        }

        var tickets = booking.Ves.ToList();
        if (tickets.Count == 0 ||
            tickets.Any(ticket =>
                ticket.MaPhieuDatCho != booking.MaPhieuDatCho ||
                !string.Equals(ticket.TrangThaiVe, "PaymentPending", StringComparison.Ordinal) ||
                ticket.SoVeDienTu is not null ||
                ticket.NgayXuatVe is not null) ||
            tickets.Select(ticket => ticket.MaGheChuyenBay).Distinct().Count() != tickets.Count)
        {
            reason = "Ticket";
            return false;
        }

        var linkedSeats = booking.GheDangGius
            .DistinctBy(seat => seat.MaGheChuyenBay)
            .ToList();
        var ticketSeatIds = tickets
            .Select(ticket => ticket.MaGheChuyenBay)
            .ToHashSet();
        var linkedSeatIds = linkedSeats
            .Select(seat => seat.MaGheChuyenBay)
            .ToHashSet();

        if (linkedSeats.Count != tickets.Count ||
            !ticketSeatIds.SetEquals(linkedSeatIds) ||
            linkedSeats.Any(seat =>
                seat.MaPhieuDatChoDangGiu != booking.MaPhieuDatCho ||
                !string.Equals(seat.TrangThaiGhe, "Held", StringComparison.Ordinal)) ||
            tickets.Any(ticket =>
                ticket.GheChuyenBay.MaPhieuDatChoDangGiu != booking.MaPhieuDatCho ||
                !string.Equals(ticket.GheChuyenBay.TrangThaiGhe, "Held", StringComparison.Ordinal)))
        {
            reason = "Seat";
            return false;
        }

        if (booking.ThanhToans.Any(payment =>
                payment.TrangThai == "Pending" &&
                (payment.MaGiaoDich is not null || payment.NgayThanhToan is not null)))
        {
            reason = "PendingPayment";
            return false;
        }

        reason = string.Empty;
        return true;
    }

    private static bool IsValidCancelledAggregate(PhieuDatCho booking) =>
        booking.ThanhToans.All(payment => payment.TrangThai != "Pending" && payment.TrangThai != "Succeeded") &&
        booking.Ves.Count > 0 &&
        booking.Ves.All(ticket =>
            ticket.TrangThaiVe == "Canceled" &&
            ticket.SoVeDienTu is null &&
            ticket.NgayXuatVe is null) &&
        booking.GheDangGius.Count == 0;

    private static bool IsValidTimedOutAggregate(
        PhieuDatCho booking,
        ThanhToan payment) =>
        string.Equals(booking.TrangThai, "Expired", StringComparison.Ordinal) &&
        string.Equals(payment.TrangThai, "Failed", StringComparison.Ordinal) &&
        string.Equals(payment.LyDoLoi, PaymentTimeoutReason, StringComparison.Ordinal) &&
        booking.ThanhToans.All(candidate => candidate.TrangThai != "Pending" && candidate.TrangThai != "Succeeded") &&
        booking.Ves.Count > 0 &&
        booking.Ves.All(ticket =>
            ticket.TrangThaiVe == "Canceled" &&
            ticket.SoVeDienTu is null &&
            ticket.NgayXuatVe is null) &&
        booking.GheDangGius.Count == 0;

    private static int ApplyUserCancellation(PhieuDatCho booking, DateTime now)
    {
        var pendingPayments = booking.ThanhToans
            .Where(payment => payment.TrangThai == "Pending")
            .ToList();

        booking.TrangThai = "Cancelled";
        booking.NgayCapNhat = now;

        foreach (var payment in pendingPayments)
        {
            payment.TrangThai = "Cancelled";
            payment.LyDoLoi = UserCancellationReason;
        }

        CancelPendingTickets(booking);
        ResetBookingSeats(booking, now, preserveActiveSessionHold: false);
        return pendingPayments.Count;
    }

    private static void ApplyPaymentTimeout(
        PhieuDatCho booking,
        ThanhToan payment,
        DateTime now)
    {
        payment.TrangThai = "Failed";
        payment.LyDoLoi = PaymentTimeoutReason;
        booking.TrangThai = "Expired";
        booking.NgayCapNhat = now;
        CancelPendingTickets(booking);
        ResetBookingSeats(booking, now, preserveActiveSessionHold: false);
    }

    private static void ApplyNoPaymentExpiration(PhieuDatCho booking, DateTime now)
    {
        booking.TrangThai = "Expired";
        booking.NgayCapNhat = now;
        CancelPendingTickets(booking);
        ResetBookingSeats(booking, now, preserveActiveSessionHold: true);
    }

    private static void CancelPendingTickets(PhieuDatCho booking)
    {
        foreach (var ticket in booking.Ves)
        {
            ticket.TrangThaiVe = "Canceled";
        }
    }

    private static void ResetBookingSeats(
        PhieuDatCho booking,
        DateTime now,
        bool preserveActiveSessionHold)
    {
        foreach (var seat in booking.GheDangGius
                     .DistinctBy(candidate => candidate.MaGheChuyenBay)
                     .ToList())
        {
            if (preserveActiveSessionHold && HasActiveSessionHold(seat, now))
            {
                seat.MaPhieuDatChoDangGiu = null;
                seat.PhieuDatChoDangGiu = null;
                seat.UpdatedAt = now;
                seat.PhienBan++;
                continue;
            }

            ResetSeat(seat, now);
        }
    }

    private static bool HasActiveSessionHold(GheChuyenBay seat, DateTime now) =>
        string.Equals(seat.TrangThaiGhe, "Held", StringComparison.Ordinal) &&
        seat.GiuBoiTaiKhoanId.HasValue &&
        !string.IsNullOrWhiteSpace(seat.SessionId) &&
        seat.GiuDenLuc.HasValue &&
        seat.GiuDenLuc.Value > now;

    private static void ResetSeat(GheChuyenBay seat, DateTime now)
    {
        seat.TrangThaiGhe = "Available";
        seat.GiuBoiTaiKhoanId = null;
        seat.MaPhieuDatChoDangGiu = null;
        seat.PhieuDatChoDangGiu = null;
        seat.SessionId = null;
        seat.GiuDenLuc = null;
        seat.UpdatedAt = now;
        seat.PhienBan++;
    }

    private ClosureExecution<BookingPaymentClosureResult> ConflictExecution(
        int bookingId,
        string reason)
    {
        _logger.LogWarning(
            "Booking closure precondition failed. BookingId={BookingId}, Reason={Reason}",
            bookingId,
            reason);
        return ClosureExecution.Unchanged(
            BookingPaymentClosureResult.For(
                BookingPaymentClosureState.Conflict,
                bookingId,
                "Dữ liệu booking không nhất quán để đóng an toàn."));
    }

    private async Task<BookingPaymentClosureResult> ResolveCancellationAfterFailureAsync(
        int bookingId,
        int accountId,
        bool isAdmin,
        CancellationToken cancellationToken)
    {
        _db.ChangeTracker.Clear();

        try
        {
            var current = await _db.PhieuDatChos
                .AsNoTracking()
                .Where(booking =>
                    booking.MaPhieuDatCho == bookingId &&
                    (isAdmin || booking.MaTaiKhoan == accountId))
                .Select(booking => new
                {
                    booking.TrangThai,
                    HasSucceeded = booking.ThanhToans.Any(payment =>
                        payment.TrangThai == "Succeeded")
                })
                .SingleOrDefaultAsync(cancellationToken);

            if (current is null)
            {
                return BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.NotFound,
                    bookingId,
                    "Không tìm thấy booking.");
            }

            if (string.Equals(current.TrangThai, "Cancelled", StringComparison.Ordinal))
            {
                return BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.AlreadyCancelled,
                    bookingId,
                    "Booking đã được hủy bởi request đồng thời.");
            }

            if (current.HasSucceeded)
            {
                return BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.PaymentAlreadySucceeded,
                    bookingId,
                    "Thanh toán đã thành công trước khi booking được hủy.");
            }

            if (string.Equals(current.TrangThai, "Confirmed", StringComparison.Ordinal))
            {
                return BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.BookingAlreadyConfirmed,
                    bookingId,
                    "Booking đã được xác nhận.");
            }

            if (string.Equals(current.TrangThai, "Expired", StringComparison.Ordinal))
            {
                return BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.BookingAlreadyExpired,
                    bookingId,
                    "Booking đã hết hạn.");
            }
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogError(
                exception,
                "Could not resolve booking after cancellation failure. BookingId={BookingId}",
                bookingId);
        }

        return BookingPaymentClosureResult.For(
            BookingPaymentClosureState.Failed,
            bookingId,
            "Không thể hủy booking.");
    }

    private async Task<BookingPaymentClosureResult> ResolveTimeoutAfterFailureAsync(
        int paymentId,
        CancellationToken cancellationToken)
    {
        _db.ChangeTracker.Clear();

        try
        {
            var current = await _db.ThanhToans
                .AsNoTracking()
                .Where(payment => payment.MaThanhToan == paymentId)
                .Select(payment => new
                {
                    payment.MaPhieuDatCho,
                    payment.TrangThai,
                    payment.LyDoLoi,
                    BookingStatus = payment.PhieuDatCho.TrangThai
                })
                .SingleOrDefaultAsync(cancellationToken);

            if (current is null)
            {
                return BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.NotFound,
                    0,
                    "Không tìm thấy thanh toán.");
            }

            if (string.Equals(current.TrangThai, "Succeeded", StringComparison.Ordinal))
            {
                return BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.AlreadySucceeded,
                    current.MaPhieuDatCho,
                    "Thanh toán đã thành công bởi request đồng thời.");
            }

            if (string.Equals(current.TrangThai, "Failed", StringComparison.Ordinal) &&
                string.Equals(current.LyDoLoi, PaymentTimeoutReason, StringComparison.Ordinal) &&
                string.Equals(current.BookingStatus, "Expired", StringComparison.Ordinal))
            {
                return BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.AlreadyTimedOut,
                    current.MaPhieuDatCho,
                    "Thanh toán đã timeout bởi request đồng thời.");
            }

            if (string.Equals(current.TrangThai, "Cancelled", StringComparison.Ordinal))
            {
                return BookingPaymentClosureResult.For(
                    BookingPaymentClosureState.NotApplicable,
                    current.MaPhieuDatCho,
                    "Thanh toán đã bị hủy bởi request đồng thời.");
            }
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogError(
                exception,
                "Could not resolve payment after timeout failure. PaymentId={PaymentId}",
                paymentId);
        }

        return BookingPaymentClosureResult.For(
            BookingPaymentClosureState.Failed,
            0,
            "Không thể xử lý payment timeout.");
    }

    private sealed record ClosureExecution<T>(T Result, bool HasChanges);

    private static class ClosureExecution
    {
        public static ClosureExecution<T> Changed<T>(T result) => new(result, true);
        public static ClosureExecution<T> Unchanged<T>(T result) => new(result, false);
    }
}

public enum BookingPaymentClosureState
{
    Cancelled,
    AlreadyCancelled,
    TimedOut,
    AlreadyTimedOut,
    NoPaymentExpired,
    Processing,
    ReadyToFinalize,
    AlreadySucceeded,
    NotFound,
    BookingAlreadyExpired,
    BookingAlreadyConfirmed,
    PaymentAlreadySucceeded,
    Conflict,
    NotApplicable,
    Failed
}

public sealed record BookingPaymentClosureResult(
    BookingPaymentClosureState State,
    int BookingId,
    int CancelledPendingPaymentCount,
    string Message,
    bool HasChanges)
{
    public static BookingPaymentClosureResult For(
        BookingPaymentClosureState state,
        int bookingId,
        string message) =>
        new(state, bookingId, 0, message, false);

    public static BookingPaymentClosureResult Changed(
        BookingPaymentClosureState state,
        int bookingId,
        int cancelledPendingPaymentCount,
        string message) =>
        new(state, bookingId, cancelledPendingPaymentCount, message, true);
}

public sealed record BookingClosureBatchResult(
    bool HasChanges,
    int ClosedBookingCount,
    int ConflictCount,
    bool Failed,
    string Message)
{
    public static BookingClosureBatchResult Empty() =>
        new(false, 0, 0, false, string.Empty);

    public static BookingClosureBatchResult Failure(string message) =>
        new(false, 0, 0, true, message);
}
