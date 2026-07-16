using System.Security.Claims;
using FlightBookingSystem.Web.Data;
using FlightBookingSystem.Web.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FlightBookingSystem.Web.Controllers;

[ApiController]
[Authorize]
[Route("api/booking")]
public class BookingController : ControllerBase
{
    private static readonly TimeSpan SelectionHoldDuration = TimeSpan.FromMinutes(30);
    private static readonly TimeSpan PaymentHoldDuration = TimeSpan.FromMinutes(10);
    private readonly ApplicationDbContext _db;
    private readonly BookingPaymentClosureService _closureService;
    private readonly ILogger<BookingController> _logger;

    public BookingController(
        ApplicationDbContext db,
        BookingPaymentClosureService closureService,
        ILogger<BookingController> logger)
    {
        _db = db;
        _closureService = closureService;
        _logger = logger;
    }

    [HttpGet("flights/{flightId:int}/seats")]
    public async Task<IActionResult> GetSeatMap(int flightId, [FromQuery] string? sessionId)
    {
        if (!await ReleaseExpiredSeats(flightId))
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Không thể xử lý ghế hết hạn." });
        var accountId = GetAccountId();
        var paymentThreshold = DateTime.UtcNow.Add(PaymentHoldDuration).AddSeconds(3);

        var flight = await _db.ChuyenBays
            .AsNoTracking()
            .Where(c => c.MaChuyenBay == flightId)
            .Select(c => new
            {
                c.MaChuyenBay,
                c.SoHieuChuyenBay,
                c.GioKhoiHanh,
                c.GioHaCanh,
                c.GiaCoBan,
                c.TrangThai,
                c.MayBay.DongMayBay,
                HangBay = c.MayBay.HangBay.TenHangBay,
                c.LoTrinh.MaSanBayDi,
                c.LoTrinh.MaSanBayDen,
                ThanhPhoDi = c.LoTrinh.SanBayDi.ThanhPho,
                ThanhPhoDen = c.LoTrinh.SanBayDen.ThanhPho
            })
            .FirstOrDefaultAsync();

        if (flight is null) return NotFound(new { message = "Không tìm thấy chuyến bay." });

        var seats = await _db.GheChuyenBays
            .AsNoTracking()
            .Where(g => g.MaChuyenBay == flightId)
            .OrderBy(g => g.GheMayBay.SoGhe)
            .Select(g => new
            {
                g.MaGheChuyenBay,
                g.GheMayBay.SoGhe,
                g.GheMayBay.MaHangGhe,
                g.GheMayBay.HangGhe.TenHangGhe,
                g.GiaGhe,
                TrangThai = g.TrangThaiGhe,
                LaGheCuaToi = g.TrangThaiGhe == "Held" && g.GiuBoiTaiKhoanId == accountId && g.SessionId == sessionId,
                LaGheCuaTaiKhoan = g.TrangThaiGhe == "Held" && g.GiuBoiTaiKhoanId == accountId,
                DangThanhToan = g.TrangThaiGhe == "Held" && g.GiuBoiTaiKhoanId == accountId &&
                                 g.GiuDenLuc != null && g.GiuDenLuc <= paymentThreshold,
                GiuDenLucRaw = g.TrangThaiGhe == "Held" && g.GiuBoiTaiKhoanId == accountId
                    ? g.GiuDenLuc
                    : null,
                g.PhienBan
            })
            .ToListAsync();

        var seatMap = seats.Select(seat => new
        {
            seat.MaGheChuyenBay,
            seat.SoGhe,
            seat.MaHangGhe,
            seat.TenHangGhe,
            seat.GiaGhe,
            seat.TrangThai,
            seat.LaGheCuaToi,
            seat.LaGheCuaTaiKhoan,
            seat.DangThanhToan,
            GiuDenLuc = seat.GiuDenLucRaw.HasValue
                ? new DateTimeOffset(DateTime.SpecifyKind(seat.GiuDenLucRaw.Value, DateTimeKind.Utc))
                : (DateTimeOffset?)null,
            seat.PhienBan
        });

        var services = await _db.DichVuThems.AsNoTracking()
            .Where(d => d.TrangThai == "Active")
            .Select(d => new { d.MaDichVu, d.TenDichVu, d.LoaiDichVu, d.KhoiLuongKg, d.Gia, d.MoTa, d.TrangThai })
            .ToListAsync();

        return Ok(new { flight, seats = seatMap, services, serverTime = DateTimeOffset.UtcNow });
    }

    [HttpPost("flights/{flightId:int}/seats/{seatId:int}/hold")]
    public async Task<IActionResult> HoldSeat(int flightId, int seatId, HoldSeatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.SessionId) || request.SessionId.Length > 80)
            return BadRequest(new { message = "Phiên chọn ghế không hợp lệ." });

        var accountId = GetAccountId();
        var now = DateTime.UtcNow;
        var holdUntil = now.Add(SelectionHoldDuration);

        await using var transaction = await _db.Database.BeginTransactionAsync();
        if (!await ReleaseExpiredSeats(flightId))
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Không thể xử lý ghế hết hạn." });

        var seat = await _db.GheChuyenBays
            .Include(g => g.GheMayBay)
            .FirstOrDefaultAsync(g => g.MaChuyenBay == flightId && g.MaGheChuyenBay == seatId);

        if (seat is null) return NotFound(new { message = "Không tìm thấy ghế trên chuyến bay này." });
        if (request.MaHangGhe.HasValue && seat.GheMayBay.MaHangGhe != request.MaHangGhe.Value)
            return BadRequest(new { message = "Ghế không thuộc hạng vé đã chọn." });

        var ownedByThisSession = seat.TrangThaiGhe == "Held" && seat.GiuBoiTaiKhoanId == accountId && seat.SessionId == request.SessionId;
        if (!ownedByThisSession && !string.Equals(seat.TrangThaiGhe, "Available", StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = "Ghế vừa được hành khách khác chọn. Vui lòng chọn ghế khác." });

        var selectedSeatCount = await _db.GheChuyenBays
            .Where(g => g.MaChuyenBay == flightId && g.TrangThaiGhe == "Held" &&
                        g.GiuBoiTaiKhoanId == accountId && g.SessionId == request.SessionId &&
                        g.MaGheChuyenBay != seatId)
            .CountAsync();

        var maxSeats = Math.Clamp(request.MaxSeats, 1, 9);
        if (!ownedByThisSession && selectedSeatCount >= maxSeats)
            return BadRequest(new { message = $"Bạn chỉ được chọn tối đa {maxSeats} ghế cho {maxSeats} hành khách." });

        seat.TrangThaiGhe = "Held";
        seat.GiuBoiTaiKhoanId = accountId;
        seat.SessionId = request.SessionId;
        seat.GiuDenLuc = holdUntil;
        seat.UpdatedAt = now;
        seat.PhienBan++;

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();
        return Ok(new { seat.MaGheChuyenBay, seat.GheMayBay.SoGhe, seat.GiaGhe, seat.GiuDenLuc, seat.PhienBan });
    }

    [HttpPost("flights/{flightId:int}/payment-hold")]
    public async Task<IActionResult> StartPaymentHold(int flightId, StartPaymentHoldRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.SessionId) || request.SessionId.Length > 80)
            return BadRequest(new { message = "Phiên chọn ghế không hợp lệ." });

        var expectedSeats = Math.Clamp(request.ExpectedSeats, 1, 9);
        if (request.SeatIds == null || request.SeatIds.Count != expectedSeats || request.SeatIds.Distinct().Count() != expectedSeats)
            return BadRequest(new { message = $"Vui lòng chọn đúng {expectedSeats} ghế khác nhau trước khi thanh toán." });

        var accountId = GetAccountId();
        var now = DateTime.UtcNow;
        var holdUntil = now.Add(PaymentHoldDuration);

        await using var transaction = await _db.Database.BeginTransactionAsync();
        if (!await ReleaseExpiredSeats(flightId))
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Không thể xử lý ghế hết hạn." });

        var seats = await _db.GheChuyenBays
            .Where(g => g.MaChuyenBay == flightId && request.SeatIds.Contains(g.MaGheChuyenBay))
            .ToListAsync();

        if (seats.Count != request.SeatIds.Count)
            return NotFound(new { message = "Một số ghế không tồn tại." });

        foreach (var seat in seats)
        {
            var ownedByThisSession = seat.TrangThaiGhe == "Held" && seat.GiuBoiTaiKhoanId == accountId && seat.SessionId == request.SessionId;
            if (!ownedByThisSession && !string.Equals(seat.TrangThaiGhe, "Available", StringComparison.OrdinalIgnoreCase))
                return Conflict(new { message = "Một số ghế đã bị hành khách khác chọn. Vui lòng thử lại." });

            seat.TrangThaiGhe = "Held";
            seat.GiuBoiTaiKhoanId = accountId;
            seat.SessionId = request.SessionId;
            seat.GiuDenLuc = holdUntil;
            seat.UpdatedAt = now;
            seat.PhienBan++;
        }

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return Ok(new
        {
            holdUntil = new DateTimeOffset(DateTime.SpecifyKind(holdUntil, DateTimeKind.Utc)),
            serverTime = DateTimeOffset.UtcNow
        });
    }

    [HttpDelete("flights/{flightId:int}/payment-hold")]
    public async Task<IActionResult> CancelPaymentHold(int flightId, [FromQuery] string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId))
            return BadRequest(new { message = "Phiên chọn ghế không hợp lệ." });

        var accountId = GetAccountId();
        var seats = await _db.GheChuyenBays
            .Where(g => g.MaChuyenBay == flightId && g.TrangThaiGhe == "Held" &&
                        g.GiuBoiTaiKhoanId == accountId && g.SessionId == sessionId)
            .ToListAsync();

        if (seats.Count == 0) return NoContent();

        var now = DateTime.UtcNow;
        foreach (var seat in seats)
        {
            ResetSeat(seat, now);
        }
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("flights/{flightId:int}/seats/{seatId:int}/hold")]
    public async Task<IActionResult> ReleaseSeat(int flightId, int seatId, [FromQuery] string sessionId)
    {
        var accountId = GetAccountId();
        var seat = await _db.GheChuyenBays.FirstOrDefaultAsync(g =>
            g.MaChuyenBay == flightId && g.MaGheChuyenBay == seatId &&
            g.TrangThaiGhe == "Held" && g.GiuBoiTaiKhoanId == accountId && g.SessionId == sessionId &&
            g.MaPhieuDatChoDangGiu == null);

        if (seat is null) return NoContent();
        ResetSeat(seat, DateTime.UtcNow);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private int GetAccountId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<bool> ReleaseExpiredSeats(int flightId)
    {
        try
        {
            var now = DateTime.UtcNow;
            var closure = await _closureService.CloseExpiredBookingsForFlightAsync(
                flightId,
                now,
                HttpContext.RequestAborted);
            if (closure.Failed)
            {
                return false;
            }

            var expired = await _db.GheChuyenBays
                .Where(g =>
                    g.MaChuyenBay == flightId &&
                    g.TrangThaiGhe == "Held" &&
                    g.MaPhieuDatChoDangGiu == null &&
                    g.GiuDenLuc < now)
                .ToListAsync(HttpContext.RequestAborted);
            foreach (var seat in expired) ResetSeat(seat, now);
            if (expired.Count > 0)
            {
                await _db.SaveChangesAsync(HttpContext.RequestAborted);
            }

            return true;
        }
        catch (OperationCanceledException) when (HttpContext.RequestAborted.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Could not close expired bookings before releasing seats. FlightId={FlightId}",
                flightId);
            return false;
        }
    }

    private static void ResetSeat(Models.GheChuyenBay seat, DateTime now)
    {
        seat.TrangThaiGhe = "Available";
        seat.GiuBoiTaiKhoanId = null;
        seat.MaPhieuDatChoDangGiu = null;
        seat.SessionId = null;
        seat.GiuDenLuc = null;
        seat.UpdatedAt = now;
        seat.PhienBan++;
    }

    public sealed record HoldSeatRequest(string SessionId, int? MaHangGhe, int MaxSeats = 1);
    public sealed record StartPaymentHoldRequest(string SessionId, int ExpectedSeats, List<int> SeatIds);
}
