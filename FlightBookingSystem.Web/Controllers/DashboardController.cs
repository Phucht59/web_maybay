using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlightBookingSystem.Web.Data;
using FlightBookingSystem.Web.Models.DTOs;

namespace FlightBookingSystem.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public DashboardController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: /api/Dashboard?timeFilter=all
        [HttpGet]
        public async Task<IActionResult> GetDashboard(string timeFilter = "all")
        {
            var hienTai = DateTime.Now;

            var response = new DashboardResponse
            {
                Summary = await BuildSummary(timeFilter),

                ChuyenBaySapKhoiHanh = await GetUpcomingFlightsQuery(hienTai)
                    .Take(7)
                    .ToListAsync()
            };

            return Ok(response);
        }

        // GET: /api/Dashboard/summary?timeFilter=all
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(string timeFilter = "all")
        {
            var response = await BuildSummary(timeFilter);
            return Ok(response);
        }

        // GET: /api/Dashboard/upcoming-flights?take=7
        [HttpGet("upcoming-flights")]
        public async Task<IActionResult> GetUpcomingFlights(int take = 7)
        {
            if (take < 1) take = 7;
            if (take > 50) take = 50;

            var hienTai = DateTime.Now;

            var data = await GetUpcomingFlightsQuery(hienTai)
                .Take(take)
                .ToListAsync();

            return Ok(data);
        }

        private async Task<DashboardSummaryResponse> BuildSummary(string timeFilter)
        {
            var range = GetDateRange(timeFilter);
            var flightQuery = _db.ChuyenBays.AsQueryable();

            if (range.Start.HasValue)
            {
                flightQuery = flightQuery.Where(c => c.GioKhoiHanh >= range.Start.Value);
            }

            if (range.End.HasValue)
            {
                flightQuery = flightQuery.Where(c => c.GioKhoiHanh < range.End.Value);
            }

            var isAll = !range.Start.HasValue && !range.End.HasValue;

            var soChuyenBay = await flightQuery.CountAsync();

            var soLoTrinhActive = isAll
                ? await _db.LoTrinhs.CountAsync(l => l.TrangThai == "Active")
                : await _db.LoTrinhs.CountAsync(l =>
                    l.TrangThai == "Active" &&
                    l.ChuyenBays.Any(c =>
                        (!range.Start.HasValue || c.GioKhoiHanh >= range.Start.Value) &&
                        (!range.End.HasValue || c.GioKhoiHanh < range.End.Value)));

            var soMayBayActive = isAll
                ? await _db.MayBays.CountAsync(m => m.TrangThai == "Active")
                : await _db.MayBays.CountAsync(m =>
                    m.TrangThai == "Active" &&
                    m.ChuyenBays.Any(c =>
                        (!range.Start.HasValue || c.GioKhoiHanh >= range.Start.Value) &&
                        (!range.End.HasValue || c.GioKhoiHanh < range.End.Value)));

            var soSanBay = isAll
                ? await _db.SanBays.CountAsync()
                : await flightQuery
                    .Select(c => c.LoTrinh.MaSanBayDi)
                    .Concat(flightQuery.Select(c => c.LoTrinh.MaSanBayDen))
                    .Distinct()
                    .CountAsync();

            return new DashboardSummaryResponse
            {
                SoChuyenBay = soChuyenBay,
                SoLoTrinhActive = soLoTrinhActive,
                SoMayBayActive = soMayBayActive,
                SoSanBay = soSanBay
            };
        }

        private static (DateTime? Start, DateTime? End) GetDateRange(string timeFilter)
        {
            var today = DateTime.Today;
            var filter = (timeFilter ?? "all").Trim().ToLower();

            return filter switch
            {
                "today" => (today, today.AddDays(1)),

                "7days" => (today, today.AddDays(7)),

                "30days" => (today, today.AddDays(30)),

                "thismonth" => (
                    new DateTime(today.Year, today.Month, 1),
                    new DateTime(today.Year, today.Month, 1).AddMonths(1)
                ),

                _ => (null, null)
            };
        }

        private IQueryable<UpcomingFlightResponse> GetUpcomingFlightsQuery(DateTime hienTai)
        {
            return _db.ChuyenBays
                .Include(c => c.LoTrinh)
                .Where(c => c.GioKhoiHanh >= hienTai && c.TrangThai != "Cancelled")
                .OrderBy(c => c.GioKhoiHanh)
                .Select(c => new UpcomingFlightResponse
                {
                    MaChuyenBay = c.MaChuyenBay,
                    SoHieuChuyenBay = c.SoHieuChuyenBay,
                    MaLoTrinh = c.MaLoTrinh,
                    MaSanBayDi = c.LoTrinh.MaSanBayDi,
                    MaSanBayDen = c.LoTrinh.MaSanBayDen,
                    LoTrinhHienThi = c.LoTrinh.MaSanBayDi + " → " + c.LoTrinh.MaSanBayDen,
                    GioKhoiHanh = c.GioKhoiHanh,
                    GioHaCanh = c.GioHaCanh,
                    TrangThai = c.TrangThai
                });
        }
    }
}