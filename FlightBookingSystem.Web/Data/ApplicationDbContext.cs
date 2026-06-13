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
        public DbSet<Ve> Ves { get; set; }
        public DbSet<ThanhToan> ThanhToans { get; set; }
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
                .WithMany()
                .HasForeignKey(l => l.MaSanBayDi)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<LoTrinh>()
                .HasOne(l => l.SanBayDen)
                .WithMany()
                .HasForeignKey(l => l.MaSanBayDen)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<MayBay>().HasKey(e => e.MaMayBay);
            modelBuilder.Entity<MayBay>().HasIndex(e => e.SoHieuDangKy).IsUnique();

            modelBuilder.Entity<HangGhe>().HasKey(e => e.MaHangGhe);
            modelBuilder.Entity<HangGhe>().HasIndex(e => e.TenHangGhe).IsUnique();

            modelBuilder.Entity<GheMayBay>().HasKey(e => e.MaGheMayBay);
            modelBuilder.Entity<GheMayBay>().HasIndex(e => new { e.MaMayBay, e.SoGhe }).IsUnique();

            modelBuilder.Entity<ChuyenBay>().HasKey(e => e.MaChuyenBay);
            modelBuilder.Entity<ChuyenBay>().HasIndex(e => new { e.MaLoTrinh, e.GioKhoiHanh }).HasDatabaseName("IX_ChuyenBay_TimKiem");

            modelBuilder.Entity<GheChuyenBay>().HasKey(e => e.MaGheChuyenBay);
            modelBuilder.Entity<GheChuyenBay>().HasIndex(e => new { e.MaChuyenBay, e.MaGheMayBay }).IsUnique();
            modelBuilder.Entity<GheChuyenBay>().HasIndex(e => new { e.MaChuyenBay, e.TrangThaiGhe }).HasDatabaseName("IX_GheChuyenBay_ChuyenBay");

            modelBuilder.Entity<HanhKhach>().HasKey(e => e.MaHanhKhach);

            modelBuilder.Entity<PhieuDatCho>().HasKey(e => e.MaPhieuDatCho);
            modelBuilder.Entity<PhieuDatCho>().HasIndex(e => e.MaTaiKhoan).HasDatabaseName("IX_PhieuDatCho_TaiKhoan");

            modelBuilder.Entity<Ve>().HasKey(e => e.MaVe);
            modelBuilder.Entity<Ve>().HasIndex(e => e.MaGheChuyenBay)
                .IsUnique()
                .HasFilter("TrangThaiVe NOT IN ('Canceled', 'Refunded')")
                .HasDatabaseName("UQ_Ve_GheChuyenBay_ConHieuLuc");
            modelBuilder.Entity<Ve>().HasIndex(e => e.MaPhieuDatCho).HasDatabaseName("IX_Ve_PhieuDatCho");

            modelBuilder.Entity<ThanhToan>().HasKey(e => e.MaThanhToan);
            modelBuilder.Entity<ThanhToan>().HasIndex(e => e.MaPhieuDatCho).HasDatabaseName("IX_ThanhToan_PhieuDatCho");

            modelBuilder.Entity<DichVuThem>().HasKey(e => e.MaDichVu);

            modelBuilder.Entity<ChiTietDichVu>().HasKey(e => e.MaChiTietDichVu);
            modelBuilder.Entity<ChiTietDichVu>().HasIndex(e => new { e.MaVe, e.MaDichVu }).IsUnique();
        }
    }
}
