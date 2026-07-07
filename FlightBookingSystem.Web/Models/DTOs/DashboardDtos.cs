namespace FlightBookingSystem.Web.Models.DTOs
{
    public class DashboardResponse
    {
        public DashboardSummaryResponse Summary { get; set; } = new();
        public List<UpcomingFlightResponse> ChuyenBaySapKhoiHanh { get; set; } = new();
    }

    public class DashboardSummaryResponse
    {
        public int SoChuyenBay { get; set; }
        public int SoLoTrinhActive { get; set; }
        public int SoMayBayActive { get; set; }
        public int SoSanBay { get; set; }
    }

    public class UpcomingFlightResponse
    {
        public int MaChuyenBay { get; set; }
        public string SoHieuChuyenBay { get; set; } = string.Empty;
        public int MaLoTrinh { get; set; }
        public string MaSanBayDi { get; set; } = string.Empty;
        public string MaSanBayDen { get; set; } = string.Empty;
        public string LoTrinhHienThi { get; set; } = string.Empty;
        public DateTime GioKhoiHanh { get; set; }
        public DateTime GioHaCanh { get; set; }
        public string TrangThai { get; set; } = string.Empty;
    }
}