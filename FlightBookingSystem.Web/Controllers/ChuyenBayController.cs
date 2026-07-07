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
    public class ChuyenBayController : ControllerBase
    {
        private static readonly string[] CacTrangThaiChuyenBay =
            { "Scheduled", "Delayed", "Cancelled", "Completed" };

        private readonly ApplicationDbContext _db;

        public ChuyenBayController(ApplicationDbContext db)
        {
            _db = db;
        }

        // GET: /api/ChuyenBay?tuKhoa=&trangThai=&maLoTrinh=&page=1&pageSize=10
        [HttpGet]
        public async Task<IActionResult> GetAll(
            string? tuKhoa = null,
            string? trangThai = null,
            int? maLoTrinh = null,
            int page = 1,
            int pageSize = 10)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var query = _db.ChuyenBays
                .Include(c => c.LoTrinh).ThenInclude(l => l.SanBayDi)
                .Include(c => c.LoTrinh).ThenInclude(l => l.SanBayDen)
                .Include(c => c.MayBay).ThenInclude(m => m.HangBay)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(tuKhoa))
            {
                var keyword = tuKhoa.Trim();
                query = query.Where(c =>
                    c.SoHieuChuyenBay.Contains(keyword) ||
                    c.MayBay.DongMayBay.Contains(keyword) ||
                    (c.MayBay.SoHieuDangKy != null && c.MayBay.SoHieuDangKy.Contains(keyword)) ||
                    c.LoTrinh.MaSanBayDi.Contains(keyword) ||
                    c.LoTrinh.MaSanBayDen.Contains(keyword));
            }

            if (!string.IsNullOrWhiteSpace(trangThai))
            {
                if (!CacTrangThaiChuyenBay.Contains(trangThai))
                    return BadRequest(new { message = "Trạng thái chuyến bay không hợp lệ.", allowedValues = CacTrangThaiChuyenBay });

                query = query.Where(c => c.TrangThai == trangThai);
            }

            if (maLoTrinh.HasValue)
                query = query.Where(c => c.MaLoTrinh == maLoTrinh.Value);

            var totalItems = await query.CountAsync();

            var items = await query
                .OrderByDescending(c => c.GioKhoiHanh)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new
                {
                    c.MaChuyenBay,
                    c.SoHieuChuyenBay,
                    c.MaLoTrinh,
                    loTrinh = new
                    {
                        c.LoTrinh.MaSanBayDi,
                        sanBayDi = c.LoTrinh.SanBayDi.TenSanBay,
                        c.LoTrinh.MaSanBayDen,
                        sanBayDen = c.LoTrinh.SanBayDen.TenSanBay,
                        c.LoTrinh.GiaCoBan,
                        c.LoTrinh.KhoangCachKm,
                        c.LoTrinh.LoaiDuongBay
                    },
                    c.MaMayBay,
                    mayBay = new
                    {
                        c.MayBay.DongMayBay,
                        c.MayBay.SoHieuDangKy,
                        hangBay = c.MayBay.HangBay.TenHangBay
                    },
                    c.GioKhoiHanh,
                    c.GioHaCanh,
                    c.NhaGa,
                    c.CuaLen,
                    c.GioBatDauCheckIn,
                    c.GioKetThucCheckIn,
                    c.GiaCoBan,
                    c.TrangThai,
                    tongSoGhe = c.GheChuyenBays.Count,
                    gheConTrong = c.GheChuyenBays.Count(g => g.TrangThaiGhe == "Available")
                })
                .ToListAsync();

            var chuyenBayIds = items.Select(i => i.MaChuyenBay).ToList();
            var chuyenBayCoVeIds = await _db.Ves
                .Where(v => chuyenBayIds.Contains(v.GheChuyenBay.MaChuyenBay))
                .Select(v => v.GheChuyenBay.MaChuyenBay)
                .Distinct()
                .ToListAsync();

            return Ok(new
            {
                page,
                pageSize,
                totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                items,
                chuyenBayCoVeIds
            });
        }

        // GET: /api/ChuyenBay/5
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var chuyenBay = await _db.ChuyenBays
                .Include(c => c.LoTrinh).ThenInclude(l => l.SanBayDi)
                .Include(c => c.LoTrinh).ThenInclude(l => l.SanBayDen)
                .Include(c => c.MayBay).ThenInclude(m => m.HangBay)
                .Where(c => c.MaChuyenBay == id)
                .Select(c => new
                {
                    c.MaChuyenBay,
                    c.SoHieuChuyenBay,
                    c.MaLoTrinh,
                    loTrinh = new
                    {
                        c.LoTrinh.MaSanBayDi,
                        sanBayDi = c.LoTrinh.SanBayDi.TenSanBay,
                        thanhPhoDi = c.LoTrinh.SanBayDi.ThanhPho,
                        c.LoTrinh.MaSanBayDen,
                        sanBayDen = c.LoTrinh.SanBayDen.TenSanBay,
                        thanhPhoDen = c.LoTrinh.SanBayDen.ThanhPho,
                        c.LoTrinh.GiaCoBan,
                        c.LoTrinh.KhoangCachKm,
                        c.LoTrinh.LoaiDuongBay
                    },
                    c.MaMayBay,
                    mayBay = new
                    {
                        c.MayBay.DongMayBay,
                        c.MayBay.SoHieuDangKy,
                        c.MayBay.TongSoGhe,
                        hangBay = c.MayBay.HangBay.TenHangBay,
                        maCodeHangBay = c.MayBay.HangBay.MaCode
                    },
                    c.GioKhoiHanh,
                    c.GioHaCanh,
                    c.NhaGa,
                    c.CuaLen,
                    c.GioBatDauCheckIn,
                    c.GioKetThucCheckIn,
                    c.GioLenMayBay,
                    c.GioKhoiHanhThucTe,
                    c.GioHaCanhThucTe,
                    c.LyDoTreChuyen,
                    c.GiaCoBan,
                    c.TrangThai,
                    tongSoGhe = c.GheChuyenBays.Count,
                    gheConTrong = c.GheChuyenBays.Count(g => g.TrangThaiGhe == "Available"),
                    gheDangGiu = c.GheChuyenBays.Count(g => g.TrangThaiGhe == "Held"),
                    gheDaBan = c.GheChuyenBays.Count(g => g.TrangThaiGhe == "Sold")
                })
                .FirstOrDefaultAsync();

            if (chuyenBay is null)
                return NotFound(new { message = "Không tìm thấy chuyến bay." });

            var thongKeGheTheoHang = await _db.GheChuyenBays
                .Where(g => g.MaChuyenBay == id)
                .Include(g => g.GheMayBay).ThenInclude(gm => gm.HangGhe)
                .GroupBy(g => g.GheMayBay.HangGhe.TenHangGhe)
                .Select(g => new
                {
                    tenHangGhe = g.Key,
                    tong = g.Count(),
                    conTrong = g.Count(x => x.TrangThaiGhe == "Available"),
                    dangGiu = g.Count(x => x.TrangThaiGhe == "Held"),
                    daBan = g.Count(x => x.TrangThaiGhe == "Sold")
                })
                .ToListAsync();

            bool coVeDaXuat = await _db.Ves.AnyAsync(v => v.GheChuyenBay.MaChuyenBay == id);

            return Ok(new
            {
                chuyenBay,
                thongKeGhe = thongKeGheTheoHang,
                coVeDaXuat,
                coTheXoa = !coVeDaXuat
            });
        }

        // GET: /api/ChuyenBay/lo-trinh-options
        [HttpGet("lo-trinh-options")]
        public async Task<IActionResult> GetLoTrinhOptions()
        {
            var loTrinhs = await _db.LoTrinhs
                .Include(l => l.SanBayDi)
                .Include(l => l.SanBayDen)
                .Where(l => l.TrangThai == "Active")
                .OrderBy(l => l.MaSanBayDi)
                .ToListAsync();

            var options = loTrinhs.Select(l => new
            {
                value = l.MaLoTrinh,
                label = $"{l.MaSanBayDi} ({l.SanBayDi.TenSanBay}) → {l.MaSanBayDen} ({l.SanBayDen.TenSanBay})",
                l.MaSanBayDi,
                l.MaSanBayDen,
                l.GiaCoBan,
                l.KhoangCachKm,
                l.LoaiDuongBay
            });

            return Ok(options);
        }

        // GET: /api/ChuyenBay/may-bay-options
        [HttpGet("may-bay-options")]
        public async Task<IActionResult> GetMayBayOptions()
        {
            var mayBays = await _db.MayBays
                .Include(m => m.HangBay)
                .Include(m => m.GheMayBays)
                .Where(m => m.TrangThai == "Active" && m.GheMayBays.Any())
                .OrderBy(m => m.DongMayBay)
                .ToListAsync();

            var options = mayBays.Select(m => new
            {
                value = m.MaMayBay,
                label = $"{m.DongMayBay} ({m.SoHieuDangKy}) - {m.HangBay.TenHangBay}",
                m.DongMayBay,
                m.SoHieuDangKy,
                m.TongSoGhe,
                hangBay = m.HangBay.TenHangBay,
                soGheDaKhaiBao = m.GheMayBays.Count(g => g.DangSuDung)
            });

            return Ok(options);
        }

        // GET: /api/ChuyenBay/trang-thai-options
        [HttpGet("trang-thai-options")]
        public IActionResult GetTrangThaiOptions()
        {
            return Ok(CacTrangThaiChuyenBay.Select(t => new { value = t, label = t }));
        }

        // POST: /api/ChuyenBay
        [HttpPost]
        public async Task<IActionResult> Create(ChuyenBayCreateRequest request)
        {
            var validationResult = await ValidateCreateRequest(request);
            if (validationResult is not null)
                return validationResult;

            await using var transaction = await _db.Database.BeginTransactionAsync();

            var chuyenBay = new ChuyenBay
            {
                SoHieuChuyenBay = request.SoHieuChuyenBay.Trim(),
                MaLoTrinh = request.MaLoTrinh,
                MaMayBay = request.MaMayBay,
                GioKhoiHanh = request.GioKhoiHanh,
                GioHaCanh = request.GioHaCanh,
                NhaGa = request.NhaGa?.Trim(),
                CuaLen = request.CuaLen?.Trim(),
                GioBatDauCheckIn = request.GioBatDauCheckIn,
                GioKetThucCheckIn = request.GioKetThucCheckIn,
                GiaCoBan = request.GiaCoBan,
                TrangThai = "Scheduled"
            };

            _db.ChuyenBays.Add(chuyenBay);
            await _db.SaveChangesAsync();

            var gheMayBays = await _db.GheMayBays
                .Include(g => g.HangGhe)
                .Where(g => g.MaMayBay == request.MaMayBay && g.DangSuDung)
                .ToListAsync();

            var gheChuyenBays = gheMayBays.Select(g => new GheChuyenBay
            {
                MaChuyenBay = chuyenBay.MaChuyenBay,
                MaGheMayBay = g.MaGheMayBay,
                TrangThaiGhe = "Available",
                GiaGhe = request.GiaCoBan * g.HangGhe.HeSoGia,
                PhienBan = 0,
                UpdatedAt = DateTime.UtcNow
            }).ToList();

            _db.GheChuyenBays.AddRange(gheChuyenBays);
            await _db.SaveChangesAsync();

            await transaction.CommitAsync();

            return CreatedAtAction(nameof(GetById), new { id = chuyenBay.MaChuyenBay }, new
            {
                message = $"Đã tạo chuyến bay {chuyenBay.SoHieuChuyenBay} và sinh {gheChuyenBays.Count} ghế.",
                chuyenBay.MaChuyenBay,
                chuyenBay.SoHieuChuyenBay,
                soGheDaSinh = gheChuyenBays.Count
            });
        }

        // PUT: /api/ChuyenBay/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, ChuyenBayUpdateRequest request)
        {
            var chuyenBay = await _db.ChuyenBays.FirstOrDefaultAsync(c => c.MaChuyenBay == id);
            if (chuyenBay is null)
                return NotFound(new { message = "Không tìm thấy chuyến bay." });

            var validationResult = await ValidateUpdateRequest(id, request);
            if (validationResult is not null)
                return validationResult;

            bool giaThayDoi = chuyenBay.GiaCoBan != request.GiaCoBan;

            chuyenBay.SoHieuChuyenBay = request.SoHieuChuyenBay.Trim();
            chuyenBay.MaLoTrinh = request.MaLoTrinh;
            // Không cho đổi MaMayBay sau khi tạo vì GheChuyenBay đã sinh theo sơ đồ ghế của máy bay ban đầu.
            chuyenBay.GioKhoiHanh = request.GioKhoiHanh;
            chuyenBay.GioHaCanh = request.GioHaCanh;
            chuyenBay.NhaGa = request.NhaGa?.Trim();
            chuyenBay.CuaLen = request.CuaLen?.Trim();
            chuyenBay.GioBatDauCheckIn = request.GioBatDauCheckIn;
            chuyenBay.GioKetThucCheckIn = request.GioKetThucCheckIn;
            chuyenBay.GiaCoBan = request.GiaCoBan;
            chuyenBay.TrangThai = request.TrangThai;

            int soGheCapNhatGia = 0;
            if (giaThayDoi)
            {
                var gheConTrong = await _db.GheChuyenBays
                    .Include(g => g.GheMayBay).ThenInclude(gm => gm.HangGhe)
                    .Where(g => g.MaChuyenBay == id && g.TrangThaiGhe == "Available")
                    .ToListAsync();

                foreach (var ghe in gheConTrong)
                {
                    ghe.GiaGhe = request.GiaCoBan * ghe.GheMayBay.HangGhe.HeSoGia;
                    ghe.UpdatedAt = DateTime.UtcNow;
                }

                soGheCapNhatGia = gheConTrong.Count;
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật chuyến bay thành công.",
                chuyenBay.MaChuyenBay,
                chuyenBay.SoHieuChuyenBay,
                soGheCapNhatGia
            });
        }

        // PATCH: /api/ChuyenBay/5/status
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateStatus(int id, ChuyenBayStatusRequest request)
        {
            if (!CacTrangThaiChuyenBay.Contains(request.TrangThai))
                return BadRequest(new { message = "Trạng thái chuyến bay không hợp lệ.", allowedValues = CacTrangThaiChuyenBay });

            var chuyenBay = await _db.ChuyenBays.FirstOrDefaultAsync(c => c.MaChuyenBay == id);
            if (chuyenBay is null)
                return NotFound(new { message = "Không tìm thấy chuyến bay." });

            chuyenBay.TrangThai = request.TrangThai;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật trạng thái chuyến bay thành công.",
                chuyenBay.MaChuyenBay,
                chuyenBay.SoHieuChuyenBay,
                chuyenBay.TrangThai
            });
        }

        // POST: /api/ChuyenBay/5/cancel
        [HttpPost("{id:int}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            var chuyenBay = await _db.ChuyenBays.FirstOrDefaultAsync(c => c.MaChuyenBay == id);
            if (chuyenBay is null)
                return NotFound(new { message = "Không tìm thấy chuyến bay." });

            chuyenBay.TrangThai = "Cancelled";
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = $"Đã hủy chuyến bay {chuyenBay.SoHieuChuyenBay}.",
                chuyenBay.MaChuyenBay,
                chuyenBay.SoHieuChuyenBay,
                chuyenBay.TrangThai
            });
        }

        // DELETE: /api/ChuyenBay/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var chuyenBay = await _db.ChuyenBays.FirstOrDefaultAsync(c => c.MaChuyenBay == id);
            if (chuyenBay is null)
                return NotFound(new { message = "Không tìm thấy chuyến bay." });

            bool coVeDaXuat = await _db.Ves.AnyAsync(v => v.GheChuyenBay.MaChuyenBay == id);
            if (coVeDaXuat)
            {
                return Conflict(new
                {
                    message = "Không thể xóa: chuyến bay đã có vé được xuất. Hãy dùng chức năng hủy chuyến thay thế."
                });
            }

            await using var transaction = await _db.Database.BeginTransactionAsync();

            var gheChuyenBays = await _db.GheChuyenBays
                .Where(g => g.MaChuyenBay == id)
                .ToListAsync();

            _db.GheChuyenBays.RemoveRange(gheChuyenBays);
            _db.ChuyenBays.Remove(chuyenBay);

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                message = $"Đã xóa chuyến bay {chuyenBay.SoHieuChuyenBay}.",
                soGheDaXoa = gheChuyenBays.Count
            });
        }

        private async Task<IActionResult?> ValidateCreateRequest(ChuyenBayCreateRequest request)
        {
            if (request.GioHaCanh <= request.GioKhoiHanh)
                ModelState.AddModelError(nameof(request.GioHaCanh), "Giờ hạ cánh phải sau giờ khởi hành.");

            if (request.GioBatDauCheckIn.HasValue && request.GioKetThucCheckIn.HasValue &&
                request.GioKetThucCheckIn <= request.GioBatDauCheckIn)
                ModelState.AddModelError(nameof(request.GioKetThucCheckIn), "Giờ kết thúc check-in phải sau giờ bắt đầu check-in.");

            var loTrinhTonTai = await _db.LoTrinhs.AnyAsync(l => l.MaLoTrinh == request.MaLoTrinh && l.TrangThai == "Active");
            if (!loTrinhTonTai)
                ModelState.AddModelError(nameof(request.MaLoTrinh), "Lộ trình không hợp lệ hoặc không ở trạng thái Active.");

            var mayBay = await _db.MayBays
                .Include(m => m.GheMayBays)
                .FirstOrDefaultAsync(m => m.MaMayBay == request.MaMayBay);

            if (mayBay is null)
            {
                ModelState.AddModelError(nameof(request.MaMayBay), "Máy bay không hợp lệ.");
            }
            else
            {
                if (mayBay.TrangThai != "Active")
                    ModelState.AddModelError(nameof(request.MaMayBay), "Máy bay này hiện không ở trạng thái Active.");

                if (!mayBay.GheMayBays.Any(g => g.DangSuDung))
                    ModelState.AddModelError(nameof(request.MaMayBay),
                        "Máy bay này chưa có sơ đồ ghế. Hãy sinh sơ đồ ghế trước.");
            }

            bool trungLich = await _db.ChuyenBays.AnyAsync(c =>
                c.SoHieuChuyenBay == request.SoHieuChuyenBay.Trim() &&
                c.GioKhoiHanh == request.GioKhoiHanh);

            if (trungLich)
                ModelState.AddModelError(nameof(request.SoHieuChuyenBay),
                    "Đã tồn tại chuyến bay với số hiệu và giờ khởi hành này.");

            return ModelState.IsValid ? null : ValidationProblem(ModelState);
        }

        private async Task<IActionResult?> ValidateUpdateRequest(int id, ChuyenBayUpdateRequest request)
        {
            if (request.GioHaCanh <= request.GioKhoiHanh)
                ModelState.AddModelError(nameof(request.GioHaCanh), "Giờ hạ cánh phải sau giờ khởi hành.");

            if (request.GioBatDauCheckIn.HasValue && request.GioKetThucCheckIn.HasValue &&
                request.GioKetThucCheckIn <= request.GioBatDauCheckIn)
                ModelState.AddModelError(nameof(request.GioKetThucCheckIn), "Giờ kết thúc check-in phải sau giờ bắt đầu check-in.");

            var loTrinhTonTai = await _db.LoTrinhs.AnyAsync(l => l.MaLoTrinh == request.MaLoTrinh && l.TrangThai == "Active");
            if (!loTrinhTonTai)
                ModelState.AddModelError(nameof(request.MaLoTrinh), "Lộ trình không hợp lệ hoặc không ở trạng thái Active.");

            if (!CacTrangThaiChuyenBay.Contains(request.TrangThai))
                ModelState.AddModelError(nameof(request.TrangThai), "Trạng thái không hợp lệ.");

            bool trungLich = await _db.ChuyenBays.AnyAsync(c =>
                c.MaChuyenBay != id &&
                c.SoHieuChuyenBay == request.SoHieuChuyenBay.Trim() &&
                c.GioKhoiHanh == request.GioKhoiHanh);

            if (trungLich)
                ModelState.AddModelError(nameof(request.SoHieuChuyenBay),
                    "Đã tồn tại chuyến bay khác với số hiệu và giờ khởi hành này.");

            return ModelState.IsValid ? null : ValidationProblem(ModelState);
        }
    }
}
