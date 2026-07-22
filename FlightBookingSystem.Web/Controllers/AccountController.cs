using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FlightBookingSystem.Web.Data;
using FlightBookingSystem.Web.Models;
using FlightBookingSystem.Web.Models.DTOs;

namespace FlightBookingSystem.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;
        private readonly IPasswordHasher<TaiKhoan> _passwordHasher;

        public AccountController(ApplicationDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
            _passwordHasher = new PasswordHasher<TaiKhoan>();
        }

        // POST: api/Account/Register
        [HttpPost("Register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            bool emailExists = await _db.TaiKhoans.AnyAsync(t => t.Email == request.Email);
            if (emailExists)
                ModelState.AddModelError(nameof(request.Email), "Email này đã được đăng ký.");

            var phone = string.IsNullOrWhiteSpace(request.SoDienThoai)
                ? null
                : request.SoDienThoai.Trim();
            if (phone is not null)
            {
                bool phoneExists = await _db.TaiKhoans.AnyAsync(t => t.SoDienThoai == phone);
                if (phoneExists)
                    ModelState.AddModelError(nameof(request.SoDienThoai), "Số điện thoại này đã được đăng ký.");
            }

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var taiKhoan = new TaiKhoan
            {
                Email = request.Email.Trim(),
                HoTen = request.HoTen.Trim(),
                SoDienThoai = phone,
                VaiTro = "Customer",
                TrangThai = "Active",
                NgayTao = DateTime.UtcNow
            };

            taiKhoan.MatKhauHash = _passwordHasher.HashPassword(taiKhoan, request.MatKhau);

            _db.TaiKhoans.Add(taiKhoan);
            await _db.SaveChangesAsync();

            return Ok(CreateAuthResponse(taiKhoan));
        }

        // POST: api/Account/Login
        [HttpPost("Login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var email = request.Email.Trim();

            var taiKhoan = await _db.TaiKhoans
                .FirstOrDefaultAsync(t => t.Email == email);

            if (taiKhoan is null)
                return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });

            var result = _passwordHasher.VerifyHashedPassword(
                taiKhoan,
                taiKhoan.MatKhauHash,
                request.MatKhau
            );

            if (result == PasswordVerificationResult.Failed)
                return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });

            if (taiKhoan.TrangThai != "Active")
                return Unauthorized(new { message = "Tài khoản của bạn đã bị khóa hoặc vô hiệu hóa." });

            return Ok(CreateAuthResponse(taiKhoan));
        }

        // POST: api/Account/Logout
        [HttpPost("Logout")]
        public IActionResult Logout()
        {
            return Ok(new { message = "Đã đăng xuất. Client hãy xóa JWT token ở phía thiết bị." });
        }

        private AuthResponse CreateAuthResponse(TaiKhoan taiKhoan)
        {
            return new AuthResponse
            {
                Token = TaoJwtToken(taiKhoan),
                MaTaiKhoan = taiKhoan.MaTaiKhoan,
                HoTen = taiKhoan.HoTen,
                Email = taiKhoan.Email,
                SoDienThoai = taiKhoan.SoDienThoai ?? string.Empty,
                VaiTro = taiKhoan.VaiTro
            };
        }

        private string TaoJwtToken(TaiKhoan taiKhoan)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, taiKhoan.MaTaiKhoan.ToString()),
                new(ClaimTypes.Name, taiKhoan.HoTen),
                new(ClaimTypes.Email, taiKhoan.Email),
                new(ClaimTypes.Role, taiKhoan.VaiTro)
            };

            var jwtKey = _config["Jwt:Key"]
                ?? throw new InvalidOperationException("Chưa cấu hình Jwt:Key.");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expiresInMinutes = _config.GetValue<int?>("Jwt:ExpiresInMinutes") ?? 120;

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
