using System.Data;
using System.Security.Claims;
using FlightBookingSystem.Web.Data;
using FlightBookingSystem.Web.Models;
using FlightBookingSystem.Web.Models.DTOs;
using FlightBookingSystem.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace FlightBookingSystem.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/payments")]
public sealed class PaymentsController : ControllerBase
{
    private const string SimulationProvider = "Simulation";

    private static readonly Dictionary<string, string> CanonicalMethods =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Card"] = "Card",
            ["OnlineBanking"] = "OnlineBanking",
            ["EWallet"] = "EWallet",
            ["QrBanking"] = "QrBanking"
        };

    private readonly ApplicationDbContext _db;
    private readonly CheckoutCreationService _checkoutCreationService;
    private readonly PaymentSimulationService _paymentSimulationService;
    private readonly PaymentFinalizationService _paymentFinalizationService;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(
        ApplicationDbContext db,
        CheckoutCreationService checkoutCreationService,
        PaymentSimulationService paymentSimulationService,
        PaymentFinalizationService paymentFinalizationService,
        ILogger<PaymentsController> logger)
    {
        _db = db;
        _checkoutCreationService = checkoutCreationService;
        _paymentSimulationService = paymentSimulationService;
        _paymentFinalizationService = paymentFinalizationService;
        _logger = logger;
    }

    [HttpGet("{paymentId:int}/status")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<PaymentStatusResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<PaymentErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<PaymentErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<PaymentErrorResponse>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<PaymentErrorResponse>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetStatus(
        int paymentId,
        CancellationToken cancellationToken)
    {
        var accountIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(accountIdClaim, out var accountId) || accountId <= 0)
        {
            return Unauthorized(Error(
                "Unauthorized",
                "Thông tin tài khoản trong token không hợp lệ."));
        }

        if (paymentId <= 0)
        {
            return NotFound(Error(
                "PaymentNotFound",
                "Không tìm thấy thanh toán."));
        }

        var isAdmin = User.IsInRole("Admin");
        var access = await _db.ThanhToans
            .AsNoTracking()
            .Where(candidate =>
                candidate.MaThanhToan == paymentId &&
                (isAdmin || candidate.PhieuDatCho.MaTaiKhoan == accountId))
            .Select(candidate => new PaymentAccessSnapshot(candidate.TrangThai))
            .SingleOrDefaultAsync(cancellationToken);

        if (access is null)
        {
            return NotFound(Error(
                "PaymentNotFound",
                "Không tìm thấy thanh toán."));
        }

        var now = DateTime.UtcNow;
        if (string.Equals(access.Status, "Pending", StringComparison.Ordinal))
        {
            var finalization = await _paymentFinalizationService.FinalizeIfReadyAsync(
                paymentId,
                now,
                cancellationToken);

            if (finalization.State == PaymentFinalizationState.Conflict)
            {
                return Conflict(Error(
                    "PaymentFinalizationConflict",
                    "Dữ liệu booking không nhất quán để hoàn tất thanh toán."));
            }

            if (finalization.State == PaymentFinalizationState.Failed)
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    Error(
                        "PaymentFinalizationFailed",
                        "Không thể hoàn tất thanh toán."));
            }
        }

        var payment = await _db.ThanhToans
            .AsNoTracking()
            .Where(candidate =>
                candidate.MaThanhToan == paymentId &&
                (isAdmin || candidate.PhieuDatCho.MaTaiKhoan == accountId))
            .SingleOrDefaultAsync(cancellationToken);

        if (payment is null)
        {
            return NotFound(Error(
                "PaymentNotFound",
                "Không tìm thấy thanh toán."));
        }

        var evaluation = _paymentSimulationService.Evaluate(payment, now);
        var response = new PaymentStatusResponse(
            payment.MaThanhToan,
            payment.MaPhieuDatCho,
            payment.TrangThai,
            payment.SoTien,
            payment.PhuongThuc,
            payment.NhaCungCap ?? string.Empty,
            ToUtc(payment.NgayTao),
            payment.NgayThanhToan.HasValue
                ? ToUtc(payment.NgayThanhToan.Value)
                : null,
            payment.LyDoLoi,
            evaluation.EvaluationState.ToString(),
            evaluation.ProcessingDurationSeconds,
            evaluation.ProcessingDueAt,
            evaluation.GraceExpiresAt,
            evaluation.ServerTime);

        return Ok(response);
    }

    [HttpPost]
    [ProducesResponseType<PaymentResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<PaymentResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<PaymentErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<PaymentErrorResponse>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<PaymentErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<PaymentErrorResponse>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Create(
        [FromBody] CreatePaymentRequest? request,
        CancellationToken cancellationToken)
    {
        var requestReceivedAt = DateTime.UtcNow;

        if (request is null || request.BookingId <= 0)
        {
            return BadRequest(Error(
                "BookingNotPayable",
                "Thông tin booking không hợp lệ."));
        }

        if (!TryCanonicalizeMethod(request.Method, out var canonicalMethod))
        {
            return BadRequest(Error(
                "InvalidPaymentMethod",
                "Hình thức thanh toán không hợp lệ."));
        }

        var idempotencyKey = request.IdempotencyKey?.Trim();
        if (string.IsNullOrEmpty(idempotencyKey) || idempotencyKey.Length > 120)
        {
            return BadRequest(Error(
                "InvalidIdempotencyKey",
                "Idempotency key là bắt buộc và không được vượt quá 120 ký tự."));
        }

        var accountIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(accountIdClaim, out var accountId) || accountId <= 0)
        {
            return Unauthorized(Error(
                "Unauthorized",
                "Thông tin tài khoản trong token không hợp lệ."));
        }

        try
        {
            await using var transaction = await _db.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                var existingByKey = await FindByIdempotencyKeyAsync(
                    idempotencyKey,
                    cancellationToken);

                if (existingByKey is not null)
                {
                    var existingResult = ResolveExistingKey(
                        existingByKey,
                        accountId,
                        request.BookingId,
                        canonicalMethod);

                    await transaction.CommitAsync(cancellationToken);
                    return existingResult;
                }

                var booking = await _db.PhieuDatChos
                    .AsNoTracking()
                    .Where(candidate =>
                        candidate.MaPhieuDatCho == request.BookingId &&
                        candidate.MaTaiKhoan == accountId)
                    .Select(candidate => new
                    {
                        candidate.MaPhieuDatCho,
                        candidate.TrangThai,
                        candidate.GiuDenLuc,
                        candidate.TongTien
                    })
                    .SingleOrDefaultAsync(cancellationToken);

                if (booking is null)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return NotFound(Error(
                        "BookingNotFound",
                        "Không tìm thấy booking."));
                }

                var existingStatuses = await _db.ThanhToans
                    .AsNoTracking()
                    .Where(payment => payment.MaPhieuDatCho == booking.MaPhieuDatCho)
                    .Select(payment => payment.TrangThai)
                    .ToListAsync(cancellationToken);

                if (existingStatuses.Contains("Succeeded", StringComparer.Ordinal))
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Conflict(Error(
                        "PaymentAlreadySucceeded",
                        "Booking đã được thanh toán thành công."));
                }

                if (existingStatuses.Contains("Pending", StringComparer.Ordinal))
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Conflict(Error(
                        "PaymentAlreadyPending",
                        "Booking đã có một thanh toán đang chờ xử lý."));
                }

                if (!string.Equals(booking.TrangThai, "PaymentPending", StringComparison.Ordinal))
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Conflict(Error(
                        "BookingNotPayable",
                        "Booking không ở trạng thái có thể thanh toán."));
                }

                if (!booking.GiuDenLuc.HasValue)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Conflict(Error(
                        "BookingNotPayable",
                        "Booking không có thời hạn thanh toán hợp lệ."));
                }

                if (requestReceivedAt >= booking.GiuDenLuc.Value)
                {
                    var expired = await _checkoutCreationService.ExpireBookingIfNeededAsync(
                        booking.MaPhieuDatCho,
                        requestReceivedAt,
                        cancellationToken);

                    if (!expired)
                    {
                        await transaction.RollbackAsync(cancellationToken);
                        _db.ChangeTracker.Clear();

                        return await ResolveExpirationRaceAsync(
                            accountId,
                            booking.MaPhieuDatCho,
                            requestReceivedAt,
                            cancellationToken);
                    }

                    await transaction.CommitAsync(cancellationToken);
                    return Conflict(Error(
                        "BookingExpired",
                        "Đã hết thời hạn thanh toán."));
                }

                if (booking.TongTien <= 0)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return Conflict(Error(
                        "BookingNotPayable",
                        "Booking không có tổng tiền hợp lệ."));
                }

                var payment = new ThanhToan
                {
                    MaPhieuDatCho = booking.MaPhieuDatCho,
                    PhuongThuc = canonicalMethod,
                    NhaCungCap = SimulationProvider,
                    IdempotencyKey = idempotencyKey,
                    NgayTao = requestReceivedAt,
                    SoTien = booking.TongTien,
                    TrangThai = "Pending",
                    MaGiaoDich = null,
                    NgayThanhToan = null,
                    LyDoLoi = null
                };

                _db.ThanhToans.Add(payment);
                await _db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return StatusCode(
                    StatusCodes.Status201Created,
                    ToResponse(payment));
            }
            catch (DbUpdateException exception) when (IsIdempotencyUniqueConflict(exception))
            {
                await transaction.RollbackAsync(cancellationToken);
                _db.ChangeTracker.Clear();

                return await ResolveConcurrentOutcomeAsync(
                    accountId,
                    request.BookingId,
                    canonicalMethod,
                    idempotencyKey,
                    cancellationToken);
            }
            catch (DbUpdateException exception) when (IsSqliteBusyOrLocked(exception.InnerException))
            {
                await transaction.RollbackAsync(cancellationToken);
                _db.ChangeTracker.Clear();

                return await ResolveConcurrentOutcomeAsync(
                    accountId,
                    request.BookingId,
                    canonicalMethod,
                    idempotencyKey,
                    cancellationToken);
            }
            catch (DbUpdateException exception)
            {
                await transaction.RollbackAsync(cancellationToken);
                _db.ChangeTracker.Clear();
                _logger.LogError(
                    exception,
                    "Unexpected database error while creating payment for BookingId={BookingId}, AccountId={AccountId}",
                    request.BookingId,
                    accountId);

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    Error("PaymentCreationFailed", "Không thể tạo thanh toán."));
            }
            catch (SqliteException exception) when (IsSqliteBusyOrLocked(exception))
            {
                await transaction.RollbackAsync(cancellationToken);
                _db.ChangeTracker.Clear();

                return await ResolveConcurrentOutcomeAsync(
                    accountId,
                    request.BookingId,
                    canonicalMethod,
                    idempotencyKey,
                    cancellationToken);
            }
        }
        catch (SqliteException exception) when (IsSqliteBusyOrLocked(exception))
        {
            _db.ChangeTracker.Clear();

            return await ResolveConcurrentOutcomeAsync(
                accountId,
                request.BookingId,
                canonicalMethod,
                idempotencyKey,
                cancellationToken);
        }
    }

    private async Task<IActionResult> ResolveConcurrentOutcomeAsync(
        int accountId,
        int bookingId,
        string canonicalMethod,
        string idempotencyKey,
        CancellationToken cancellationToken)
    {
        var existingByKey = await FindByIdempotencyKeyAsync(
            idempotencyKey,
            cancellationToken);

        if (existingByKey is not null)
        {
            return ResolveExistingKey(
                existingByKey,
                accountId,
                bookingId,
                canonicalMethod);
        }

        var bookingPaymentState = await _db.PhieuDatChos
            .AsNoTracking()
            .Where(booking =>
                booking.MaPhieuDatCho == bookingId &&
                booking.MaTaiKhoan == accountId)
            .Select(booking => new
            {
                HasSucceeded = booking.ThanhToans.Any(payment => payment.TrangThai == "Succeeded"),
                HasPending = booking.ThanhToans.Any(payment => payment.TrangThai == "Pending")
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (bookingPaymentState is null)
        {
            return NotFound(Error("BookingNotFound", "Không tìm thấy booking."));
        }

        if (bookingPaymentState.HasSucceeded)
        {
            return Conflict(Error(
                "PaymentAlreadySucceeded",
                "Booking đã được thanh toán thành công."));
        }

        if (bookingPaymentState.HasPending)
        {
            return Conflict(Error(
                "PaymentAlreadyPending",
                "Booking đã có một thanh toán đang chờ xử lý."));
        }

        return Conflict(Error(
            "BookingNotPayable",
            "Yêu cầu thanh toán xung đột với một yêu cầu đồng thời. Vui lòng thử lại."));
    }

    private async Task<IActionResult> ResolveExpirationRaceAsync(
        int accountId,
        int bookingId,
        DateTime requestReceivedAt,
        CancellationToken cancellationToken)
    {
        var currentState = await _db.PhieuDatChos
            .AsNoTracking()
            .Where(booking =>
                booking.MaPhieuDatCho == bookingId &&
                booking.MaTaiKhoan == accountId)
            .Select(booking => new
            {
                booking.TrangThai,
                booking.GiuDenLuc,
                HasSucceeded = booking.ThanhToans.Any(payment => payment.TrangThai == "Succeeded"),
                HasPending = booking.ThanhToans.Any(payment => payment.TrangThai == "Pending")
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (currentState is null)
        {
            return NotFound(Error("BookingNotFound", "Không tìm thấy booking."));
        }

        if (currentState.HasSucceeded)
        {
            return Conflict(Error(
                "PaymentAlreadySucceeded",
                "Booking đã được thanh toán thành công."));
        }

        if (currentState.HasPending)
        {
            return Conflict(Error(
                "PaymentAlreadyPending",
                "Booking đã có một thanh toán đang chờ xử lý."));
        }

        if (!string.Equals(currentState.TrangThai, "PaymentPending", StringComparison.Ordinal) ||
            !currentState.GiuDenLuc.HasValue)
        {
            return Conflict(Error(
                "BookingNotPayable",
                "Booking không ở trạng thái có thể thanh toán."));
        }

        if (requestReceivedAt >= currentState.GiuDenLuc.Value)
        {
            return Conflict(Error(
                "BookingExpired",
                "Đã hết thời hạn thanh toán."));
        }

        return Conflict(Error(
            "BookingNotPayable",
            "Trạng thái booking đã thay đổi trong khi xử lý thanh toán."));
    }

    private IActionResult ResolveExistingKey(
        PaymentSnapshot existing,
        int accountId,
        int bookingId,
        string canonicalMethod)
    {
        if (existing.AccountId != accountId)
        {
            return NotFound(Error("BookingNotFound", "Không tìm thấy booking."));
        }

        if (existing.BookingId != bookingId ||
            !string.Equals(existing.Method, canonicalMethod, StringComparison.Ordinal) ||
            !string.Equals(existing.Provider, SimulationProvider, StringComparison.Ordinal))
        {
            return Conflict(Error(
                "IdempotencyConflict",
                "Idempotency key đã được dùng cho một yêu cầu thanh toán khác."));
        }

        return Ok(ToResponse(existing));
    }

    private Task<PaymentSnapshot?> FindByIdempotencyKeyAsync(
        string idempotencyKey,
        CancellationToken cancellationToken) =>
        _db.ThanhToans
            .AsNoTracking()
            .Where(payment => payment.IdempotencyKey == idempotencyKey)
            .Select(payment => new PaymentSnapshot(
                payment.MaThanhToan,
                payment.MaPhieuDatCho,
                payment.PhieuDatCho.MaTaiKhoan,
                payment.TrangThai,
                payment.SoTien,
                payment.PhuongThuc,
                payment.NhaCungCap,
                payment.NgayTao))
            .SingleOrDefaultAsync(cancellationToken);

    private static bool TryCanonicalizeMethod(string? method, out string canonicalMethod)
    {
        var normalized = method?.Trim();
        if (normalized is not null &&
            CanonicalMethods.TryGetValue(normalized, out var canonical))
        {
            canonicalMethod = canonical;
            return true;
        }

        canonicalMethod = string.Empty;
        return false;
    }

    private static bool IsIdempotencyUniqueConflict(DbUpdateException exception) =>
        exception.InnerException is SqliteException sqliteException &&
        sqliteException.SqliteErrorCode == 19 &&
        sqliteException.Message.Contains(
            nameof(ThanhToan.IdempotencyKey),
            StringComparison.OrdinalIgnoreCase);

    private static bool IsSqliteBusyOrLocked(Exception? exception) =>
        exception is SqliteException sqliteException &&
        sqliteException.SqliteErrorCode is 5 or 6;

    private static PaymentResponse ToResponse(ThanhToan payment) =>
        new(
            payment.MaThanhToan,
            payment.MaPhieuDatCho,
            payment.TrangThai,
            payment.SoTien,
            payment.PhuongThuc,
            payment.NhaCungCap ?? string.Empty,
            ToUtc(payment.NgayTao),
            DateTimeOffset.UtcNow);

    private static PaymentResponse ToResponse(PaymentSnapshot payment) =>
        new(
            payment.PaymentId,
            payment.BookingId,
            payment.Status,
            payment.Amount,
            payment.Method,
            payment.Provider ?? string.Empty,
            ToUtc(payment.CreatedAt),
            DateTimeOffset.UtcNow);

    private static PaymentErrorResponse Error(string code, string message) =>
        new(code, message, DateTimeOffset.UtcNow);

    private static DateTimeOffset ToUtc(DateTime value) =>
        new(DateTime.SpecifyKind(value, DateTimeKind.Utc));

    private sealed record PaymentSnapshot(
        int PaymentId,
        int BookingId,
        int? AccountId,
        string Status,
        decimal Amount,
        string Method,
        string? Provider,
        DateTime CreatedAt);

    private sealed record PaymentAccessSnapshot(string Status);
}
