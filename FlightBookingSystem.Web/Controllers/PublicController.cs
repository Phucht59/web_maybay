using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlightBookingSystem.Web.Data;

namespace FlightBookingSystem.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous]
    public class PublicController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public PublicController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET /api/Public/airports-all?keyword=HAN&size=40
        [HttpGet("airports-all")]
        public async Task<IActionResult> GetAllAirports([FromQuery] string? keyword = null, [FromQuery] int size = 40)
        {
            var query = _db.SanBays.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToUpperInvariant();
                query = query.Where(s =>
                    s.MaSanBay.Contains(kw) ||
                    s.TenSanBay.ToUpper().Contains(kw) ||
                    s.ThanhPho.ToUpper().Contains(kw));
            }

            var airports = await query
                .OrderBy(s => s.MaSanBay)
                .Take(size)
                .Select(s => new
                {
                    s.MaSanBay,
                    s.TenSanBay,
                    s.ThanhPho,
                    s.QuocGia
                })
                .ToListAsync();

            return Ok(airports);
        }

        // GET /api/Public/airports?keyword=HAN
        [HttpGet("airports")]
        public async Task<IActionResult> GetAirports([FromQuery] string? keyword = null)
        {
            var query = _db.SanBays.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToUpperInvariant();
                query = query.Where(s =>
                    s.MaSanBay.Contains(kw) ||
                    s.TenSanBay.ToUpper().Contains(kw) ||
                    s.ThanhPho.ToUpper().Contains(kw));
            }

            var airports = await query
                .OrderBy(s => s.MaSanBay)
                .Take(20)
                .Select(s => new
                {
                    s.MaSanBay,
                    s.TenSanBay,
                    s.ThanhPho,
                    s.QuocGia
                })
                .ToListAsync();

            return Ok(airports);
        }

        // GET /api/Public/flights?maSanBayDi=HAN&maSanBayDen=SGN&ngayDi=2026-07-10
        [HttpGet("flights")]
        public async Task<IActionResult> SearchFlights(
            [FromQuery] string? maSanBayDi = null,
            [FromQuery] string? maSanBayDen = null,
            [FromQuery] DateTime? ngayDi = null)
        {
            var query = _db.ChuyenBays
                .AsNoTracking()
                .Include(c => c.LoTrinh).ThenInclude(l => l.SanBayDi)
                .Include(c => c.LoTrinh).ThenInclude(l => l.SanBayDen)
                .Include(c => c.MayBay).ThenInclude(m => m.HangBay)
                .Include(c => c.GheChuyenBays)
                    .ThenInclude(g => g.GheMayBay)
                    .ThenInclude(gmb => gmb.HangGhe)
                .Where(c => c.TrangThai == "Scheduled" || c.TrangThai == "Delayed");

            if (!string.IsNullOrWhiteSpace(maSanBayDi))
            {
                var from = maSanBayDi.Trim().ToUpperInvariant();
                query = query.Where(c => c.LoTrinh.MaSanBayDi == from);
            }

            if (!string.IsNullOrWhiteSpace(maSanBayDen))
            {
                var to = maSanBayDen.Trim().ToUpperInvariant();
                query = query.Where(c => c.LoTrinh.MaSanBayDen == to);
            }

            if (ngayDi.HasValue)
            {
                var start = ngayDi.Value.Date;
                var end = start.AddDays(1);
                query = query.Where(c => c.GioKhoiHanh >= start && c.GioKhoiHanh < end);
            }

            var flights = await query
                .OrderBy(c => c.GioKhoiHanh)
                .ToListAsync();

            var result = flights.Select(c =>
            {
                var availableSeats = c.GheChuyenBays
                    .Where(g => g.GheMayBay?.HangGhe != null && g.TrangThaiGhe == "Available")
                    .ToList();

                var fallbackSeats = c.GheChuyenBays
                    .Where(g => g.GheMayBay?.HangGhe != null)
                    .ToList();

                var seatSource = availableSeats.Count > 0 ? availableSeats : fallbackSeats;

                var hangGhe = seatSource
                    .GroupBy(g => new
                    {
                        g.GheMayBay.HangGhe.TenHangGhe,
                        g.GheMayBay.HangGhe.HeSoGia
                    })
                    .OrderBy(g => g.Key.HeSoGia)
                    .Select(g => new
                    {
                        ten = g.Key.TenHangGhe,
                        gia = g.Min(x => x.GiaGhe > 0 ? x.GiaGhe : c.GiaCoBan * g.Key.HeSoGia),
                        heSo = g.Key.HeSoGia
                    })
                    .ToList();

                return new
                {
                    c.MaChuyenBay,
                    c.SoHieuChuyenBay,
                    c.GioKhoiHanh,
                    c.GioHaCanh,
                    maSanBayDi = c.LoTrinh.MaSanBayDi,
                    tenSanBayDi = c.LoTrinh.SanBayDi.TenSanBay,
                    thanhPhoDi = c.LoTrinh.SanBayDi.ThanhPho,
                    maSanBayDen = c.LoTrinh.MaSanBayDen,
                    tenSanBayDen = c.LoTrinh.SanBayDen.TenSanBay,
                    thanhPhoDen = c.LoTrinh.SanBayDen.ThanhPho,
                    c.MaMayBay,
                    dongMayBay = c.MayBay.DongMayBay,
                    hangBay = c.MayBay.HangBay.TenHangBay,
                    maCodeHangBay = c.MayBay.HangBay.MaCode,
                    c.GiaCoBan,
                    c.TrangThai,
                    gheConTrong = availableSeats.Count,
                    hangGhe
                };
            });

            return Ok(new { flights = result, total = result.Count() });
        }
        // POST /api/Public/seed-database
        [HttpPost("seed-database")]
        public async Task<IActionResult> SeedDatabase([FromServices] IServiceProvider services)
        {
            await DatabaseSeeder.SeedAsync(services);
            return Ok(new { message = "Seeding completed successfully" });
        }
    }
}
