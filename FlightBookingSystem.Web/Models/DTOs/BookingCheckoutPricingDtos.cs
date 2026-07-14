namespace FlightBookingSystem.Web.Models.DTOs;

public sealed record CheckoutServicePricingDto(
    int MaDichVu,
    string TenDichVu,
    string LoaiDichVu,
    int? KhoiLuongKg,
    decimal Gia);

public sealed record CheckoutPassengerPricingDto(
    int ThuTuHanhKhach,
    int MaGheChuyenBay,
    decimal GiaGhe,
    IReadOnlyList<CheckoutServicePricingDto> DichVus,
    decimal TongTienDichVu,
    decimal ThanhTien);

public sealed record CheckoutPricingResponse(
    bool IsValid,
    string Message,
    int MaChuyenBay,
    int SoLuongHanhKhach,
    IReadOnlyList<CheckoutPassengerPricingDto> HanhKhachs,
    decimal TongTienGhe,
    decimal TongTienDichVu,
    decimal TongThanhToan,
    DateTimeOffset ServerTime);
