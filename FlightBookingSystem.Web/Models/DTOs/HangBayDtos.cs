using System.ComponentModel.DataAnnotations;

namespace FlightBookingSystem.Web.Models.DTOs
{
    public class HangBayRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập tên hãng bay")]
        [MaxLength(160, ErrorMessage = "Tên hãng bay không được vượt quá 160 ký tự")]
        public string TenHangBay { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập mã code")]
        [MaxLength(10, ErrorMessage = "Mã code không được vượt quá 10 ký tự")]
        public string MaCode { get; set; } = string.Empty;

        [MaxLength(500, ErrorMessage = "Đường dẫn logo không được vượt quá 500 ký tự")]
        public string? LogoUrl { get; set; }

        [MaxLength(120, ErrorMessage = "Quốc gia không được vượt quá 120 ký tự")]
        public string? QuocGia { get; set; }
    }
}
