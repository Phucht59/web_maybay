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
    public class LoTrinhController : ControllerBase
    {
        private const int PageSize = 5;
        private readonly ApplicationDbContext _db;

        public LoTrinhController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: api/LoTrinh?tuKhoa=HAN&page=1
        [HttpGet]
        public async Task<IActionResult> GetAll(string? tuKhoa = null, int page = 1)
        {
            // Tải toàn bộ lộ trình (kèm sân bay đi/đến) về rồi lọc bằng C#
            // — xem giải thích trong Helpers/SearchHelper.cs.
            var allRoutes = await _db.LoTrinhs
                .AsNoTracking()
                .Include(l => l.SanBayDi)
                .Include(l => l.SanBayDen)
                .ToListAsync();

            IEnumerable<LoTrinh> filtered = allRoutes;

            if (!string.IsNullOrWhiteSpace(tuKhoa))
            {
                var keyword = tuKhoa.Trim();
                filtered = filtered.Where(l =>
                    l.MaSanBayDi.ContainsKeyword(keyword) ||
                    l.MaSanBayDen.ContainsKeyword(keyword) ||
                    l.SanBayDi.TenSanBay.ContainsKeyword(keyword) ||
                    l.SanBayDen.TenSanBay.ContainsKeyword(keyword) ||
                    l.SanBayDi.ThanhPho.ContainsKeyword(keyword) ||
                    l.SanBayDen.ThanhPho.ContainsKeyword(keyword) ||
                    l.LoaiDuongBay.ContainsKeyword(keyword) ||
                    l.TrangThai.ContainsKeyword(keyword));
            }

            var filteredList = filtered
                .OrderBy(l => l.MaSanBayDi)
                .ThenBy(l => l.MaSanBayDen)
                .ToList();

            var totalCount = filteredList.Count;
            var totalPages = Math.Max(1, (int)Math.Ceiling(totalCount / (double)PageSize));
            page = Math.Clamp(page, 1, totalPages);

            var routes = filteredList
                .Skip((page - 1) * PageSize)
                .Take(PageSize)
                .Select(l => new
                {
                    l.MaLoTrinh,
                    l.MaSanBayDi,
                    l.MaSanBayDen,
                    l.GiaCoBan,
                    l.KhoangCachKm,
                    l.LoaiDuongBay,
                    l.TrangThai,
                    SanBayDi = new
                    {
                        l.SanBayDi.MaSanBay,
                        l.SanBayDi.TenSanBay,
                        l.SanBayDi.ThanhPho,
                        l.SanBayDi.QuocGia
                    },
                    SanBayDen = new
                    {
                        l.SanBayDen.MaSanBay,
                        l.SanBayDen.TenSanBay,
                        l.SanBayDen.ThanhPho,
                        l.SanBayDen.QuocGia
                    }
                })
                .ToList();

            var routeIds = routes.Select(l => l.MaLoTrinh).ToList();
            var flightCounts = await _db.ChuyenBays
                .AsNoTracking()
                .Where(c => routeIds.Contains(c.MaLoTrinh))
                .GroupBy(c => c.MaLoTrinh)
                .Select(g => new { MaLoTrinh = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.MaLoTrinh, x => x.Count);

            var data = routes.Select(l => new
            {
                l.MaLoTrinh,
                l.MaSanBayDi,
                l.MaSanBayDen,
                l.GiaCoBan,
                l.KhoangCachKm,
                l.LoaiDuongBay,
                l.TrangThai,
                l.SanBayDi,
                l.SanBayDen,
                SoChuyenBayDangLienKet = flightCounts.GetValueOrDefault(l.MaLoTrinh)
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

        // GET: api/LoTrinh/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _db.LoTrinhs
                .AsNoTracking()
                .Include(l => l.SanBayDi)
                .Include(l => l.SanBayDen)
                .FirstOrDefaultAsync(l => l.MaLoTrinh == id);

            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy lộ trình." });
            }

            var now = DateTime.Now;
            var fromDate = now.AddDays(-30);

            var flightsLast30Days = await _db.ChuyenBays
                .AsNoTracking()
                .Where(c => c.MaLoTrinh == id && c.GioKhoiHanh >= fromDate && c.GioKhoiHanh <= now)
                .Select(c => new
                {
                    c.MaChuyenBay,
                    c.SoHieuChuyenBay,
                    c.GioKhoiHanh,
                    c.GioHaCanh,
                    c.GioHaCanhThucTe,
                    c.TrangThai
                })
                .ToListAsync();

            var completedFlights = flightsLast30Days
                .Count(c => string.Equals(c.TrangThai, "Completed", StringComparison.OrdinalIgnoreCase));

            var onTimeFlights = flightsLast30Days
                .Count(c => c.GioHaCanhThucTe.HasValue && c.GioHaCanhThucTe.Value <= c.GioHaCanh.AddMinutes(15));

            var onTimePerformance = completedFlights == 0
                ? 0m
                : Math.Round((decimal)onTimeFlights * 100 / completedFlights, 1);

            var linkedCount = await _db.ChuyenBays
                .AsNoTracking()
                .CountAsync(c => c.MaLoTrinh == id);

            return Ok(new
            {
                item.MaLoTrinh,
                item.MaSanBayDi,
                item.MaSanBayDen,
                item.GiaCoBan,
                item.KhoangCachKm,
                item.LoaiDuongBay,
                item.TrangThai,
                SanBayDi = new
                {
                    item.SanBayDi.MaSanBay,
                    item.SanBayDi.TenSanBay,
                    item.SanBayDi.ThanhPho,
                    item.SanBayDi.QuocGia
                },
                SanBayDen = new
                {
                    item.SanBayDen.MaSanBay,
                    item.SanBayDen.TenSanBay,
                    item.SanBayDen.ThanhPho,
                    item.SanBayDen.QuocGia
                },
                ThongKe = new
                {
                    TongSoChuyenBay30NgayGanNhat = flightsLast30Days.Count,
                    GiaTrungBinh = item.GiaCoBan,
                    TyLeDungGio = onTimePerformance,
                    TongSoChuyenBayDangLienKet = linkedCount
                }
            });
        }

        // GET: api/LoTrinh/san-bay-options
        [HttpGet("san-bay-options")]
        public async Task<IActionResult> GetSanBayOptions()
        {
            var data = await _db.SanBays
                .AsNoTracking()
                .OrderBy(s => s.MaSanBay)
                .Select(s => new
                {
                    s.MaSanBay,
                    s.TenSanBay,
                    s.ThanhPho,
                    s.QuocGia,
                    label = s.MaSanBay + " - " + s.TenSanBay + " (" + s.ThanhPho + ")"
                })
                .ToListAsync();

            return Ok(data);
        }

        // POST: api/LoTrinh
        [HttpPost]
        public async Task<IActionResult> Create(LoTrinhRequest request)
        {
            await ValidateAndNormalize(request);

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var model = new LoTrinh
            {
                MaSanBayDi = request.MaSanBayDi,
                MaSanBayDen = request.MaSanBayDen,
                GiaCoBan = request.GiaCoBan,
                KhoangCachKm = request.KhoangCachKm,
                LoaiDuongBay = request.LoaiDuongBay,
                TrangThai = request.TrangThai
            };

            _db.LoTrinhs.Add(model);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = model.MaLoTrinh }, new
            {
                message = "Tạo lộ trình thành công.",
                data = new
                {
                    model.MaLoTrinh,
                    model.MaSanBayDi,
                    model.MaSanBayDen,
                    model.GiaCoBan,
                    model.KhoangCachKm,
                    model.LoaiDuongBay,
                    model.TrangThai
                }
            });
        }

        // PUT: api/LoTrinh/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, LoTrinhRequest request)
        {
            var item = await _db.LoTrinhs.FindAsync(id);
            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy lộ trình." });
            }

            await ValidateAndNormalize(request, id);

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            item.MaSanBayDi = request.MaSanBayDi;
            item.MaSanBayDen = request.MaSanBayDen;
            item.GiaCoBan = request.GiaCoBan;
            item.KhoangCachKm = request.KhoangCachKm;
            item.LoaiDuongBay = request.LoaiDuongBay;
            item.TrangThai = request.TrangThai;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật lộ trình thành công.",
                data = new
                {
                    item.MaLoTrinh,
                    item.MaSanBayDi,
                    item.MaSanBayDen,
                    item.GiaCoBan,
                    item.KhoangCachKm,
                    item.LoaiDuongBay,
                    item.TrangThai
                }
            });
        }

        // DELETE: api/LoTrinh/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _db.LoTrinhs.FindAsync(id);
            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy lộ trình." });
            }

            var linkedCount = await _db.ChuyenBays.CountAsync(c => c.MaLoTrinh == id);
            if (linkedCount > 0)
            {
                return Conflict(new
                {
                    message = $"Không thể xóa lộ trình {item.MaSanBayDi} → {item.MaSanBayDen} vì đang được dùng cho {linkedCount} chuyến bay."
                });
            }

            _db.LoTrinhs.Remove(item);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Xóa lộ trình thành công." });
        }

        private async Task ValidateAndNormalize(LoTrinhRequest request, int? currentId = null)
        {
            request.MaSanBayDi = (request.MaSanBayDi ?? string.Empty).Trim().ToUpperInvariant();
            request.MaSanBayDen = (request.MaSanBayDen ?? string.Empty).Trim().ToUpperInvariant();
            request.LoaiDuongBay = string.IsNullOrWhiteSpace(request.LoaiDuongBay)
                ? "Domestic"
                : request.LoaiDuongBay.Trim();
            request.TrangThai = string.IsNullOrWhiteSpace(request.TrangThai)
                ? "Active"
                : request.TrangThai.Trim();

            if (request.MaSanBayDi == request.MaSanBayDen)
            {
                ModelState.AddModelError(string.Empty, "Sân bay đi và sân bay đến không được trùng nhau.");
            }

            if (request.GiaCoBan <= 0)
            {
                ModelState.AddModelError(nameof(request.GiaCoBan), "Giá cơ bản phải lớn hơn 0.");
            }

            if (request.KhoangCachKm.HasValue && request.KhoangCachKm <= 0)
            {
                ModelState.AddModelError(nameof(request.KhoangCachKm), "Khoảng cách phải lớn hơn 0.");
            }

            var departureAirportExists = await _db.SanBays.AnyAsync(s => s.MaSanBay == request.MaSanBayDi);
            if (!departureAirportExists)
            {
                ModelState.AddModelError(nameof(request.MaSanBayDi), "Sân bay đi không tồn tại.");
            }

            var arrivalAirportExists = await _db.SanBays.AnyAsync(s => s.MaSanBay == request.MaSanBayDen);
            if (!arrivalAirportExists)
            {
                ModelState.AddModelError(nameof(request.MaSanBayDen), "Sân bay đến không tồn tại.");
            }

            var duplicateRoute = await _db.LoTrinhs.AnyAsync(l =>
                l.MaSanBayDi == request.MaSanBayDi &&
                l.MaSanBayDen == request.MaSanBayDen &&
                (!currentId.HasValue || l.MaLoTrinh != currentId.Value));

            if (duplicateRoute)
            {
                ModelState.AddModelError(string.Empty, "Lộ trình này đã tồn tại.");
            }
        }
    }
}