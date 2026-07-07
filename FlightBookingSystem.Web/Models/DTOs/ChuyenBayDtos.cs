using System.ComponentModel.DataAnnotations;

namespace FlightBookingSystem.Web.Models.DTOs
{
    public class ChuyenBayCreateRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập số hiệu chuyến bay")]
        [MaxLength(20)]
        public string SoHieuChuyenBay { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn lộ trình")]
        public int MaLoTrinh { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn máy bay")]
        public int MaMayBay { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập giờ khởi hành")]
        public DateTime GioKhoiHanh { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập giờ hạ cánh")]
        public DateTime GioHaCanh { get; set; }

        [MaxLength(40)]
        public string? NhaGa { get; set; }

        [MaxLength(20)]
        public string? CuaLen { get; set; }

        public DateTime? GioBatDauCheckIn { get; set; }

        public DateTime? GioKetThucCheckIn { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập giá cơ bản")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Giá cơ bản phải lớn hơn 0")]
        public decimal GiaCoBan { get; set; }
    }

    public class ChuyenBayUpdateRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập số hiệu chuyến bay")]
        [MaxLength(20)]
        public string SoHieuChuyenBay { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn lộ trình")]
        public int MaLoTrinh { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập giờ khởi hành")]
        public DateTime GioKhoiHanh { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập giờ hạ cánh")]
        public DateTime GioHaCanh { get; set; }

        [MaxLength(40)]
        public string? NhaGa { get; set; }

        [MaxLength(20)]
        public string? CuaLen { get; set; }

        public DateTime? GioBatDauCheckIn { get; set; }

        public DateTime? GioKetThucCheckIn { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập giá cơ bản")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Giá cơ bản phải lớn hơn 0")]
        public decimal GiaCoBan { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn trạng thái")]
        [MaxLength(30)]
        public string TrangThai { get; set; } = "Scheduled";
    }

    public class ChuyenBayStatusRequest
    {
        [Required(ErrorMessage = "Vui lòng chọn trạng thái")]
        [MaxLength(30)]
        public string TrangThai { get; set; } = string.Empty;
    }
}
