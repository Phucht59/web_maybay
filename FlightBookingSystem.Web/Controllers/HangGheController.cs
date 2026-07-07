using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FlightBookingSystem.Web.Data;
using FlightBookingSystem.Web.Models;
using FlightBookingSystem.Web.Models.DTOs;

namespace FlightBookingSystem.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class HangGheController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public HangGheController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: api/HangGhe?tuKhoa=Pho thong
        [HttpGet]
        public async Task<IActionResult> GetAll(string? tuKhoa = null)
        {
            var list = await _db.HangGhes.ToListAsync();

            if (!string.IsNullOrWhiteSpace(tuKhoa))
            {
                tuKhoa = tuKhoa.Trim();
                list = list
                    .Where(h =>
                        h.TenHangGhe.Contains(tuKhoa, StringComparison.OrdinalIgnoreCase) ||
                        (h.MoTa != null && h.MoTa.Contains(tuKhoa, StringComparison.OrdinalIgnoreCase)))
                    .ToList();
            }

            // SQLite không hỗ trợ ORDER BY trực tiếp trên cột decimal ở một số trường hợp -> sắp xếp in-memory
            list = list
                .OrderBy(h => h.HeSoGia)
                .ThenBy(h => h.TenHangGhe)
                .ToList();

            var hangGheIds = list.Select(h => h.MaHangGhe).ToList();

            var usageCounts = await _db.GheMayBays
                .Where(g => hangGheIds.Contains(g.MaHangGhe))
                .GroupBy(g => g.MaHangGhe)
                .Select(g => new { MaHangGhe = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.MaHangGhe, x => x.Count);

            var result = list.Select(h => new
            {
                h.MaHangGhe,
                h.TenHangGhe,
                h.HeSoGia,
                h.MoTa,
                SoGheDangLienKet = usageCounts.GetValueOrDefault(h.MaHangGhe)
            });

            return Ok(result);
        }

        // GET: api/HangGhe/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _db.HangGhes
                .AsNoTracking()
                .FirstOrDefaultAsync(h => h.MaHangGhe == id);

            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy hạng ghế." });
            }

            var totalSeats = await _db.GheMayBays.CountAsync(g => g.MaHangGhe == id);

            var totalFlightSeats = await _db.GheChuyenBays
                .Include(g => g.GheMayBay)
                .CountAsync(g => g.GheMayBay.MaHangGhe == id);

            var usedFlightSeats = await _db.GheChuyenBays
                .Include(g => g.GheMayBay)
                .CountAsync(g =>
                    g.GheMayBay.MaHangGhe == id &&
                    g.TrangThaiGhe != "Available");

            var averageUsageRate = totalFlightSeats == 0
                ? 0
                : Math.Round((decimal)usedFlightSeats * 100 / totalFlightSeats, 1);

            return Ok(new
            {
                item.MaHangGhe,
                item.TenHangGhe,
                item.HeSoGia,
                item.MoTa,
                TongSoGheDangLienKet = totalSeats,
                TongSoGheChuyenBay = totalFlightSeats,
                SoGheDaSuDung = usedFlightSeats,
                TiLeSuDungTrungBinh = averageUsageRate
            });
        }

        // POST: api/HangGhe
        [HttpPost]
        public async Task<IActionResult> Create(HangGheRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            request.TenHangGhe = request.TenHangGhe.Trim();
            request.MoTa = string.IsNullOrWhiteSpace(request.MoTa) ? null : request.MoTa.Trim();

            bool isDuplicate = await _db.HangGhes
                .AnyAsync(h => h.TenHangGhe.ToLower() == request.TenHangGhe.ToLower());

            if (isDuplicate)
            {
                return BadRequest(new { message = "Tên hạng ghế đã tồn tại." });
            }

            var item = new HangGhe
            {
                TenHangGhe = request.TenHangGhe,
                HeSoGia = request.HeSoGia,
                MoTa = request.MoTa
            };

            _db.HangGhes.Add(item);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = item.MaHangGhe }, new
            {
                message = $"Hạng ghế {item.TenHangGhe} đã được tạo.",
                data = new
                {
                    item.MaHangGhe,
                    item.TenHangGhe,
                    item.HeSoGia,
                    item.MoTa
                }
            });
        }

        // PUT: api/HangGhe/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, HangGheRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var item = await _db.HangGhes.FindAsync(id);
            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy hạng ghế." });
            }

            request.TenHangGhe = request.TenHangGhe.Trim();
            request.MoTa = string.IsNullOrWhiteSpace(request.MoTa) ? null : request.MoTa.Trim();

            bool isDuplicate = await _db.HangGhes
                .AnyAsync(h =>
                    h.MaHangGhe != id &&
                    h.TenHangGhe.ToLower() == request.TenHangGhe.ToLower());

            if (isDuplicate)
            {
                return BadRequest(new { message = "Tên hạng ghế đã tồn tại." });
            }

            item.TenHangGhe = request.TenHangGhe;
            item.HeSoGia = request.HeSoGia;
            item.MoTa = request.MoTa;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = $"Hạng ghế {item.TenHangGhe} đã được cập nhật.",
                data = new
                {
                    item.MaHangGhe,
                    item.TenHangGhe,
                    item.HeSoGia,
                    item.MoTa
                }
            });
        }

        // DELETE: api/HangGhe/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _db.HangGhes.FindAsync(id);
            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy hạng ghế." });
            }

            int linkedCount = await _db.GheMayBays.CountAsync(g => g.MaHangGhe == id);
            if (linkedCount > 0)
            {
                return BadRequest(new
                {
                    message = $"Không thể xóa hạng ghế {item.TenHangGhe} vì đang liên kết với {linkedCount} ghế máy bay."
                });
            }

            _db.HangGhes.Remove(item);
            await _db.SaveChangesAsync();

            return Ok(new { message = $"Hạng ghế {item.TenHangGhe} đã được xóa." });
        }
    }
}
