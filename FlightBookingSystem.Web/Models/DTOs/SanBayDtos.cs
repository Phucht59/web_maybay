using System.ComponentModel.DataAnnotations;

namespace FlightBookingSystem.Web.Models.DTOs
{
    public class SanBayRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập mã sân bay")]
        [StringLength(3, MinimumLength = 3, ErrorMessage = "Mã sân bay phải gồm đúng 3 ký tự")]
        public string MaSanBay { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập tên sân bay")]
        [MaxLength(200, ErrorMessage = "Tên sân bay không được vượt quá 200 ký tự")]
        public string TenSanBay { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập thành phố")]
        [MaxLength(120, ErrorMessage = "Thành phố không được vượt quá 120 ký tự")]
        public string ThanhPho { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng nhập quốc gia")]
        [MaxLength(120, ErrorMessage = "Quốc gia không được vượt quá 120 ký tự")]
        public string QuocGia { get; set; } = string.Empty;
    }
}
