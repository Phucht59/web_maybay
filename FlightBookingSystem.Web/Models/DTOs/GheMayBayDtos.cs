using System.ComponentModel.DataAnnotations;

namespace FlightBookingSystem.Web.Models.DTOs
{
    public class SeatClassGenerateRequest
    {
        [Required(ErrorMessage = "Vui lòng chọn hạng ghế")]
        public int MaHangGhe { get; set; }

        [Range(1, 999, ErrorMessage = "Hàng bắt đầu phải từ 1 đến 999")]
        public int SoHangBatDau { get; set; } = 1;

        [Range(0, 200, ErrorMessage = "Số hàng phải từ 0 đến 200")]
        public int SoHang { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập cột ghế")]
        [MaxLength(20, ErrorMessage = "Cột ghế không được vượt quá 20 ký tự")]
        public string CotGhe { get; set; } = "ABCDEF";
    }

    public class GenerateSeatMapRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập mã máy bay")]
        public int MaMayBay { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập cấu hình sinh ghế")]
        [MinLength(1, ErrorMessage = "Phải có ít nhất 1 cấu hình hạng ghế")]
        public List<SeatClassGenerateRequest> Rows { get; set; } = new();
    }

    public class GheMayBayUpdateRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập số ghế")]
        [MaxLength(10, ErrorMessage = "Số ghế không được vượt quá 10 ký tự")]
        public string SoGhe { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn hạng ghế")]
        public int MaHangGhe { get; set; }

        public bool DangSuDung { get; set; } = true;
    }
}
