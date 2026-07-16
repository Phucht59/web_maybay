using System.Data;
using FlightBookingSystem.Web.Data;
using FlightBookingSystem.Web.Models;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace FlightBookingSystem.Web.Services;

public sealed class PaymentFinalizationService
{
    private const string SimulationProvider = "Simulation";

    private readonly ApplicationDbContext _db;
    private readonly PaymentSimulationService _paymentSimulationService;
    private readonly ILogger<PaymentFinalizationService> _logger;

    public PaymentFinalizationService(
        ApplicationDbContext db,
        PaymentSimulationService paymentSimulationService,
        ILogger<PaymentFinalizationService> logger)
    {
        _db = db;
        _paymentSimulationService = paymentSimulationService;
        _logger = logger;
    }

    public async Task<PaymentFinalizationResult> FinalizeIfReadyAsync(
        int paymentId,
        DateTime now,
        CancellationToken cancellationToken)
    {
        try
        {
            return await ExecuteInTransactionAsync(paymentId, now, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (DbUpdateException exception)
        {
            _logger.LogError(
                exception,
                "Payment finalization database update failed. PaymentId={PaymentId}",
                paymentId);
            return await ResolveAfterDatabaseFailureAsync(paymentId, cancellationToken);
        }
        catch (SqliteException exception) when (IsSqliteBusyOrLocked(exception))
        {
            _logger.LogWarning(
                exception,
                "Payment finalization encountered SQLite lock contention. PaymentId={PaymentId}",
                paymentId);
            return await ResolveAfterDatabaseFailureAsync(paymentId, cancellationToken);
        }
        catch (SqliteException exception)
        {
            _logger.LogError(
                exception,
                "Payment finalization SQLite operation failed. PaymentId={PaymentId}",
                paymentId);
            return await ResolveAfterDatabaseFailureAsync(paymentId, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Unexpected payment finalization failure. PaymentId={PaymentId}",
                paymentId);
            return PaymentFinalizationResult.Failure(
                PaymentFinalizationState.Failed,
                "Không thể hoàn tất thanh toán.");
        }
    }

    private async Task<PaymentFinalizationResult> ExecuteInTransactionAsync(
        int paymentId,
        DateTime now,
        CancellationToken cancellationToken)
    {
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
                ?? throw new InvalidOperationException("Không thể liên kết transaction SQLite với DbContext.");

            await using (contextTransaction)
            {
                try
                {
                    async Task<PaymentFinalizationResult> RollbackAsync(
                        PaymentFinalizationState state,
                        string message)
                    {
                        await contextTransaction.RollbackAsync(cancellationToken);
                        _db.ChangeTracker.Clear();
                        return PaymentFinalizationResult.Failure(state, message);
                    }

                    var payment = await _db.ThanhToans
                        .Where(candidate => candidate.MaThanhToan == paymentId)
                        .Include(candidate => candidate.PhieuDatCho)
                            .ThenInclude(booking => booking.HanhKhachs)
                        .Include(candidate => candidate.PhieuDatCho)
                            .ThenInclude(booking => booking.ChangDatChos)
                        .Include(candidate => candidate.PhieuDatCho)
                            .ThenInclude(booking => booking.Ves)
                                .ThenInclude(ticket => ticket.GheChuyenBay)
                        .Include(candidate => candidate.PhieuDatCho)
                            .ThenInclude(booking => booking.ThanhToans)
                        .AsSplitQuery()
                        .SingleOrDefaultAsync(cancellationToken);

                    if (payment is null)
                    {
                        return await RollbackAsync(
                            PaymentFinalizationState.NotFinalizable,
                            "Không tìm thấy thanh toán để hoàn tất.");
                    }

                    if (string.Equals(payment.TrangThai, "Succeeded", StringComparison.Ordinal))
                    {
                        return await RollbackAsync(
                            PaymentFinalizationState.AlreadySucceeded,
                            "Thanh toán đã được hoàn tất trước đó.");
                    }

                    if (!string.Equals(payment.TrangThai, "Pending", StringComparison.Ordinal))
                    {
                        return await RollbackAsync(
                            PaymentFinalizationState.NotFinalizable,
                            "Trạng thái thanh toán không cho phép hoàn tất.");
                    }

                    var evaluation = _paymentSimulationService.Evaluate(payment, now);
                    if (evaluation.EvaluationState == PaymentSimulationState.Processing)
                    {
                        return await RollbackAsync(
                            PaymentFinalizationState.Processing,
                            "Thanh toán vẫn đang được xử lý.");
                    }

                    if (evaluation.EvaluationState == PaymentSimulationState.GraceExpired)
                    {
                        return await RollbackAsync(
                            PaymentFinalizationState.GraceExpired,
                            "Thanh toán đã vượt quá thời gian grace.");
                    }

                    if (evaluation.EvaluationState != PaymentSimulationState.ReadyToFinalize)
                    {
                        return await RollbackAsync(
                            PaymentFinalizationState.NotFinalizable,
                            "Thanh toán không đủ điều kiện hoàn tất.");
                    }

                    if (!TryValidateAggregate(payment, out var conflictReason))
                    {
                        _logger.LogWarning(
                            "Payment finalization precondition failed. PaymentId={PaymentId}, Reason={Reason}",
                            paymentId,
                            conflictReason);
                        return await RollbackAsync(
                            PaymentFinalizationState.Conflict,
                            "Dữ liệu booking không nhất quán để hoàn tất thanh toán.");
                    }

                    var booking = payment.PhieuDatCho;
                    var tickets = booking.Ves.OrderBy(ticket => ticket.MaVe).ToList();
                    var seats = tickets
                        .Select(ticket => ticket.GheChuyenBay)
                        .DistinctBy(seat => seat.MaGheChuyenBay)
                        .ToList();

                    payment.TrangThai = "Succeeded";
                    payment.NgayThanhToan = now;
                    payment.MaGiaoDich = CreateTransactionCode(payment.MaThanhToan);
                    payment.LyDoLoi = null;

                    booking.TrangThai = "Confirmed";
                    booking.NgayCapNhat = now;

                    foreach (var ticket in tickets)
                    {
                        ticket.TrangThaiVe = "Issued";
                        ticket.NgayXuatVe = now;
                        ticket.SoVeDienTu = CreateElectronicTicketNumber(
                            payment.MaThanhToan,
                            ticket.MaVe);
                    }

                    foreach (var seat in seats)
                    {
                        seat.TrangThaiGhe = "Sold";
                        seat.MaPhieuDatChoDangGiu = null;
                        seat.PhieuDatChoDangGiu = null;
                        seat.GiuDenLuc = null;
                        seat.GiuBoiTaiKhoanId = null;
                        seat.SessionId = null;
                        seat.UpdatedAt = now;
                        seat.PhienBan++;
                    }

                    await _db.SaveChangesAsync(cancellationToken);
                    await contextTransaction.CommitAsync(cancellationToken);
                    _db.ChangeTracker.Clear();

                    return PaymentFinalizationResult.Success();
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

    private static bool TryValidateAggregate(
        ThanhToan payment,
        out string reason)
    {
        var booking = payment.PhieuDatCho;
        if (!string.Equals(booking.TrangThai, "PaymentPending", StringComparison.Ordinal))
        {
            reason = "BookingStatus";
            return false;
        }

        if (!string.Equals(booking.LoaiChuyenDi, "OneWay", StringComparison.Ordinal) ||
            booking.HanhKhachs.Count == 0 ||
            booking.HanhKhachs.Count != booking.SoLuongHanhKhach)
        {
            reason = "BookingScopeOrPassengerCount";
            return false;
        }

        var legs = booking.ChangDatChos.ToList();
        if (legs.Count != 1 ||
            !string.Equals(legs[0].LoaiChang, "Outbound", StringComparison.Ordinal) ||
            legs[0].ThuTuChang != 1)
        {
            reason = "BookingLeg";
            return false;
        }

        if (payment.SoTien != booking.TongTien ||
            !string.Equals(payment.NhaCungCap, SimulationProvider, StringComparison.Ordinal) ||
            payment.MaGiaoDich is not null ||
            payment.NgayThanhToan is not null ||
            booking.ThanhToans.Any(candidate =>
                candidate.MaThanhToan != payment.MaThanhToan &&
                candidate.TrangThai == "Succeeded"))
        {
            reason = "Payment";
            return false;
        }

        var tickets = booking.Ves.ToList();
        var passengerIds = booking.HanhKhachs
            .Select(passenger => passenger.MaHanhKhach)
            .ToHashSet();
        if (tickets.Count != passengerIds.Count ||
            tickets.Count == 0 ||
            tickets.Any(ticket =>
                ticket.MaPhieuDatCho != booking.MaPhieuDatCho ||
                ticket.MaChangDatCho != legs[0].MaChangDatCho ||
                !passengerIds.Contains(ticket.MaHanhKhach) ||
                !string.Equals(ticket.TrangThaiVe, "PaymentPending", StringComparison.Ordinal) ||
                ticket.SoVeDienTu is not null ||
                ticket.NgayXuatVe is not null) ||
            tickets.GroupBy(ticket => ticket.MaHanhKhach).Any(group => group.Count() != 1) ||
            passengerIds.Any(passengerId =>
                tickets.Count(ticket => ticket.MaHanhKhach == passengerId) != 1) ||
            tickets.Select(ticket => ticket.MaGheChuyenBay).Distinct().Count() != tickets.Count)
        {
            reason = "Ticket";
            return false;
        }

        if (tickets.Any(ticket =>
                ticket.GheChuyenBay.MaChuyenBay != legs[0].MaChuyenBay ||
                !string.Equals(ticket.GheChuyenBay.TrangThaiGhe, "Held", StringComparison.Ordinal) ||
                ticket.GheChuyenBay.MaPhieuDatChoDangGiu != booking.MaPhieuDatCho))
        {
            reason = "Seat";
            return false;
        }

        reason = string.Empty;
        return true;
    }

    private async Task<PaymentFinalizationResult> ResolveAfterDatabaseFailureAsync(
        int paymentId,
        CancellationToken cancellationToken)
    {
        _db.ChangeTracker.Clear();

        try
        {
            var status = await _db.ThanhToans
                .AsNoTracking()
                .Where(payment => payment.MaThanhToan == paymentId)
                .Select(payment => payment.TrangThai)
                .SingleOrDefaultAsync(cancellationToken);

            return string.Equals(status, "Succeeded", StringComparison.Ordinal)
                ? PaymentFinalizationResult.Failure(
                    PaymentFinalizationState.AlreadySucceeded,
                    "Thanh toán đã được hoàn tất bởi một request đồng thời.")
                : PaymentFinalizationResult.Failure(
                    PaymentFinalizationState.Failed,
                    "Không thể hoàn tất thanh toán.");
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            _logger.LogError(
                exception,
                "Could not resolve payment state after finalization failure. PaymentId={PaymentId}",
                paymentId);
            return PaymentFinalizationResult.Failure(
                PaymentFinalizationState.Failed,
                "Không thể xác định kết quả hoàn tất thanh toán.");
        }
    }

    private static string CreateTransactionCode(int paymentId) =>
        $"SIMPAY-{paymentId:D10}";

    private static string CreateElectronicTicketNumber(int paymentId, int ticketId) =>
        $"SIMTKT-{paymentId:D10}-{ticketId:D10}";

    private static bool IsSqliteBusyOrLocked(SqliteException exception) =>
        exception.SqliteErrorCode is 5 or 6;
}

public enum PaymentFinalizationState
{
    Processing,
    Finalized,
    AlreadySucceeded,
    GraceExpired,
    NotFinalizable,
    Conflict,
    Failed
}

public sealed record PaymentFinalizationResult(
    PaymentFinalizationState State,
    string Message)
{
    public static PaymentFinalizationResult Success() =>
        new(PaymentFinalizationState.Finalized, "Thanh toán đã được hoàn tất.");

    public static PaymentFinalizationResult Failure(
        PaymentFinalizationState state,
        string message) =>
        new(state, message);
}
