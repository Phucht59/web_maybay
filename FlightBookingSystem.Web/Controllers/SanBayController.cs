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
    public class SanBayController : ControllerBase
    {
        private const int PageSize = 5;
        private readonly ApplicationDbContext _db;

        public SanBayController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: api/SanBay?tuKhoa=HAN&page=1
        [HttpGet]
        public async Task<IActionResult> GetAll(string? tuKhoa = null, int page = 1)
        {
            // Tải toàn bộ sân bay về rồi lọc bằng C# — xem giải thích trong Helpers/SearchHelper.cs.
            var allAirports = await _db.SanBays.AsNoTracking().ToListAsync();

            IEnumerable<SanBay> filtered = allAirports;

            if (!string.IsNullOrWhiteSpace(tuKhoa))
            {
                var keyword = tuKhoa.Trim();
                filtered = filtered.Where(s =>
                    s.MaSanBay.ContainsKeyword(keyword) ||
                    s.TenSanBay.ContainsKeyword(keyword) ||
                    s.ThanhPho.ContainsKeyword(keyword) ||
                    s.QuocGia.ContainsKeyword(keyword));
            }

            var filteredList = filtered.OrderBy(s => s.MaSanBay).ToList();

            var totalCount = filteredList.Count;
            var totalPages = Math.Max(1, (int)Math.Ceiling(totalCount / (double)PageSize));
            page = Math.Clamp(page, 1, totalPages);

            var airports = filteredList
                .Skip((page - 1) * PageSize)
                .Take(PageSize)
                .Select(s => new
                {
                    s.MaSanBay,
                    s.TenSanBay,
                    s.ThanhPho,
                    s.QuocGia
                })
                .ToList();

            var visibleAirportCodes = airports.Select(s => s.MaSanBay).ToList();

            var linkedRoutes = await _db.LoTrinhs
                .AsNoTracking()
                .Where(l => visibleAirportCodes.Contains(l.MaSanBayDi) || visibleAirportCodes.Contains(l.MaSanBayDen))
                .Select(l => new { l.MaSanBayDi, l.MaSanBayDen })
                .ToListAsync();

            var linkedCountMap = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            foreach (var route in linkedRoutes)
            {
                linkedCountMap[route.MaSanBayDi] = linkedCountMap.GetValueOrDefault(route.MaSanBayDi) + 1;
                linkedCountMap[route.MaSanBayDen] = linkedCountMap.GetValueOrDefault(route.MaSanBayDen) + 1;
            }

            var data = airports.Select(s => new
            {
                s.MaSanBay,
                s.TenSanBay,
                s.ThanhPho,
                s.QuocGia,
                SoLoTrinhDangLienKet = linkedCountMap.GetValueOrDefault(s.MaSanBay)
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

        // GET: api/SanBay/HAN?khoangThoiGian=today|7days|30days
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id, string? khoangThoiGian = null)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest(new { message = "Mã sân bay không hợp lệ." });
            }

            id = id.Trim().ToUpperInvariant();

            var item = await _db.SanBays
                .AsNoTracking()
                .Where(s => s.MaSanBay == id)
                .Select(s => new
                {
                    s.MaSanBay,
                    s.TenSanBay,
                    s.ThanhPho,
                    s.QuocGia
                })
                .FirstOrDefaultAsync();

            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy sân bay." });
            }

            var filter = string.IsNullOrWhiteSpace(khoangThoiGian) ? "today" : khoangThoiGian.Trim();
            if (filter is not ("today" or "7days" or "30days"))
            {
                filter = "today";
            }

            var today = DateTime.Today;
            var start = filter switch
            {
                "7days" => today.AddDays(-6),
                "30days" => today.AddDays(-29),
                _ => today
            };
            var end = today.AddDays(1);

            var departureCount = await _db.ChuyenBays
                .AsNoTracking()
                .CountAsync(c => c.LoTrinh.MaSanBayDi == id && c.GioKhoiHanh >= start && c.GioKhoiHanh < end);

            var arrivalCount = await _db.ChuyenBays
                .AsNoTracking()
                .CountAsync(c => c.LoTrinh.MaSanBayDen == id && c.GioHaCanh >= start && c.GioHaCanh < end);

            var linkedCount = await _db.LoTrinhs
                .AsNoTracking()
                .CountAsync(l => l.MaSanBayDi == id || l.MaSanBayDen == id);

            return Ok(new
            {
                item.MaSanBay,
                item.TenSanBay,
                item.ThanhPho,
                item.QuocGia,
                thongKe = new
                {
                    khoangThoiGian = filter,
                    tuNgay = start,
                    denNgay = end.AddTicks(-1),
                    soChuyenBayDi = departureCount,
                    soChuyenBayDen = arrivalCount,
                    soLoTrinhDangLienKet = linkedCount
                }
            });
        }

        // POST: api/SanBay
        [HttpPost]
        public async Task<IActionResult> Create(SanBayRequest request)
        {
            var maSanBay = NormalizeAirportCode(request.MaSanBay);

            if (await _db.SanBays.AnyAsync(s => s.MaSanBay == maSanBay))
            {
                ModelState.AddModelError(nameof(request.MaSanBay), "Mã sân bay đã tồn tại.");
                return BadRequest(ModelState);
            }

            var item = new SanBay
            {
                MaSanBay = maSanBay,
                TenSanBay = NormalizeText(request.TenSanBay),
                ThanhPho = NormalizeText(request.ThanhPho),
                QuocGia = NormalizeText(request.QuocGia)
            };

            _db.SanBays.Add(item);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = item.MaSanBay }, new
            {
                message = "Tạo sân bay thành công.",
                data = new
                {
                    item.MaSanBay,
                    item.TenSanBay,
                    item.ThanhPho,
                    item.QuocGia
                }
            });
        }

        // PUT: api/SanBay/HAN
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, SanBayRequest request)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest(new { message = "Mã sân bay không hợp lệ." });
            }

            id = NormalizeAirportCode(id);
            var requestCode = NormalizeAirportCode(request.MaSanBay);

            if (id != requestCode)
            {
                return BadRequest(new { message = "Mã sân bay trên URL phải trùng với mã sân bay trong body." });
            }

            var item = await _db.SanBays.FirstOrDefaultAsync(s => s.MaSanBay == id);
            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy sân bay." });
            }

            item.TenSanBay = NormalizeText(request.TenSanBay);
            item.ThanhPho = NormalizeText(request.ThanhPho);
            item.QuocGia = NormalizeText(request.QuocGia);

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật sân bay thành công.",
                data = new
                {
                    item.MaSanBay,
                    item.TenSanBay,
                    item.ThanhPho,
                    item.QuocGia
                }
            });
        }

        // DELETE: api/SanBay/HAN
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest(new { message = "Mã sân bay không hợp lệ." });
            }

            id = NormalizeAirportCode(id);

            var item = await _db.SanBays.FirstOrDefaultAsync(s => s.MaSanBay == id);
            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy sân bay." });
            }

            var linkedCount = await _db.LoTrinhs.CountAsync(l => l.MaSanBayDi == id || l.MaSanBayDen == id);
            if (linkedCount > 0)
            {
                return Conflict(new
                {
                    message = $"Không thể xóa sân bay {id} vì đang liên kết với {linkedCount} lộ trình.",
                    soLoTrinhDangLienKet = linkedCount
                });
            }

            _db.SanBays.Remove(item);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Xóa sân bay thành công." });
        }

        private static string NormalizeAirportCode(string value)
        {
            return (value ?? string.Empty).Trim().ToUpperInvariant();
        }

        private static string NormalizeText(string value)
        {
            return (value ?? string.Empty).Trim();
        }
    }
}