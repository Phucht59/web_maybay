using FlightBookingSystem.Web.Data;
using FlightBookingSystem.Web.Models.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FlightBookingSystem.Web.Services;

public sealed class CheckoutSummaryService
{
    private readonly ApplicationDbContext _db;

    public CheckoutSummaryService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<CheckoutSummaryResult> GetAsync(
        int accountId,
        bool isAdmin,
        int bookingId,
        CancellationToken cancellationToken)
    {
        if (accountId <= 0 || bookingId <= 0)
        {
            return Failure(CheckoutSummaryOutcome.BadRequest, "Mã tài khoản hoặc booking không hợp lệ.");
        }

        var booking = await _db.PhieuDatChos
            .AsNoTracking()
            .Where(item => item.MaPhieuDatCho == bookingId)
            .Select(item => new BookingData(
                item.MaPhieuDatCho,
                item.MaDatCho,
                item.MaTaiKhoan,
                item.HoTenLienHe,
                item.EmailLienHe,
                item.SoDienThoaiLienHe,
                item.LoaiChuyenDi,
                item.SoLuongHanhKhach,
                item.NgayDat,
                item.GiuDenLuc,
                item.TongTien,
                item.TrangThai))
            .SingleOrDefaultAsync(cancellationToken);

        if (booking is null)
        {
            return Failure(CheckoutSummaryOutcome.NotFound, "Không tìm thấy booking.");
        }

        if (!isAdmin && booking.MaTaiKhoan != accountId)
        {
            return Failure(CheckoutSummaryOutcome.Forbidden, "Bạn không có quyền xem booking này.");
        }

        var legs = await _db.ChangDatChos
            .AsNoTracking()
            .Where(item => item.MaPhieuDatCho == bookingId)
            .Select(item => new LegData(
                item.MaChangDatCho,
                item.MaChuyenBay,
                item.LoaiChang,
                item.ThuTuChang,
                item.ChuyenBay.SoHieuChuyenBay,
                item.ChuyenBay.MayBay.HangBay.TenHangBay,
                item.ChuyenBay.MayBay.HangBay.MaCode,
                item.ChuyenBay.MayBay.HangBay.LogoUrl,
                item.ChuyenBay.MayBay.DongMayBay,
                item.ChuyenBay.LoTrinh.SanBayDi.MaSanBay,
                item.ChuyenBay.LoTrinh.SanBayDi.TenSanBay,
                item.ChuyenBay.LoTrinh.SanBayDi.ThanhPho,
                item.ChuyenBay.LoTrinh.SanBayDi.QuocGia,
                item.ChuyenBay.LoTrinh.SanBayDen.MaSanBay,
                item.ChuyenBay.LoTrinh.SanBayDen.TenSanBay,
                item.ChuyenBay.LoTrinh.SanBayDen.ThanhPho,
                item.ChuyenBay.LoTrinh.SanBayDen.QuocGia,
                item.ChuyenBay.GioKhoiHanh,
                item.ChuyenBay.GioHaCanh,
                item.ChuyenBay.NhaGa,
                item.ChuyenBay.CuaLen,
                item.ChuyenBay.TrangThai))
            .ToListAsync(cancellationToken);

        if (!string.Equals(booking.LoaiChuyenDi, "OneWay", StringComparison.OrdinalIgnoreCase) ||
            legs.Count != 1 ||
            !string.Equals(legs[0].LoaiChang, "Outbound", StringComparison.OrdinalIgnoreCase) ||
            legs[0].ThuTuChang != 1)
        {
            return Failure(CheckoutSummaryOutcome.Conflict, "Booking không có đúng một chặng outbound hợp lệ.");
        }

        var outbound = legs[0];

        var passengers = await _db.HanhKhachs
            .AsNoTracking()
            .Where(item => item.MaPhieuDatCho == bookingId)
            .OrderBy(item => item.MaHanhKhach)
            .Select(item => new PassengerData(
                item.MaHanhKhach,
                item.HoTen,
                item.NgaySinh,
                item.GioiTinh,
                item.QuocTich,
                item.LoaiGiayTo,
                item.SoGiayTo,
                item.NgayHetHanGiayTo,
                item.LoaiHanhKhach))
            .ToListAsync(cancellationToken);

        if (passengers.Count != booking.SoLuongHanhKhach)
        {
            return Failure(CheckoutSummaryOutcome.Conflict, "Số hành khách không khớp snapshot booking.");
        }

        var tickets = await _db.Ves
            .AsNoTracking()
            .Where(item => item.MaPhieuDatCho == bookingId)
            .Select(item => new TicketData(
                item.MaVe,
                item.MaPhieuDatCho,
                item.MaChangDatCho,
                item.MaHanhKhach,
                item.SoVeDienTu,
                item.TrangThaiVe,
                item.NgayXuatVe,
                item.GiaVe,
                item.MaGheChuyenBay,
                item.GheChuyenBay.MaChuyenBay,
                item.GheChuyenBay.GheMayBay.SoGhe,
                item.GheChuyenBay.GheMayBay.MaHangGhe,
                item.GheChuyenBay.GheMayBay.HangGhe.TenHangGhe))
            .ToListAsync(cancellationToken);

        var passengerIds = passengers.Select(item => item.MaHanhKhach).ToHashSet();
        var ticketsByPassenger = tickets
            .GroupBy(item => item.MaHanhKhach)
            .ToDictionary(group => group.Key, group => group.ToList());

        if (tickets.Count != passengers.Count ||
            tickets.Any(item =>
                item.MaPhieuDatCho != bookingId ||
                item.MaChangDatCho != outbound.MaChangDatCho ||
                item.MaChuyenBay != outbound.MaChuyenBay ||
                !passengerIds.Contains(item.MaHanhKhach)) ||
            passengers.Any(item =>
                !ticketsByPassenger.TryGetValue(item.MaHanhKhach, out var passengerTickets) ||
                passengerTickets.Count != 1))
        {
            return Failure(CheckoutSummaryOutcome.Conflict, "Vé, hành khách, chặng hoặc ghế trong booking không nhất quán.");
        }

        var serviceDetails = await _db.ChiTietDichVus
            .AsNoTracking()
            .Where(item => item.MaPhieuDatCho == bookingId)
            .OrderBy(item => item.MaChiTietDichVu)
            .Select(item => new ServiceData(
                item.MaChiTietDichVu,
                item.MaPhieuDatCho,
                item.MaVe,
                item.MaHanhKhach,
                item.MaDichVu,
                item.DichVuThem.TenDichVu,
                item.DichVuThem.LoaiDichVu,
                item.DichVuThem.KhoiLuongKg,
                item.SoLuong,
                item.Gia))
            .ToListAsync(cancellationToken);

        var ticketsById = tickets.ToDictionary(item => item.MaVe);
        if (serviceDetails.Any(item =>
                item.MaPhieuDatCho != bookingId ||
                item.MaHanhKhach is null ||
                !passengerIds.Contains(item.MaHanhKhach.Value) ||
                item.MaVe is not null &&
                (!ticketsById.TryGetValue(item.MaVe.Value, out var serviceTicket) ||
                 serviceTicket.MaHanhKhach != item.MaHanhKhach.Value)))
        {
            return Failure(CheckoutSummaryOutcome.Conflict, "Dịch vụ không liên kết đúng với hành khách và vé của booking.");
        }

        var servicesByPassenger = serviceDetails
            .GroupBy(item => item.MaHanhKhach!.Value)
            .ToDictionary(group => group.Key, group => group.ToList());

        var totalSeatPrice = tickets.Sum(item => item.GiaVe);
        var totalServicePrice = serviceDetails.Sum(item => item.Gia * item.SoLuong);
        if (totalSeatPrice + totalServicePrice != booking.TongTien)
        {
            return Failure(CheckoutSummaryOutcome.Conflict, "Tổng tiền snapshot không khớp tổng tiền booking.");
        }

        var passengerDtos = new List<CheckoutSummaryPassengerDto>(passengers.Count);
        for (var index = 0; index < passengers.Count; index++)
        {
            var passenger = passengers[index];
            var ticket = ticketsByPassenger[passenger.MaHanhKhach][0];
            var passengerServices = servicesByPassenger.GetValueOrDefault(passenger.MaHanhKhach) ?? [];
            var serviceDtos = passengerServices
                .Select(item => new CheckoutSummaryServiceDto(
                    item.MaDichVu,
                    item.TenDichVu,
                    item.LoaiDichVu,
                    item.KhoiLuongKg,
                    item.SoLuong,
                    item.Gia,
                    item.Gia * item.SoLuong))
                .ToList();
            var passengerServiceTotal = serviceDtos.Sum(item => item.ThanhTien);

            passengerDtos.Add(new CheckoutSummaryPassengerDto(
                index + 1,
                passenger.MaHanhKhach,
                passenger.HoTen,
                ToDateOnly(passenger.NgaySinh),
                passenger.GioiTinh,
                passenger.QuocTich,
                passenger.LoaiGiayTo,
                passenger.SoGiayTo,
                ToDateOnly(passenger.NgayHetHanGiayTo),
                passenger.LoaiHanhKhach,
                new CheckoutSummaryTicketDto(
                    ticket.MaVe,
                    ticket.SoVeDienTu,
                    ticket.TrangThaiVe,
                    ToUtc(ticket.NgayXuatVe),
                    ticket.GiaVe,
                    new CheckoutSummarySeatDto(
                        ticket.MaGheChuyenBay,
                        ticket.SoGhe,
                        ticket.MaHangGhe,
                        ticket.TenHangGhe)),
                serviceDtos,
                passengerServiceTotal,
                ticket.GiaVe + passengerServiceTotal));
        }

        var serverTime = DateTimeOffset.UtcNow;
        var response = new CheckoutSummaryResponse(
            booking.MaPhieuDatCho,
            booking.MaDatCho,
            booking.LoaiChuyenDi,
            booking.SoLuongHanhKhach,
            booking.TrangThai,
            ToUtc(booking.NgayDat),
            ToUtc(booking.GiuDenLuc),
            new CheckoutSummaryContactDto(
                booking.HoTenLienHe,
                booking.EmailLienHe,
                booking.SoDienThoaiLienHe),
            new CheckoutSummaryFlightDto(
                outbound.MaChuyenBay,
                outbound.SoHieuChuyenBay,
                outbound.TenHangBay,
                outbound.MaHangBay,
                outbound.LogoHangBay,
                outbound.DongMayBay,
                new CheckoutSummaryAirportDto(
                    outbound.MaSanBayDi,
                    outbound.TenSanBayDi,
                    outbound.ThanhPhoDi,
                    outbound.QuocGiaDi),
                new CheckoutSummaryAirportDto(
                    outbound.MaSanBayDen,
                    outbound.TenSanBayDen,
                    outbound.ThanhPhoDen,
                    outbound.QuocGiaDen),
                ToUtc(outbound.GioKhoiHanh),
                ToUtc(outbound.GioHaCanh),
                outbound.NhaGa,
                outbound.CuaLen,
                outbound.TrangThai),
            passengerDtos,
            new CheckoutSummaryPricingDto(
                totalSeatPrice,
                totalServicePrice,
                booking.TongTien),
            serverTime);

        return new CheckoutSummaryResult(
            CheckoutSummaryOutcome.Success,
            "Lấy checkout summary thành công.",
            response);
    }

    private static CheckoutSummaryResult Failure(CheckoutSummaryOutcome outcome, string message) =>
        new(outcome, message);

    private static DateOnly? ToDateOnly(DateTime? value) =>
        value.HasValue ? DateOnly.FromDateTime(value.Value) : null;

    private static DateTimeOffset ToUtc(DateTime value) =>
        new(DateTime.SpecifyKind(value, DateTimeKind.Utc));

    private static DateTimeOffset? ToUtc(DateTime? value) =>
        value.HasValue ? ToUtc(value.Value) : null;

    private sealed record BookingData(
        int MaPhieuDatCho,
        string MaDatCho,
        int? MaTaiKhoan,
        string HoTenLienHe,
        string EmailLienHe,
        string SoDienThoaiLienHe,
        string LoaiChuyenDi,
        int SoLuongHanhKhach,
        DateTime NgayDat,
        DateTime? GiuDenLuc,
        decimal TongTien,
        string TrangThai);

    private sealed record LegData(
        int MaChangDatCho,
        int MaChuyenBay,
        string LoaiChang,
        int ThuTuChang,
        string SoHieuChuyenBay,
        string TenHangBay,
        string MaHangBay,
        string? LogoHangBay,
        string DongMayBay,
        string MaSanBayDi,
        string TenSanBayDi,
        string ThanhPhoDi,
        string QuocGiaDi,
        string MaSanBayDen,
        string TenSanBayDen,
        string ThanhPhoDen,
        string QuocGiaDen,
        DateTime GioKhoiHanh,
        DateTime GioHaCanh,
        string? NhaGa,
        string? CuaLen,
        string TrangThai);

    private sealed record PassengerData(
        int MaHanhKhach,
        string HoTen,
        DateTime? NgaySinh,
        string? GioiTinh,
        string? QuocTich,
        string LoaiGiayTo,
        string SoGiayTo,
        DateTime? NgayHetHanGiayTo,
        string LoaiHanhKhach);

    private sealed record TicketData(
        int MaVe,
        int MaPhieuDatCho,
        int MaChangDatCho,
        int MaHanhKhach,
        string? SoVeDienTu,
        string TrangThaiVe,
        DateTime? NgayXuatVe,
        decimal GiaVe,
        int MaGheChuyenBay,
        int MaChuyenBay,
        string SoGhe,
        int MaHangGhe,
        string TenHangGhe);

    private sealed record ServiceData(
        int MaChiTietDichVu,
        int MaPhieuDatCho,
        int? MaVe,
        int? MaHanhKhach,
        int MaDichVu,
        string TenDichVu,
        string LoaiDichVu,
        int? KhoiLuongKg,
        int SoLuong,
        decimal Gia);
}
