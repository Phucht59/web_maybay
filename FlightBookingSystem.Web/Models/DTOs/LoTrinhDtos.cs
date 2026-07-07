using System.ComponentModel.DataAnnotations;

namespace FlightBookingSystem.Web.Models.DTOs
{
    public class LoTrinhRequest
    {
        [Required(ErrorMessage = "Vui lòng chọn sân bay đi")]
        [MaxLength(3, ErrorMessage = "Mã sân bay đi không được vượt quá 3 ký tự")]
        public string MaSanBayDi { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn sân bay đến")]
        [MaxLength(3, ErrorMessage = "Mã sân bay đến không được vượt quá 3 ký tự")]
        public string MaSanBayDen { get; set; } = string.Empty;

        [Range(typeof(decimal), "1", "79228162514264337593543950335", ErrorMessage = "Giá cơ bản phải lớn hơn 0")]
        public decimal GiaCoBan { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Khoảng cách phải lớn hơn 0")]
        public int? KhoangCachKm { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập loại đường bay")]
        [MaxLength(30, ErrorMessage = "Loại đường bay không được vượt quá 30 ký tự")]
        public string LoaiDuongBay { get; set; } = "Domestic";

        [Required(ErrorMessage = "Vui lòng nhập trạng thái")]
        [MaxLength(30, ErrorMessage = "Trạng thái không được vượt quá 30 ký tự")]
        public string TrangThai { get; set; } = "Active";
    }
}
