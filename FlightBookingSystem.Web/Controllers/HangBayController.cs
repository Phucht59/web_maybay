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
    public class HangBayController : ControllerBase
    {
        private const int PageSize = 5;
        private const long MaxLogoSize = 2 * 1024 * 1024;
        private static readonly HashSet<string> AllowedLogoExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".svg", ".png", ".jpg", ".jpeg", ".gif"
        };

        private readonly ApplicationDbContext _db;
        private readonly IWebHostEnvironment _environment;

        public HangBayController(ApplicationDbContext db, IWebHostEnvironment environment)
        {
            _db = db;
            _environment = environment;
        }


        // POST: api/HangBay/upload-logo
        [HttpPost("upload-logo")]
        [RequestSizeLimit(MaxLogoSize)]
        public async Task<IActionResult> UploadLogo(IFormFile? file)
        {
            if (file is null || file.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn file logo cần tải lên." });
            }

            if (file.Length > MaxLogoSize)
            {
                return BadRequest(new { message = "Logo không được vượt quá 2MB." });
            }

            var extension = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(extension) || !AllowedLogoExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Logo chỉ hỗ trợ SVG, PNG, JPG hoặc GIF." });
            }

            var webRootPath = _environment.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            var uploadFolder = Path.Combine(webRootPath, "uploads", "airlines");
            Directory.CreateDirectory(uploadFolder);

            var safeCode = Path.GetFileNameWithoutExtension(file.FileName)
                .Trim()
                .ToLowerInvariant();

            safeCode = string.Concat(safeCode.Select(ch => char.IsLetterOrDigit(ch) ? ch : '-'));
            safeCode = string.IsNullOrWhiteSpace(safeCode) ? "airline-logo" : safeCode;

            var fileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}-{safeCode}{extension.ToLowerInvariant()}";
            var filePath = Path.Combine(uploadFolder, fileName);

            await using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            var relativeUrl = $"/uploads/airlines/{fileName}";
            var absoluteUrl = $"{Request.Scheme}://{Request.Host}{relativeUrl}";

            return Ok(new
            {
                message = "Tải logo thành công.",
                logoUrl = absoluteUrl,
                relativeUrl
            });
        }

        // GET: api/HangBay?tuKhoa=VNA&page=1
        [HttpGet]
        public async Task<IActionResult> GetAll(string? tuKhoa = null, int page = 1)
        {
            // Tải toàn bộ hãng bay về rồi lọc bằng C# — xem giải thích trong Helpers/SearchHelper.cs.
            var allAirlines = await _db.HangBays.AsNoTracking().ToListAsync();

            IEnumerable<HangBay> filtered = allAirlines;

            if (!string.IsNullOrWhiteSpace(tuKhoa))
            {
                var keyword = tuKhoa.Trim();
                filtered = filtered.Where(h =>
                    h.TenHangBay.ContainsKeyword(keyword) ||
                    h.MaCode.ContainsKeyword(keyword) ||
                    h.QuocGia.ContainsKeyword(keyword));
            }

            var filteredList = filtered.OrderBy(h => h.TenHangBay).ToList();

            var totalCount = filteredList.Count;
            var totalPages = Math.Max(1, (int)Math.Ceiling(totalCount / (double)PageSize));
            page = Math.Clamp(page, 1, totalPages);

            var airlines = filteredList
                .Skip((page - 1) * PageSize)
                .Take(PageSize)
                .Select(h => new
                {
                    h.MaHangBay,
                    h.TenHangBay,
                    h.MaCode,
                    h.LogoUrl,
                    h.QuocGia
                })
                .ToList();

            var visibleAirlineIds = airlines.Select(h => h.MaHangBay).ToList();

            var linkedCounts = await _db.MayBays
                .AsNoTracking()
                .Where(m => visibleAirlineIds.Contains(m.MaHangBay))
                .GroupBy(m => m.MaHangBay)
                .Select(g => new { MaHangBay = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.MaHangBay, x => x.Count);

            var data = airlines.Select(h => new
            {
                h.MaHangBay,
                h.TenHangBay,
                h.MaCode,
                h.LogoUrl,
                h.QuocGia,
                SoMayBayDangLienKet = linkedCounts.GetValueOrDefault(h.MaHangBay)
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

        // GET: api/HangBay/1
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _db.HangBays
                .AsNoTracking()
                .Where(h => h.MaHangBay == id)
                .Select(h => new
                {
                    h.MaHangBay,
                    h.TenHangBay,
                    h.MaCode,
                    h.LogoUrl,
                    h.QuocGia
                })
                .FirstOrDefaultAsync();

            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy hãng bay." });
            }

            var airplaneCount = await _db.MayBays
                .AsNoTracking()
                .CountAsync(m => m.MaHangBay == id);

            var routeCount = await _db.ChuyenBays
                .AsNoTracking()
                .Where(c => c.MayBay.MaHangBay == id)
                .Select(c => c.MaLoTrinh)
                .Distinct()
                .CountAsync();

            return Ok(new
            {
                item.MaHangBay,
                item.TenHangBay,
                item.MaCode,
                item.LogoUrl,
                item.QuocGia,
                SoMayBayDangLienKet = airplaneCount,
                SoLoTrinhDangKhaiThac = routeCount
            });
        }

        // POST: api/HangBay
        [HttpPost]
        public async Task<IActionResult> Create(HangBayRequest request)
        {
            Normalize(request);

            var duplicateCode = await _db.HangBays.AnyAsync(h => h.MaCode == request.MaCode);
            if (duplicateCode)
            {
                ModelState.AddModelError(nameof(request.MaCode), "Mã code đã tồn tại.");
            }

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var model = new HangBay
            {
                TenHangBay = request.TenHangBay,
                MaCode = request.MaCode,
                LogoUrl = request.LogoUrl,
                QuocGia = request.QuocGia
            };

            _db.HangBays.Add(model);
            await _db.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = model.MaHangBay }, new
            {
                message = "Tạo hãng bay thành công.",
                data = new
                {
                    model.MaHangBay,
                    model.TenHangBay,
                    model.MaCode,
                    model.LogoUrl,
                    model.QuocGia
                }
            });
        }

        // PUT: api/HangBay/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, HangBayRequest request)
        {
            Normalize(request);

            var item = await _db.HangBays.FindAsync(id);
            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy hãng bay." });
            }

            var duplicateCode = await _db.HangBays.AnyAsync(h => h.MaHangBay != id && h.MaCode == request.MaCode);
            if (duplicateCode)
            {
                ModelState.AddModelError(nameof(request.MaCode), "Mã code đã tồn tại.");
            }

            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            item.TenHangBay = request.TenHangBay;
            item.MaCode = request.MaCode;
            item.LogoUrl = request.LogoUrl;
            item.QuocGia = request.QuocGia;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật hãng bay thành công.",
                data = new
                {
                    item.MaHangBay,
                    item.TenHangBay,
                    item.MaCode,
                    item.LogoUrl,
                    item.QuocGia
                }
            });
        }

        // DELETE: api/HangBay/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var item = await _db.HangBays.FindAsync(id);
            if (item is null)
            {
                return NotFound(new { message = "Không tìm thấy hãng bay." });
            }

            var linkedCount = await _db.MayBays.CountAsync(m => m.MaHangBay == id);
            if (linkedCount > 0)
            {
                return Conflict(new
                {
                    message = $"Không thể xóa hãng bay {item.MaCode} vì đang liên kết với {linkedCount} máy bay."
                });
            }

            _db.HangBays.Remove(item);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Xóa hãng bay thành công." });
        }

        private static void Normalize(HangBayRequest request)
        {
            request.MaCode = (request.MaCode ?? string.Empty).Trim().ToUpperInvariant();
            request.TenHangBay = (request.TenHangBay ?? string.Empty).Trim();
            request.QuocGia = string.IsNullOrWhiteSpace(request.QuocGia) ? null : request.QuocGia.Trim();
            request.LogoUrl = string.IsNullOrWhiteSpace(request.LogoUrl) ? null : request.LogoUrl.Trim();
        }
    }
}