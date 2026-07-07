using System.ComponentModel.DataAnnotations;

namespace FlightBookingSystem.Web.Models.DTOs
{
    public class HangGheRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập tên hạng ghế")]
        [MaxLength(80, ErrorMessage = "Tên hạng ghế không được vượt quá 80 ký tự")]
        public string TenHangGhe { get; set; } = string.Empty;

        [Range(0.01, 100, ErrorMessage = "Hệ số giá phải lớn hơn 0")]
        public decimal HeSoGia { get; set; } = 1m;

        [MaxLength(500, ErrorMessage = "Mô tả không được vượt quá 500 ký tự")]
        public string? MoTa { get; set; }
    }
}
