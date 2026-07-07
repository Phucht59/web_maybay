using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FlightBookingSystem.Web.Models;

namespace FlightBookingSystem.Web.Data
{
    public static class DbInitializer
    {
        /// <summary>
        /// Seed tài khoản Admin theo email cấu hình (AdminSeed:Email).
        /// Idempotent theo EMAIL cụ thể
        /// để hỗ trợ đúng việc đổi/luân chuyển email admin qua các môi trường.
        /// </summary>
        public static async Task SeedAdminAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var provider = scope.ServiceProvider;

            var db = provider.GetRequiredService<ApplicationDbContext>();
            var config = provider.GetRequiredService<IConfiguration>();
            var logger = provider.GetRequiredService<ILogger<ApplicationDbContext>>();

            await db.Database.MigrateAsync();

            var email = config["AdminSeed:Email"]?.Trim();
            var password = config["AdminSeed:Password"];
            var hoTen = config["AdminSeed:HoTen"] ?? "System Administrator";
            var sdt = config["AdminSeed:SoDienThoai"] ?? "0000000000";

            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            {
                logger.LogWarning(
                    "Không tìm thấy AdminSeed:Email hoặc AdminSeed:Password trong cấu hình. " +
                    "Bỏ qua tạo tài khoản Admin. Hãy chạy: dotnet user-secrets set \"AdminSeed:Password\" \"...\"");
                return;
            }

            if (password.Length < 6)
            {
                logger.LogWarning("AdminSeed:Password quá ngắn (tối thiểu 8 ký tự). Bỏ qua tạo tài khoản Admin.");
                return;
            }

            // Idempotent theo email cụ thể, không theo role chung chung
            var existing = await db.TaiKhoans.FirstOrDefaultAsync(t => t.Email == email);

            if (existing is not null)
            {
                if (existing.VaiTro == "Admin")
                {
                    logger.LogInformation("Bỏ qua seed: tài khoản Admin '{Email}' đã tồn tại.", email);
                }
                else
                {
                    // KHÔNG tự động nâng quyền — tránh privilege escalation ngầm
                    logger.LogWarning(
                        "Email '{Email}' đã tồn tại trong hệ thống với vai trò '{Role}' (không phải Admin). " +
                        "Seeder sẽ không tự động thay đổi vai trò tài khoản này. " +
                        "Nếu muốn dùng email này làm Admin, hãy cập nhật thủ công hoặc đổi AdminSeed:Email sang email khác.",
                        email, existing.VaiTro);
                }
                return;
            }

            // Email chưa tồn tại -> tạo mới
            var admin = new TaiKhoan
            {
                Email = email,
                HoTen = hoTen,
                SoDienThoai = sdt,
                VaiTro = "Admin",
                TrangThai = "Active",
                NgayTao = DateTime.UtcNow
            };

            var hasher = new PasswordHasher<TaiKhoan>();
            admin.MatKhauHash = hasher.HashPassword(admin, password);

            db.TaiKhoans.Add(admin);
            await db.SaveChangesAsync();

            logger.LogInformation("Đã tạo tài khoản Admin mới: {Email}", email);
        }
    }
}