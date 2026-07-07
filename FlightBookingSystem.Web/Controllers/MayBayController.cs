using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlightBookingSystem.Web.Data;
using FlightBookingSystem.Web.Helpers;
using FlightBookingSystem.Web.Models;
using FlightBookingSystem.Web.Models.DTOs;

namespace FlightBookingSystem.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class MayBayController : ControllerBase
    {
        private const int PageSize = 5;
        private readonly ApplicationDbContext _db;

        public MayBayController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: api/MayBay?tuKhoa=A321&page=1
        [HttpGet]
        public async Task<IActionResult> GetAll(string? tuKhoa = null, int page = 1)
        {
            // Tải toàn bộ máy bay (kèm hãng bay) về rồi lọc bằng C# thay vì để EF Core dịch
            // Where(...) xuống SQLite — xem giải thích trong Helpers/SearchHelper.cs.
            var allAircrafts = await _db.MayBays
                .AsNoTracking()
                .Include(m => m.HangBay)
                .ToListAsync();

            IEnumerable<MayBay> filtered = allAircrafts;

            if (!string.IsNullOrWhiteSpace(tuKhoa))
            {
                var keyword = tuKhoa.Trim();

                filtered = filtered.Where(m =>
                    m.DongMayBay.ContainsKeyword(keyword) ||
                    m.SoHieuDangKy.ContainsKeyword(keyword) ||
                    m.TrangThai.ContainsKeyword(keyword) ||
                    (m.HangBay != null && m.HangBay.TenHangBay.ContainsKeyword(keyword)) ||
                    (m.HangBay != null && m.HangBay.MaHangBay.ToString().Contains(keyword)) ||
                    m.TongSoGhe.ToString().Contains(keyword));
            }

            var filteredList = filtered
                .OrderBy(m => m.DongMayBay)
                .ThenBy(m => m.SoHieuDangKy)
                .ToList();

            var totalCount = filteredList.Count;
            var totalPages = Math.Max(1, (int)Math.Ceiling(totalCount / (double)PageSize));
            page = Math.Clamp(page, 1, totalPages);

            var airplanes = filteredList
                .Skip((page - 1) * PageSize)
                .Take(PageSize)
                .Select(m => new
                {
                    m.MaMayBay,
                    m.MaHangBay,
                    m.DongMayBay,
                    m.SoHieuDangKy,
                    m.TongSoGhe,
                    m.TrangThai,
                    HangBay = new
                    {
                        m.HangBay.MaHangBay,
                        m.HangBay.TenHangBay,
                        m.HangBay.MaCode,
                        m.HangBay.LogoUrl
                    }
                })
                .ToList();

            var airplaneIds = airplanes.Select(m => m.MaMayBay).ToList();

            var flightCounts = await _db.ChuyenBays
                .AsNoTracking()
                .Where(c => airplaneIds.Contains(c.MaMayBay))
                .GroupBy(c => c.MaMayBay)
                .Select(g => new { MaMayBay = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.MaMayBay, x => x.Count);

            var seatCounts = await _db.GheMayBays
                .AsNoTracking()
                .Where(g => airplaneIds.Contains(g.MaMayBay))
                .GroupBy(g => g.MaMayBay)
                .Select(g => new { MaMayBay = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.MaMayBay, x => x.Count);

            var data = airplanes.Select(m => new
            {
                m.MaMayBay,
                m.MaHangBay,
                m.DongMayBay,
                m.SoHieuDangKy,
                m.TongSoGhe,
                m.TrangThai,
                m.HangBay,
                SoGheDaKhaiBao = seatCounts.GetValueOrDefault(m.MaMayBay),
                SoChuyenBayDangLienKet = flightCounts.GetValueOrDefault(m.MaMayBay)
            });

            return Ok(new
            {
                data,
                pagination = new
                {
                    page,
                    pageSize = PageSize,
                    totalCount,
                    totalPages,
                    startItem = totalCount == 0 ? 0 : ((page - 1) * PageSize) + 1,
                    endItem = Math.Min(page * PageSize, totalCount)
                },
                filters = new
                {
                    tuKhoa = tuKhoa ?? string.Empty
                }
            });
        }

        // GET: api/MayBay/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _db.MayBays
                .AsNoTracking()
                .Include(m => m.HangBay)
                .FirstOrDefaultAsync(m => m.MaMayBay == id);

            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy máy bay." });
            }

            var flights = await _db.ChuyenBays
                .AsNoTracking()
                .Where(c => c.MaMayBay == id)
                .Select(c => new
                {
                    c.MaChuyenBay,
                    c.SoHieuChuyenBay,
                    c.GioKhoiHanh,
                    c.GioHaCanh,
                    c.TrangThai
                })
                .ToListAsync();

            var monthStart = DateTime.Now.AddDays(-30);

            var totalFlightHours = flights
                .Where(c => c.GioHaCanh > c.GioKhoiHanh)
                .Sum(c => (c.GioHaCanh - c.GioKhoiHanh).TotalHours);

            var monthlyFlightHours = flights
                .Where(c => c.GioKhoiHanh >= monthStart && c.GioHaCanh > c.GioKhoiHanh)
                .Sum(c => (c.GioHaCanh - c.GioKhoiHanh).TotalHours);

            var seatCount = await _db.GheMayBays
                .AsNoTracking()
                .CountAsync(g => g.MaMayBay == id);

            return Ok(new
            {
                item.MaMayBay,
                item.MaHangBay,
                item.DongMayBay,
                item.SoHieuDangKy,
                item.TongSoGhe,
                item.TrangThai,
                HangBay = new
                {
                    item.HangBay.MaHangBay,
                    item.HangBay.TenHangBay,
                    item.HangBay.MaCode,
                    item.HangBay.LogoUrl
                },
                SoGheDaKhaiBao = seatCount,
                TongSoGioBay = Math.Round(totalFlightHours, 0),
                SoGioBay30NgayGanNhat = Math.Round(monthlyFlightHours, 0),
                TongSoChuyenBay = flights.Count,
                SoChuyenBay30NgayGanNhat = flights.Count(c => c.GioKhoiHanh >= monthStart)
            });
        }

        // GET: api/MayBay/hang-bay-options
        [HttpGet("hang-bay-options")]
        public async Task<IActionResult> GetHangBayOptions()
        {
            var data = await _db.HangBays
                .AsNoTracking()
                .OrderBy(h => h.TenHangBay)
                .Select(h => new
                {
                    h.MaHangBay,
                    h.TenHangBay,
                    h.MaCode,
                    label = h.TenHangBay + " (" + h.MaCode + ")"
                })
                .ToListAsync();

            return Ok(data);
        }

        // POST: api/MayBay
        [HttpPost]
        public async Task<IActionResult> Create(MayBayRequest request)
        {
            await ValidateAndNormalize(request);

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var model = new MayBay
            {
                MaHangBay = request.MaHangBay,
                DongMayBay = request.DongMayBay,
                SoHieuDangKy = request.SoHieuDangKy,
                TongSoGhe = request.TongSoGhe,
                TrangThai = request.TrangThai
            };

            _db.MayBays.Add(model);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = model.MaMayBay }, new
            {
                message = "Tạo máy bay thành công.",
                data = new
                {
                    model.MaMayBay,
                    model.MaHangBay,
                    model.DongMayBay,
                    model.SoHieuDangKy,
                    model.TongSoGhe,
                    model.TrangThai
                }
            });
        }

        // PUT: api/MayBay/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, MayBayRequest request)
        {
            var item = await _db.MayBays.FindAsync(id);
            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy máy bay." });
            }

            await ValidateAndNormalize(request, id);

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            item.MaHangBay = request.MaHangBay;
            item.DongMayBay = request.DongMayBay;
            item.SoHieuDangKy = request.SoHieuDangKy;
            item.TongSoGhe = request.TongSoGhe;
            item.TrangThai = request.TrangThai;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật máy bay thành công.",
                data = new
                {
                    item.MaMayBay,
                    item.MaHangBay,
                    item.DongMayBay,
                    item.SoHieuDangKy,
                    item.TongSoGhe,
                    item.TrangThai
                }
            });
        }

        // DELETE: api/MayBay/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _db.MayBays.FindAsync(id);
            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy máy bay." });
            }

            var flightCount = await _db.ChuyenBays.CountAsync(c => c.MaMayBay == id);
            if (flightCount > 0)
            {
                return Conflict(new
                {
                    message = $"Không thể xóa máy bay {item.DongMayBay} vì đang được gán cho {flightCount} chuyến bay."
                });
            }

            var seatCount = await _db.GheMayBays.CountAsync(g => g.MaMayBay == id);
            if (seatCount > 0)
            {
                return Conflict(new
                {
                    message = $"Không thể xóa máy bay {item.DongMayBay} vì đã khai báo {seatCount} ghế."
                });
            }

            _db.MayBays.Remove(item);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Xóa máy bay thành công." });
        }

        private async Task ValidateAndNormalize(MayBayRequest request, int? currentId = null)
        {
            request.DongMayBay = (request.DongMayBay ?? string.Empty).Trim();
            request.SoHieuDangKy = string.IsNullOrWhiteSpace(request.SoHieuDangKy)
                ? null
                : request.SoHieuDangKy.Trim().ToUpperInvariant();
            request.TrangThai = string.IsNullOrWhiteSpace(request.TrangThai)
                ? "Active"
                : request.TrangThai.Trim();

            var airlineExists = await _db.HangBays.AnyAsync(h => h.MaHangBay == request.MaHangBay);
            if (!airlineExists)
            {
                ModelState.AddModelError(nameof(request.MaHangBay), "Hãng bay không tồn tại.");
            }

            if (!string.IsNullOrWhiteSpace(request.SoHieuDangKy))
            {
                var duplicateRegistration = await _db.MayBays.AnyAsync(m =>
                    m.SoHieuDangKy == request.SoHieuDangKy &&
                    (!currentId.HasValue || m.MaMayBay != currentId.Value));

                if (duplicateRegistration)
                {
                    ModelState.AddModelError(nameof(request.SoHieuDangKy), "Số hiệu đăng ký đã tồn tại.");
                }
            }
        }
    }
}