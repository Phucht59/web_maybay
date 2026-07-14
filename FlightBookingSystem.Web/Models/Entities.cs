using System.ComponentModel.DataAnnotations;

namespace FlightBookingSystem.Web.Models
{
    public class TaiKhoan
    {
        public int MaTaiKhoan { get; set; }

        [MaxLength(256)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(160)]
        public string HoTen { get; set; } = string.Empty;

        public string MatKhauHash { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? SoDienThoai { get; set; }

        [MaxLength(30)]
        public string VaiTro { get; set; } = "Customer";

        [MaxLength(30)]
        public string TrangThai { get; set; } = "Active";

        public DateTime NgayTao { get; set; } = DateTime.UtcNow;

        public ICollection<PhieuDatCho> PhieuDatChos { get; set; } = new List<PhieuDatCho>();
        public ICollection<GheChuyenBay> GheDangGius { get; set; } = new List<GheChuyenBay>();
    }

    public class SanBay
    {
        [MaxLength(3)]
        public string MaSanBay { get; set; } = string.Empty;

        [MaxLength(200)]
        public string TenSanBay { get; set; } = string.Empty;

        [MaxLength(120)]
        public string ThanhPho { get; set; } = string.Empty;

        [MaxLength(120)]
        public string QuocGia { get; set; } = string.Empty;

        public ICollection<LoTrinh> LoTrinhDi { get; set; } = new List<LoTrinh>();
        public ICollection<LoTrinh> LoTrinhDen { get; set; } = new List<LoTrinh>();
    }

    public class HangBay
    {
        public int MaHangBay { get; set; }

        [MaxLength(160)]
        public string TenHangBay { get; set; } = string.Empty;

        [MaxLength(10)]
        public string MaCode { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? LogoUrl { get; set; }

        [MaxLength(120)]
        public string? QuocGia { get; set; }

        public ICollection<MayBay> MayBays { get; set; } = new List<MayBay>();
    }

    public class LoTrinh
    {
        public int MaLoTrinh { get; set; }

        [MaxLength(3)]
        public string MaSanBayDi { get; set; } = string.Empty;

        [MaxLength(3)]
        public string MaSanBayDen { get; set; } = string.Empty;

        public decimal GiaCoBan { get; set; }

        public int? KhoangCachKm { get; set; }

        [MaxLength(30)]
        public string LoaiDuongBay { get; set; } = "Domestic";

        [MaxLength(30)]
        public string TrangThai { get; set; } = "Active";

        public SanBay SanBayDi { get; set; } = null!;
        public SanBay SanBayDen { get; set; } = null!;
        public ICollection<ChuyenBay> ChuyenBays { get; set; } = new List<ChuyenBay>();
    }

    public class MayBay
    {
        public int MaMayBay { get; set; }
        public int MaHangBay { get; set; }

        [MaxLength(120)]
        public string DongMayBay { get; set; } = string.Empty;

        [MaxLength(40)]
        public string? SoHieuDangKy { get; set; }

        public int TongSoGhe { get; set; }

        [MaxLength(30)]
        public string TrangThai { get; set; } = "Active";

        public HangBay HangBay { get; set; } = null!;
        public ICollection<GheMayBay> GheMayBays { get; set; } = new List<GheMayBay>();
        public ICollection<ChuyenBay> ChuyenBays { get; set; } = new List<ChuyenBay>();
    }

    public class HangGhe
    {
        public int MaHangGhe { get; set; }

        [MaxLength(80)]
        public string TenHangGhe { get; set; } = string.Empty;

        public decimal HeSoGia { get; set; } = 1m;

        [MaxLength(500)]
        public string? MoTa { get; set; }

        public ICollection<GheMayBay> GheMayBays { get; set; } = new List<GheMayBay>();
    }

    public class GheMayBay
    {
        public int MaGheMayBay { get; set; }
        public int MaMayBay { get; set; }

        [MaxLength(10)]
        public string SoGhe { get; set; } = string.Empty;

        public int MaHangGhe { get; set; }
        public bool DangSuDung { get; set; } = true;

        public MayBay MayBay { get; set; } = null!;
        public HangGhe HangGhe { get; set; } = null!;
        public ICollection<GheChuyenBay> GheChuyenBays { get; set; } = new List<GheChuyenBay>();
    }

    public class ChuyenBay
    {
        public int MaChuyenBay { get; set; }

        [MaxLength(20)]
        public string SoHieuChuyenBay { get; set; } = string.Empty;

        public int MaLoTrinh { get; set; }
        public int MaMayBay { get; set; }

        public DateTime GioKhoiHanh { get; set; }
        public DateTime GioHaCanh { get; set; }

        [MaxLength(40)]
        public string? NhaGa { get; set; }

        [MaxLength(20)]
        public string? CuaLen { get; set; }

        public DateTime? GioBatDauCheckIn { get; set; }
        public DateTime? GioKetThucCheckIn { get; set; }
        public DateTime? GioLenMayBay { get; set; }
        public DateTime? GioKhoiHanhThucTe { get; set; }
        public DateTime? GioHaCanhThucTe { get; set; }

        [MaxLength(500)]
        public string? LyDoTreChuyen { get; set; }

        public decimal GiaCoBan { get; set; }

        [MaxLength(30)]
        public string TrangThai { get; set; } = "Scheduled";

        public LoTrinh LoTrinh { get; set; } = null!;
        public MayBay MayBay { get; set; } = null!;
        public ICollection<GheChuyenBay> GheChuyenBays { get; set; } = new List<GheChuyenBay>();
        public ICollection<ChangDatCho> ChangDatChos { get; set; } = new List<ChangDatCho>();
    }

    public class GheChuyenBay
    {
        public int MaGheChuyenBay { get; set; }
        public int MaChuyenBay { get; set; }
        public int MaGheMayBay { get; set; }

        [MaxLength(30)]
        public string TrangThaiGhe { get; set; } = "Available";

        public decimal GiaGhe { get; set; }
        public int PhienBan { get; set; }
        public int? MaPhieuDatChoDangGiu { get; set; }
        public DateTime? GiuDenLuc { get; set; }
        public int? GiuBoiTaiKhoanId { get; set; }

        [MaxLength(80)]
        public string? SessionId { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ChuyenBay ChuyenBay { get; set; } = null!;
        public GheMayBay GheMayBay { get; set; } = null!;
        public PhieuDatCho? PhieuDatChoDangGiu { get; set; }
        public TaiKhoan? GiuBoiTaiKhoan { get; set; }
        public ICollection<Ve> Ves { get; set; } = new List<Ve>();
    }

    public class PhieuDatCho
    {
        public int MaPhieuDatCho { get; set; }

        [MaxLength(12)]
        public string MaDatCho { get; set; } = string.Empty;

        public int? MaTaiKhoan { get; set; }

        [MaxLength(30)]
        public string LoaiChuyenDi { get; set; } = "OneWay";

        public int SoLuongHanhKhach { get; set; }
        public DateTime NgayDat { get; set; } = DateTime.UtcNow;
        public DateTime? GiuDenLuc { get; set; }
        public decimal TongTien { get; set; }

        [MaxLength(30)]
        public string TrangThai { get; set; } = "Holding";

        public DateTime NgayTao { get; set; } = DateTime.UtcNow;
        public DateTime NgayCapNhat { get; set; } = DateTime.UtcNow;

        public TaiKhoan? TaiKhoan { get; set; }
        public ICollection<ChangDatCho> ChangDatChos { get; set; } = new List<ChangDatCho>();
        public ICollection<HanhKhach> HanhKhachs { get; set; } = new List<HanhKhach>();
        public ICollection<GheChuyenBay> GheDangGius { get; set; } = new List<GheChuyenBay>();
        public ICollection<Ve> Ves { get; set; } = new List<Ve>();
        public ICollection<ThanhToan> ThanhToans { get; set; } = new List<ThanhToan>();
        public ICollection<ChiTietDichVu> ChiTietDichVus { get; set; } = new List<ChiTietDichVu>();
        public ICollection<HoanTien> HoanTiens { get; set; } = new List<HoanTien>();
    }

    public class ChangDatCho
    {
        public int MaChangDatCho { get; set; }
        public int MaPhieuDatCho { get; set; }
        public int MaChuyenBay { get; set; }

        [MaxLength(30)]
        public string LoaiChang { get; set; } = "Outbound";

        public int ThuTuChang { get; set; }

        public PhieuDatCho PhieuDatCho { get; set; } = null!;
        public ChuyenBay ChuyenBay { get; set; } = null!;
        public ICollection<Ve> Ves { get; set; } = new List<Ve>();
    }

    public class HanhKhach
    {
        public int MaHanhKhach { get; set; }
        public int MaPhieuDatCho { get; set; }

        [MaxLength(160)]
        public string HoTen { get; set; } = string.Empty;

        public DateTime? NgaySinh { get; set; }

        [MaxLength(20)]
        public string? GioiTinh { get; set; }

        [MaxLength(120)]
        public string? QuocTich { get; set; }

        [MaxLength(30)]
        public string LoaiGiayTo { get; set; } = "CCCD";

        [MaxLength(40)]
        public string SoGiayTo { get; set; } = string.Empty;

        public DateTime? NgayHetHanGiayTo { get; set; }

        [MaxLength(30)]
        public string LoaiHanhKhach { get; set; } = "Adult";

        public PhieuDatCho PhieuDatCho { get; set; } = null!;
        public ICollection<Ve> Ves { get; set; } = new List<Ve>();
    }

    public class Ve
    {
        public int MaVe { get; set; }
        public int MaPhieuDatCho { get; set; }
        public int MaChangDatCho { get; set; }
        public int MaGheChuyenBay { get; set; }
        public int MaHanhKhach { get; set; }

        [MaxLength(30)]
        public string SoVeDienTu { get; set; } = string.Empty;

        public decimal GiaVe { get; set; }

        [MaxLength(30)]
        public string TrangThaiVe { get; set; } = "Issued";

        public DateTime? NgayXuatVe { get; set; }
        public DateTime NgayTao { get; set; } = DateTime.UtcNow;

        public PhieuDatCho PhieuDatCho { get; set; } = null!;
        public ChangDatCho ChangDatCho { get; set; } = null!;
        public GheChuyenBay GheChuyenBay { get; set; } = null!;
        public HanhKhach HanhKhach { get; set; } = null!;
        public ICollection<ChiTietDichVu> ChiTietDichVus { get; set; } = new List<ChiTietDichVu>();
    }

    public class ThanhToan
    {
        public int MaThanhToan { get; set; }
        public int MaPhieuDatCho { get; set; }

        [MaxLength(30)]
        public string PhuongThuc { get; set; } = string.Empty;

        [MaxLength(80)]
        public string? NhaCungCap { get; set; }

        [MaxLength(120)]
        public string? MaGiaoDich { get; set; }

        [MaxLength(120)]
        public string? IdempotencyKey { get; set; }

        public DateTime NgayTao { get; set; } = DateTime.UtcNow;
        public DateTime? NgayThanhToan { get; set; }
        public decimal SoTien { get; set; }

        [MaxLength(30)]
        public string TrangThai { get; set; } = "Pending";

        [MaxLength(500)]
        public string? LyDoLoi { get; set; }

        public PhieuDatCho PhieuDatCho { get; set; } = null!;
        public ICollection<HoanTien> HoanTiens { get; set; } = new List<HoanTien>();
    }

    public class HoanTien
    {
        public int MaHoanTien { get; set; }
        public int MaThanhToan { get; set; }
        public int MaPhieuDatCho { get; set; }
        public decimal SoTienHoan { get; set; }

        [MaxLength(500)]
        public string? LyDo { get; set; }

        [MaxLength(30)]
        public string TrangThai { get; set; } = "Pending";

        [MaxLength(120)]
        public string? MaGiaoDichHoanTien { get; set; }

        public DateTime NgayTao { get; set; } = DateTime.UtcNow;
        public DateTime? NgayHoanTien { get; set; }

        public ThanhToan ThanhToan { get; set; } = null!;
        public PhieuDatCho PhieuDatCho { get; set; } = null!;
    }

    public class DichVuThem
    {
        public int MaDichVu { get; set; }

        [MaxLength(120)]
        public string TenDichVu { get; set; } = string.Empty;

        [MaxLength(30)]
        public string LoaiDichVu { get; set; } = "Baggage";

        public int? KhoiLuongKg { get; set; }
        public decimal Gia { get; set; }

        [MaxLength(500)]
        public string? MoTa { get; set; }

        [MaxLength(30)]
        public string TrangThai { get; set; } = "Active";

        public ICollection<ChiTietDichVu> ChiTietDichVus { get; set; } = new List<ChiTietDichVu>();
    }

    public class ChiTietDichVu
    {
        public int MaChiTietDichVu { get; set; }
        public int MaPhieuDatCho { get; set; }
        public int? MaVe { get; set; }
        public int MaDichVu { get; set; }
        public int SoLuong { get; set; } = 1;
        public decimal Gia { get; set; }

        public PhieuDatCho PhieuDatCho { get; set; } = null!;
        public Ve? Ve { get; set; }
        public DichVuThem DichVuThem { get; set; } = null!;
    }
}
