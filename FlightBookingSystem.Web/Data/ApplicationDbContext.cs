using Microsoft.EntityFrameworkCore;
using FlightBookingSystem.Web.Models;

namespace FlightBookingSystem.Web.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<TaiKhoan> TaiKhoans { get; set; }
        public DbSet<SanBay> SanBays { get; set; }
        public DbSet<HangBay> HangBays { get; set; }
        public DbSet<LoTrinh> LoTrinhs { get; set; }
        public DbSet<MayBay> MayBays { get; set; }
        public DbSet<HangGhe> HangGhes { get; set; }
        public DbSet<GheMayBay> GheMayBays { get; set; }
        public DbSet<ChuyenBay> ChuyenBays { get; set; }
        public DbSet<GheChuyenBay> GheChuyenBays { get; set; }
        public DbSet<HanhKhach> HanhKhachs { get; set; }
        public DbSet<PhieuDatCho> PhieuDatChos { get; set; }
        public DbSet<ChangDatCho> ChangDatChos { get; set; }
        public DbSet<Ve> Ves { get; set; }
        public DbSet<ThanhToan> ThanhToans { get; set; }
        public DbSet<HoanTien> HoanTiens { get; set; }
        public DbSet<DichVuThem> DichVuThems { get; set; }
        public DbSet<ChiTietDichVu> ChiTietDichVus { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<TaiKhoan>().HasKey(e => e.MaTaiKhoan);
            modelBuilder.Entity<TaiKhoan>().HasIndex(e => e.Email).IsUnique();
            modelBuilder.Entity<TaiKhoan>().HasIndex(e => e.SoDienThoai).IsUnique();

            modelBuilder.Entity<SanBay>().HasKey(e => e.MaSanBay);

            modelBuilder.Entity<HangBay>().HasKey(e => e.MaHangBay);
            modelBuilder.Entity<HangBay>().HasIndex(e => e.MaCode).IsUnique();

            modelBuilder.Entity<LoTrinh>().HasKey(e => e.MaLoTrinh);
            modelBuilder.Entity<LoTrinh>().HasIndex(e => new { e.MaSanBayDi, e.MaSanBayDen }).IsUnique().HasDatabaseName("IX_LoTrinh_TimKiem");
            modelBuilder.Entity<LoTrinh>()
                .HasOne(l => l.SanBayDi)
                .WithMany(s => s.LoTrinhDi)
                .HasForeignKey(l => l.MaSanBayDi)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<LoTrinh>()
                .HasOne(l => l.SanBayDen)
                .WithMany(s => s.LoTrinhDen)
                .HasForeignKey(l => l.MaSanBayDen)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MayBay>().HasKey(e => e.MaMayBay);
            modelBuilder.Entity<MayBay>().HasIndex(e => e.SoHieuDangKy).IsUnique();
            modelBuilder.Entity<MayBay>()
                .HasOne(m => m.HangBay)
                .WithMany(h => h.MayBays)
                .HasForeignKey(m => m.MaHangBay)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<HangGhe>().HasKey(e => e.MaHangGhe);
            modelBuilder.Entity<HangGhe>().HasIndex(e => e.TenHangGhe).IsUnique();

            modelBuilder.Entity<GheMayBay>().HasKey(e => e.MaGheMayBay);
            modelBuilder.Entity<GheMayBay>().HasIndex(e => new { e.MaMayBay, e.SoGhe }).IsUnique();
            modelBuilder.Entity<GheMayBay>()
                .HasOne(g => g.MayBay)
                .WithMany(m => m.GheMayBays)
                .HasForeignKey(g => g.MaMayBay)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<GheMayBay>()
                .HasOne(g => g.HangGhe)
                .WithMany(h => h.GheMayBays)
                .HasForeignKey(g => g.MaHangGhe)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChuyenBay>().HasKey(e => e.MaChuyenBay);
            modelBuilder.Entity<ChuyenBay>().HasIndex(e => new { e.MaLoTrinh, e.GioKhoiHanh }).HasDatabaseName("IX_ChuyenBay_TimKiem");
            modelBuilder.Entity<ChuyenBay>().HasIndex(e => new { e.SoHieuChuyenBay, e.GioKhoiHanh }).IsUnique();
            modelBuilder.Entity<ChuyenBay>()
                .HasOne(c => c.LoTrinh)
                .WithMany(l => l.ChuyenBays)
                .HasForeignKey(c => c.MaLoTrinh)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ChuyenBay>()
                .HasOne(c => c.MayBay)
                .WithMany(m => m.ChuyenBays)
                .HasForeignKey(c => c.MaMayBay)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<GheChuyenBay>().HasKey(e => e.MaGheChuyenBay);
            modelBuilder.Entity<GheChuyenBay>().HasIndex(e => new { e.MaChuyenBay, e.MaGheMayBay }).IsUnique();
            modelBuilder.Entity<GheChuyenBay>().HasIndex(e => new { e.MaChuyenBay, e.TrangThaiGhe }).HasDatabaseName("IX_GheChuyenBay_ChuyenBay");
            modelBuilder.Entity<GheChuyenBay>().HasIndex(e => new { e.MaChuyenBay, e.TrangThaiGhe, e.GiuDenLuc }).HasDatabaseName("IX_GheChuyenBay_Realtime");
            modelBuilder.Entity<GheChuyenBay>()
                .HasOne(g => g.ChuyenBay)
                .WithMany(c => c.GheChuyenBays)
                .HasForeignKey(g => g.MaChuyenBay)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<GheChuyenBay>()
                .HasOne(g => g.GheMayBay)
                .WithMany(g => g.GheChuyenBays)
                .HasForeignKey(g => g.MaGheMayBay)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<GheChuyenBay>()
                .HasOne(g => g.PhieuDatChoDangGiu)
                .WithMany(p => p.GheDangGius)
                .HasForeignKey(g => g.MaPhieuDatChoDangGiu)
                .OnDelete(DeleteBehavior.SetNull);
            modelBuilder.Entity<GheChuyenBay>()
                .HasOne(g => g.GiuBoiTaiKhoan)
                .WithMany(t => t.GheDangGius)
                .HasForeignKey(g => g.GiuBoiTaiKhoanId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<HanhKhach>().HasKey(e => e.MaHanhKhach);
            modelBuilder.Entity<HanhKhach>().HasIndex(e => new { e.MaPhieuDatCho, e.SoGiayTo });
            modelBuilder.Entity<HanhKhach>()
                .HasOne(h => h.PhieuDatCho)
                .WithMany(p => p.HanhKhachs)
                .HasForeignKey(h => h.MaPhieuDatCho)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PhieuDatCho>().HasKey(e => e.MaPhieuDatCho);
            modelBuilder.Entity<PhieuDatCho>().HasIndex(e => e.MaDatCho).IsUnique();
            modelBuilder.Entity<PhieuDatCho>().HasIndex(e => e.MaTaiKhoan).HasDatabaseName("IX_PhieuDatCho_TaiKhoan");
            modelBuilder.Entity<PhieuDatCho>().HasIndex(e => new { e.TrangThai, e.GiuDenLuc }).HasDatabaseName("IX_PhieuDatCho_HetHan");
            modelBuilder.Entity<PhieuDatCho>()
                .Property(e => e.HoTenLienHe)
                .IsRequired()
                .HasMaxLength(160);
            modelBuilder.Entity<PhieuDatCho>()
                .Property(e => e.EmailLienHe)
                .IsRequired()
                .HasMaxLength(254);
            modelBuilder.Entity<PhieuDatCho>()
                .Property(e => e.SoDienThoaiLienHe)
                .IsRequired()
                .HasMaxLength(40);
            modelBuilder.Entity<PhieuDatCho>()
                .HasOne(p => p.TaiKhoan)
                .WithMany(t => t.PhieuDatChos)
                .HasForeignKey(p => p.MaTaiKhoan)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ChangDatCho>().HasKey(e => e.MaChangDatCho);
            modelBuilder.Entity<ChangDatCho>().HasIndex(e => new { e.MaPhieuDatCho, e.ThuTuChang }).IsUnique();
            modelBuilder.Entity<ChangDatCho>().HasIndex(e => new { e.MaChuyenBay, e.LoaiChang });
            modelBuilder.Entity<ChangDatCho>()
                .HasOne(c => c.PhieuDatCho)
                .WithMany(p => p.ChangDatChos)
                .HasForeignKey(c => c.MaPhieuDatCho)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ChangDatCho>()
                .HasOne(c => c.ChuyenBay)
                .WithMany(c => c.ChangDatChos)
                .HasForeignKey(c => c.MaChuyenBay)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Ve>().HasKey(e => e.MaVe);
            modelBuilder.Entity<Ve>()
                .HasIndex(e => e.SoVeDienTu)
                .IsUnique()
                .HasFilter("SoVeDienTu IS NOT NULL");
            modelBuilder.Entity<Ve>().HasIndex(e => new { e.MaChangDatCho, e.MaHanhKhach }).IsUnique();
            modelBuilder.Entity<Ve>().HasIndex(e => e.MaGheChuyenBay)
                .IsUnique()
                .HasFilter("TrangThaiVe NOT IN ('Canceled', 'Refunded')")
                .HasDatabaseName("UQ_Ve_GheChuyenBay_ConHieuLuc");
            modelBuilder.Entity<Ve>().HasIndex(e => e.MaPhieuDatCho).HasDatabaseName("IX_Ve_PhieuDatCho");
            modelBuilder.Entity<Ve>()
                .HasOne(v => v.PhieuDatCho)
                .WithMany(p => p.Ves)
                .HasForeignKey(v => v.MaPhieuDatCho)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Ve>()
                .HasOne(v => v.ChangDatCho)
                .WithMany(c => c.Ves)
                .HasForeignKey(v => v.MaChangDatCho)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Ve>()
                .HasOne(v => v.GheChuyenBay)
                .WithMany(g => g.Ves)
                .HasForeignKey(v => v.MaGheChuyenBay)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Ve>()
                .HasOne(v => v.HanhKhach)
                .WithMany(h => h.Ves)
                .HasForeignKey(v => v.MaHanhKhach)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ThanhToan>().HasKey(e => e.MaThanhToan);
            modelBuilder.Entity<ThanhToan>().HasIndex(e => e.MaPhieuDatCho).HasDatabaseName("IX_ThanhToan_PhieuDatCho");
            modelBuilder.Entity<ThanhToan>().HasIndex(e => e.MaGiaoDich).IsUnique().HasFilter("MaGiaoDich IS NOT NULL");
            modelBuilder.Entity<ThanhToan>().HasIndex(e => e.IdempotencyKey).IsUnique().HasFilter("IdempotencyKey IS NOT NULL");
            modelBuilder.Entity<ThanhToan>()
                .HasOne(t => t.PhieuDatCho)
                .WithMany(p => p.ThanhToans)
                .HasForeignKey(t => t.MaPhieuDatCho)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<HoanTien>().HasKey(e => e.MaHoanTien);
            modelBuilder.Entity<HoanTien>().HasIndex(e => e.MaGiaoDichHoanTien).IsUnique().HasFilter("MaGiaoDichHoanTien IS NOT NULL");
            modelBuilder.Entity<HoanTien>()
                .HasOne(h => h.ThanhToan)
                .WithMany(t => t.HoanTiens)
                .HasForeignKey(h => h.MaThanhToan)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<HoanTien>()
                .HasOne(h => h.PhieuDatCho)
                .WithMany(p => p.HoanTiens)
                .HasForeignKey(h => h.MaPhieuDatCho)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DichVuThem>().HasKey(e => e.MaDichVu);
            modelBuilder.Entity<DichVuThem>().HasIndex(e => new { e.LoaiDichVu, e.TrangThai });

            modelBuilder.Entity<ChiTietDichVu>().HasKey(e => e.MaChiTietDichVu);
            modelBuilder.Entity<ChiTietDichVu>().HasIndex(e => new { e.MaPhieuDatCho, e.MaVe, e.MaDichVu });
            modelBuilder.Entity<ChiTietDichVu>()
                .HasIndex(c => c.MaHanhKhach)
                .HasDatabaseName("IX_ChiTietDichVu_HanhKhach");
            modelBuilder.Entity<ChiTietDichVu>()
                .HasOne(c => c.PhieuDatCho)
                .WithMany(p => p.ChiTietDichVus)
                .HasForeignKey(c => c.MaPhieuDatCho)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<ChiTietDichVu>()
                .HasOne(c => c.Ve)
                .WithMany(v => v.ChiTietDichVus)
                .HasForeignKey(c => c.MaVe)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ChiTietDichVu>()
                .HasOne(c => c.HanhKhach)
                .WithMany(h => h.ChiTietDichVus)
                .HasForeignKey(c => c.MaHanhKhach)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<ChiTietDichVu>()
                .HasOne(c => c.DichVuThem)
                .WithMany(d => d.ChiTietDichVus)
                .HasForeignKey(c => c.MaDichVu)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
