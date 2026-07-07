using System.ComponentModel.DataAnnotations;

namespace FlightBookingSystem.Web.Models.DTOs
{
    public class MayBayRequest
    {
        [Required(ErrorMessage = "Vui lòng chọn hãng bay")]
        public int MaHangBay { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập dòng máy bay")]
        [MaxLength(120, ErrorMessage = "Dòng máy bay không được vượt quá 120 ký tự")]
        public string DongMayBay { get; set; } = string.Empty;

        [MaxLength(40, ErrorMessage = "Số hiệu đăng ký không được vượt quá 40 ký tự")]
        public string? SoHieuDangKy { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Tổng số ghế phải lớn hơn 0")]
        public int TongSoGhe { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập trạng thái")]
        [MaxLength(30, ErrorMessage = "Trạng thái không được vượt quá 30 ký tự")]
        public string TrangThai { get; set; } = "Active";
    }
}
