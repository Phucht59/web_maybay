namespace FlightBookingSystem.Web.Models.DTOs;

public sealed record CheckoutSummaryContactDto(
    string HoTenLienHe,
    string EmailLienHe,
    string SoDienThoaiLienHe);

public sealed record CheckoutSummaryAirportDto(
    string MaSanBay,
    string TenSanBay,
    string ThanhPho,
    string QuocGia);

public sealed record CheckoutSummaryFlightDto(
    int MaChuyenBay,
    string SoHieuChuyenBay,
    string TenHangBay,
    string MaHangBay,
    string? LogoHangBay,
    string DongMayBay,
    CheckoutSummaryAirportDto SanBayDi,
    CheckoutSummaryAirportDto SanBayDen,
    DateTimeOffset GioKhoiHanh,
    DateTimeOffset GioHaCanh,
    string? NhaGa,
    string? CuaLen,
    string TrangThai);

public sealed record CheckoutSummarySeatDto(
    int MaGheChuyenBay,
    string SoGhe,
    int MaHangGhe,
    string TenHangGhe);

public sealed record CheckoutSummaryTicketDto(
    int MaVe,
    string? SoVeDienTu,
    string TrangThaiVe,
    DateTimeOffset? NgayXuatVe,
    decimal GiaVe,
    CheckoutSummarySeatDto Ghe);

public sealed record CheckoutSummaryServiceDto(
    int MaDichVu,
    string TenDichVu,
    string LoaiDichVu,
    int? KhoiLuongKg,
    int SoLuong,
    decimal DonGia,
    decimal ThanhTien);

public sealed record CheckoutSummaryPassengerDto(
    int ThuTuHanhKhach,
    int MaHanhKhach,
    string HoTen,
    DateOnly? NgaySinh,
    string? GioiTinh,
    string? QuocTich,
    string LoaiGiayTo,
    string SoGiayTo,
    DateOnly? NgayHetHanGiayTo,
    string LoaiHanhKhach,
    CheckoutSummaryTicketDto Ve,
    IReadOnlyList<CheckoutSummaryServiceDto> DichVus,
    decimal TongTienDichVu,
    decimal ThanhTien);

public sealed record CheckoutSummaryPricingDto(
    decimal TongTienGhe,
    decimal TongTienDichVu,
    decimal TongThanhToan);

public sealed record CheckoutSummaryResponse(
    int MaPhieuDatCho,
    string MaDatCho,
    string LoaiChuyenDi,
    int SoLuongHanhKhach,
    string TrangThai,
    DateTimeOffset NgayDat,
    DateTimeOffset? GiuDenLuc,
    CheckoutSummaryContactDto ThongTinLienHe,
    CheckoutSummaryFlightDto ChuyenBay,
    IReadOnlyList<CheckoutSummaryPassengerDto> HanhKhachs,
    CheckoutSummaryPricingDto Pricing,
    DateTimeOffset ServerTime);

public enum CheckoutSummaryOutcome
{
    Success,
    BadRequest,
    Forbidden,
    NotFound,
    Conflict
}

public sealed record CheckoutSummaryResult(
    CheckoutSummaryOutcome Outcome,
    string Message,
    CheckoutSummaryResponse? Response = null)
{
    public bool IsSuccess =>
        Outcome == CheckoutSummaryOutcome.Success &&
        Response is not null;
}
