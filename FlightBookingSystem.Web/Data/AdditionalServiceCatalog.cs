using FlightBookingSystem.Web.Models;

namespace FlightBookingSystem.Web.Data;

public sealed record AdditionalServiceDefinition(
    string TenDichVu,
    string LoaiDichVu,
    int? KhoiLuongKg,
    decimal Gia,
    string? MoTa,
    string TrangThai);

public static class AdditionalServiceCatalog
{
    public static IReadOnlyList<AdditionalServiceDefinition> All { get; } =
    [
        new("20kg", "Baggage", 20, 350000m, null, "Active"),
        new("25kg", "Baggage", 25, 440000m, null, "Active"),
        new("30kg", "Baggage", 30, 520000m, null, "Active"),
        new("40kg", "Baggage", 40, 720000m, null, "Active"),
        new(
            "Bảo vệ chuyến đi",
            "Protection",
            null,
            120000m,
            "Hỗ trợ khi chuyến bay bị gián đoạn và bảo vệ chi phí phát sinh đủ điều kiện.",
            "Active"),
        new(
            "Bảo vệ linh hoạt",
            "Protection",
            null,
            250000m,
            "Bao gồm bảo vệ chuyến đi và quyền đổi lịch/hoàn vé theo điều kiện áp dụng.",
            "Active"),
    ];

    public static List<DichVuThem> CreateEntities() => All.Select(CreateEntity).ToList();

    public static DichVuThem CreateEntity(AdditionalServiceDefinition definition)
    {
        var service = new DichVuThem();
        Apply(service, definition);
        return service;
    }

    public static void Apply(DichVuThem service, AdditionalServiceDefinition definition)
    {
        service.TenDichVu = definition.TenDichVu;
        service.LoaiDichVu = definition.LoaiDichVu;
        service.KhoiLuongKg = definition.KhoiLuongKg;
        service.Gia = definition.Gia;
        service.MoTa = definition.MoTa;
        service.TrangThai = definition.TrangThai;
    }

    public static bool HasCanonicalValues(DichVuThem service, AdditionalServiceDefinition definition) =>
        string.Equals(service.TenDichVu, definition.TenDichVu, StringComparison.Ordinal) &&
        string.Equals(service.LoaiDichVu, definition.LoaiDichVu, StringComparison.Ordinal) &&
        service.KhoiLuongKg == definition.KhoiLuongKg &&
        service.Gia == definition.Gia &&
        string.Equals(service.MoTa, definition.MoTa, StringComparison.Ordinal) &&
        string.Equals(service.TrangThai, definition.TrangThai, StringComparison.Ordinal);
}
