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
    public class GheMayBayController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public GheMayBayController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: /api/GheMayBay
        // Danh sách máy bay kèm số ghế đã khai báo.
        [HttpGet]
        public async Task<IActionResult> GetMayBaySeatOverview()
        {
            var data = await _db.MayBays
                .Include(m => m.HangBay)
                .OrderBy(m => m.DongMayBay)
                .Select(m => new
                {
                    m.MaMayBay,
                    m.DongMayBay,
                    m.SoHieuDangKy,
                    m.TongSoGhe,
                    m.TrangThai,
                    HangBay = new
                    {
                        m.HangBay.MaHangBay,
                        m.HangBay.TenHangBay,
                        m.HangBay.MaCode
                    },
                    SoGheHienCo = m.GheMayBays.Count()
                })
                .ToListAsync();

            return Ok(data);
        }

        // GET: /api/GheMayBay/may-bay/5/seat-map
        // Xem sơ đồ ghế hiện có của 1 máy bay.
        [HttpGet("may-bay/{maMayBay:int}/seat-map")]
        public async Task<IActionResult> GetSeatMap(int maMayBay)
        {
            var mayBay = await _db.MayBays
                .Include(m => m.HangBay)
                .FirstOrDefaultAsync(m => m.MaMayBay == maMayBay);

            if (mayBay is null)
            {
                return NotFound(new { message = "Không tìm thấy máy bay." });
            }

            var seats = await _db.GheMayBays
                .Include(g => g.HangGhe)
                .Where(g => g.MaMayBay == maMayBay)
                .OrderBy(g => g.MaHangGhe)
                .ThenBy(g => g.SoGhe)
                .Select(g => new
                {
                    g.MaGheMayBay,
                    g.MaMayBay,
                    g.SoGhe,
                    g.MaHangGhe,
                    TenHangGhe = g.HangGhe.TenHangGhe,
                    HeSoGia = g.HangGhe.HeSoGia,
                    g.DangSuDung
                })
                .ToListAsync();

            return Ok(new
            {
                MayBay = new
                {
                    mayBay.MaMayBay,
                    mayBay.DongMayBay,
                    mayBay.SoHieuDangKy,
                    mayBay.TongSoGhe,
                    mayBay.TrangThai,
                    HangBay = new
                    {
                        mayBay.HangBay.MaHangBay,
                        mayBay.HangBay.TenHangBay,
                        mayBay.HangBay.MaCode
                    }
                },
                SoGheHienCo = seats.Count,
                Seats = seats
            });
        }

        // GET: /api/GheMayBay/may-bay/5/generate-template
        // Lấy cấu hình mẫu để client dùng khi sinh ghế hàng loạt.
        [HttpGet("may-bay/{maMayBay:int}/generate-template")]
        public async Task<IActionResult> GetGenerateTemplate(int maMayBay)
        {
            var mayBay = await _db.MayBays.FindAsync(maMayBay);
            if (mayBay is null)
            {
                return NotFound(new { message = "Không tìm thấy máy bay." });
            }

            var hangGhes = (await _db.HangGhes
                .Select(h => new
                {
                    h.MaHangGhe,
                    h.TenHangGhe,
                    h.HeSoGia,
                    SoHangBatDau = 1,
                    SoHang = 0,
                    CotGhe = "ABCDEF"
                })
                .ToListAsync())
                .OrderBy(h => h.HeSoGia)
                .ToList();

            if (hangGhes.Count == 0)
            {
                return Conflict(new { message = "Chưa có hạng ghế nào. Hãy tạo Hạng ghế trước khi sinh sơ đồ ghế." });
            }

            var soGheHienCo = await _db.GheMayBays.CountAsync(g => g.MaMayBay == maMayBay);

            return Ok(new
            {
                MaMayBay = mayBay.MaMayBay,
                TenMayBay = $"{mayBay.DongMayBay} ({mayBay.SoHieuDangKy})",
                TongSoGheTheoMayBay = mayBay.TongSoGhe,
                SoGheHienCo = soGheHienCo,
                Rows = hangGhes
            });
        }

        // POST: /api/GheMayBay/may-bay/5/generate
        // Sinh ghế hàng loạt theo hàng/cột/hạng ghế.
        [HttpPost("may-bay/{maMayBay:int}/generate")]
        public async Task<IActionResult> Generate(int maMayBay, GenerateSeatMapRequest request)
        {
            if (maMayBay != request.MaMayBay)
            {
                return BadRequest(new { message = "Mã máy bay trên URL không khớp với dữ liệu gửi lên." });
            }

            var mayBay = await _db.MayBays.FindAsync(maMayBay);
            if (mayBay is null)
            {
                return NotFound(new { message = "Không tìm thấy máy bay." });
            }

            var existingSeatNumbers = (await _db.GheMayBays
                    .Where(g => g.MaMayBay == maMayBay)
                    .Select(g => g.SoGhe)
                    .ToListAsync())
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var hangGheIds = await _db.HangGhes
                .Select(h => h.MaHangGhe)
                .ToListAsync();
            var validHangGheIds = hangGheIds.ToHashSet();

            var newSeats = new List<GheMayBay>();
            var duplicateCount = 0;
            var validationErrors = new List<string>();

            foreach (var row in request.Rows)
            {
                if (row.SoHang <= 0)
                {
                    continue;
                }

                if (!validHangGheIds.Contains(row.MaHangGhe))
                {
                    validationErrors.Add($"Hạng ghế có mã {row.MaHangGhe} không tồn tại.");
                    continue;
                }

                var cols = (row.CotGhe ?? string.Empty)
                    .ToUpperInvariant()
                    .Where(char.IsLetterOrDigit)
                    .Distinct()
                    .ToList();

                if (cols.Count == 0)
                {
                    validationErrors.Add($"Hạng ghế có mã {row.MaHangGhe}: đã nhập số hàng nhưng chưa nhập cột ghế hợp lệ.");
                    continue;
                }

                for (int hang = row.SoHangBatDau; hang < row.SoHangBatDau + row.SoHang; hang++)
                {
                    foreach (var col in cols)
                    {
                        var soGhe = $"{hang}{col}";

                        if (existingSeatNumbers.Contains(soGhe))
                        {
                            duplicateCount++;
                            continue;
                        }

                        newSeats.Add(new GheMayBay
                        {
                            MaMayBay = maMayBay,
                            SoGhe = soGhe,
                            MaHangGhe = row.MaHangGhe,
                            DangSuDung = true
                        });

                        existingSeatNumbers.Add(soGhe);
                    }
                }
            }

            if (validationErrors.Count > 0)
            {
                return BadRequest(new
                {
                    message = "Dữ liệu sinh ghế chưa hợp lệ.",
                    errors = validationErrors
                });
            }

            if (newSeats.Count == 0)
            {
                return BadRequest(new
                {
                    message = "Không có ghế nào được sinh. Có thể chưa nhập số hàng, hoặc tất cả đều trùng ghế đã có.",
                    duplicateCount
                });
            }

            var soGheSauKhiSinh = existingSeatNumbers.Count;
            if (soGheSauKhiSinh > mayBay.TongSoGhe)
            {
                return BadRequest(new
                {
                    message = "Số ghế sau khi sinh vượt quá tổng số ghế khai báo của máy bay.",
                    tongSoGheTheoMayBay = mayBay.TongSoGhe,
                    soGheSauKhiSinh,
                    soGheMoiDuKien = newSeats.Count
                });
            }

            _db.GheMayBays.AddRange(newSeats);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = duplicateCount > 0
                    ? $"Đã sinh {newSeats.Count} ghế mới. Bỏ qua {duplicateCount} ghế bị trùng."
                    : $"Đã sinh {newSeats.Count} ghế mới thành công.",
                maMayBay,
                soGheMoi = newSeats.Count,
                duplicateCount,
                tongSoGheHienCo = soGheSauKhiSinh
            });
        }

        // GET: /api/GheMayBay/seats/12
        [HttpGet("seats/{id:int}")]
        public async Task<IActionResult> GetSeatById(int id)
        {
            var seat = await _db.GheMayBays
                .Include(g => g.MayBay)
                .Include(g => g.HangGhe)
                .Where(g => g.MaGheMayBay == id)
                .Select(g => new
                {
                    g.MaGheMayBay,
                    g.MaMayBay,
                    TenMayBay = g.MayBay.DongMayBay,
                    SoHieuDangKy = g.MayBay.SoHieuDangKy,
                    g.SoGhe,
                    g.MaHangGhe,
                    TenHangGhe = g.HangGhe.TenHangGhe,
                    HeSoGia = g.HangGhe.HeSoGia,
                    g.DangSuDung
                })
                .FirstOrDefaultAsync();

            if (seat is null)
            {
                return NotFound(new { message = "Không tìm thấy ghế máy bay." });
            }

            return Ok(seat);
        }

        // PUT: /api/GheMayBay/seats/12
        [HttpPut("seats/{id:int}")]
        public async Task<IActionResult> UpdateSeat(int id, GheMayBayUpdateRequest request)
        {
            var seat = await _db.GheMayBays.FindAsync(id);
            if (seat is null)
            {
                return NotFound(new { message = "Không tìm thấy ghế máy bay." });
            }

            var soGheChuan = request.SoGhe.Trim().ToUpperInvariant();
            if (string.IsNullOrWhiteSpace(soGheChuan))
            {
                return BadRequest(new { message = "Số ghế không được để trống." });
            }

            var hangGheTonTai = await _db.HangGhes.AnyAsync(h => h.MaHangGhe == request.MaHangGhe);
            if (!hangGheTonTai)
            {
                return BadRequest(new { message = "Hạng ghế không tồn tại." });
            }

            var trungSoGhe = await _db.GheMayBays.AnyAsync(g =>
                g.MaMayBay == seat.MaMayBay &&
                g.MaGheMayBay != id &&
                g.SoGhe == soGheChuan);

            if (trungSoGhe)
            {
                return Conflict(new { message = "Số ghế này đã tồn tại trên máy bay." });
            }

            seat.SoGhe = soGheChuan;
            seat.MaHangGhe = request.MaHangGhe;
            seat.DangSuDung = request.DangSuDung;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật ghế thành công.",
                seat.MaGheMayBay,
                seat.MaMayBay,
                seat.SoGhe,
                seat.MaHangGhe,
                seat.DangSuDung
            });
        }

        // DELETE: /api/GheMayBay/seats/12
        [HttpDelete("seats/{id:int}")]
        public async Task<IActionResult> DeleteSeat(int id)
        {
            var seat = await _db.GheMayBays.FindAsync(id);
            if (seat is null)
            {
                return NotFound(new { message = "Không tìm thấy ghế máy bay." });
            }

            var daSuDung = await _db.GheChuyenBays.AnyAsync(g => g.MaGheMayBay == id);
            if (daSuDung)
            {
                return Conflict(new { message = $"Không thể xóa ghế {seat.SoGhe}: ghế đã được dùng trong ít nhất 1 chuyến bay." });
            }

            _db.GheMayBays.Remove(seat);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = $"Đã xóa ghế {seat.SoGhe}.",
                seat.MaMayBay,
                seat.MaGheMayBay
            });
        }

        // DELETE: /api/GheMayBay/may-bay/5/unused
        // Xóa toàn bộ ghế chưa từng dùng trong chuyến bay nào của 1 máy bay.
        [HttpDelete("may-bay/{maMayBay:int}/unused")]
        public async Task<IActionResult> DeleteAllUnused(int maMayBay)
        {
            var mayBayTonTai = await _db.MayBays.AnyAsync(m => m.MaMayBay == maMayBay);
            if (!mayBayTonTai)
            {
                return NotFound(new { message = "Không tìm thấy máy bay." });
            }

            var seats = await _db.GheMayBays
                .Where(g => g.MaMayBay == maMayBay)
                .ToListAsync();

            if (seats.Count == 0)
            {
                return BadRequest(new { message = "Máy bay này chưa có ghế nào để xóa." });
            }

            var seatIds = seats.Select(s => s.MaGheMayBay).ToList();
            var usedIds = await _db.GheChuyenBays
                .Where(gc => seatIds.Contains(gc.MaGheMayBay))
                .Select(gc => gc.MaGheMayBay)
                .Distinct()
                .ToListAsync();

            var removable = seats.Where(s => !usedIds.Contains(s.MaGheMayBay)).ToList();

            if (removable.Count == 0)
            {
                return Conflict(new { message = "Không có ghế nào có thể xóa. Tất cả ghế đã được dùng trong chuyến bay." });
            }

            _db.GheMayBays.RemoveRange(removable);
            await _db.SaveChangesAsync();

            var soBiBoQua = seats.Count - removable.Count;

            return Ok(new
            {
                message = soBiBoQua > 0
                    ? $"Đã xóa {removable.Count} ghế. Giữ lại {soBiBoQua} ghế đang được dùng trong chuyến bay."
                    : $"Đã xóa toàn bộ {removable.Count} ghế.",
                maMayBay,
                soGheDaXoa = removable.Count,
                soGheBiBoQua = soBiBoQua
            });
        }

        // GET: /api/GheMayBay/hang-ghe-options
        // Thay cho SelectList cũ khi client cần dropdown hạng ghế.
        [HttpGet("hang-ghe-options")]
        public async Task<IActionResult> GetHangGheOptions()
        {
            var options = (await _db.HangGhes
                .Select(h => new
                {
                    h.MaHangGhe,
                    h.TenHangGhe,
                    h.HeSoGia
                })
                .ToListAsync())
                .OrderBy(h => h.HeSoGia)
                .ToList();

            return Ok(options);
        }
    }
}
