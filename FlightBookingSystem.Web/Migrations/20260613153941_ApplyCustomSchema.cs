using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightBookingSystem.Web.Migrations
{
    /// <inheritdoc />
    public partial class ApplyCustomSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DichVuThems",
                columns: table => new
                {
                    MaDichVu = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    KhoiLuongKg = table.Column<int>(type: "INTEGER", nullable: false),
                    Gia = table.Column<decimal>(type: "TEXT", nullable: false),
                    MoTa = table.Column<string>(type: "TEXT", nullable: true),
                    TrangThai = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DichVuThems", x => x.MaDichVu);
                });

            migrationBuilder.CreateTable(
                name: "HangBays",
                columns: table => new
                {
                    MaHangBay = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TenHangBay = table.Column<string>(type: "TEXT", nullable: false),
                    MaCode = table.Column<string>(type: "TEXT", nullable: false),
                    LogoUrl = table.Column<string>(type: "TEXT", nullable: true),
                    QuocGia = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HangBays", x => x.MaHangBay);
                });

            migrationBuilder.CreateTable(
                name: "HangGhes",
                columns: table => new
                {
                    MaHangGhe = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TenHangGhe = table.Column<string>(type: "TEXT", nullable: false),
                    HeSoGia = table.Column<decimal>(type: "TEXT", nullable: false),
                    MoTa = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HangGhes", x => x.MaHangGhe);
                });

            migrationBuilder.CreateTable(
                name: "HanhKhachs",
                columns: table => new
                {
                    MaHanhKhach = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    HoTen = table.Column<string>(type: "TEXT", nullable: false),
                    SoCCCD = table.Column<string>(type: "TEXT", nullable: true),
                    SoHoChieu = table.Column<string>(type: "TEXT", nullable: true),
                    NgaySinh = table.Column<string>(type: "TEXT", nullable: true),
                    GioiTinh = table.Column<string>(type: "TEXT", nullable: true),
                    QuocTich = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HanhKhachs", x => x.MaHanhKhach);
                });

            migrationBuilder.CreateTable(
                name: "SanBays",
                columns: table => new
                {
                    MaSanBay = table.Column<string>(type: "TEXT", nullable: false),
                    TenSanBay = table.Column<string>(type: "TEXT", nullable: false),
                    ThanhPho = table.Column<string>(type: "TEXT", nullable: false),
                    QuocGia = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SanBays", x => x.MaSanBay);
                });

            migrationBuilder.CreateTable(
                name: "TaiKhoans",
                columns: table => new
                {
                    MaTaiKhoan = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    HoTen = table.Column<string>(type: "TEXT", nullable: false),
                    MatKhauHash = table.Column<string>(type: "TEXT", nullable: false),
                    SoDienThoai = table.Column<string>(type: "TEXT", nullable: false),
                    VaiTro = table.Column<string>(type: "TEXT", nullable: false),
                    TrangThai = table.Column<string>(type: "TEXT", nullable: false),
                    NgayTao = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaiKhoans", x => x.MaTaiKhoan);
                });

            migrationBuilder.CreateTable(
                name: "MayBays",
                columns: table => new
                {
                    MaMayBay = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaHangBay = table.Column<int>(type: "INTEGER", nullable: false),
                    DongMayBay = table.Column<string>(type: "TEXT", nullable: false),
                    SoHieuDangKy = table.Column<string>(type: "TEXT", nullable: true),
                    TongSoGhe = table.Column<int>(type: "INTEGER", nullable: false),
                    TrangThai = table.Column<string>(type: "TEXT", nullable: false),
                    HangBayMaHangBay = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MayBays", x => x.MaMayBay);
                    table.ForeignKey(
                        name: "FK_MayBays_HangBays_HangBayMaHangBay",
                        column: x => x.HangBayMaHangBay,
                        principalTable: "HangBays",
                        principalColumn: "MaHangBay");
                });

            migrationBuilder.CreateTable(
                name: "LoTrinhs",
                columns: table => new
                {
                    MaLoTrinh = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaSanBayDi = table.Column<string>(type: "TEXT", nullable: false),
                    MaSanBayDen = table.Column<string>(type: "TEXT", nullable: false),
                    GiaCoBan = table.Column<decimal>(type: "TEXT", nullable: false),
                    KhoangCachKm = table.Column<int>(type: "INTEGER", nullable: true),
                    TrangThai = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoTrinhs", x => x.MaLoTrinh);
                    table.ForeignKey(
                        name: "FK_LoTrinhs_SanBays_MaSanBayDen",
                        column: x => x.MaSanBayDen,
                        principalTable: "SanBays",
                        principalColumn: "MaSanBay",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LoTrinhs_SanBays_MaSanBayDi",
                        column: x => x.MaSanBayDi,
                        principalTable: "SanBays",
                        principalColumn: "MaSanBay",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PhieuDatChos",
                columns: table => new
                {
                    MaPhieuDatCho = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaTaiKhoan = table.Column<int>(type: "INTEGER", nullable: false),
                    NgayDat = table.Column<string>(type: "TEXT", nullable: false),
                    ThoiGianHetHan = table.Column<string>(type: "TEXT", nullable: false),
                    TongTien = table.Column<decimal>(type: "TEXT", nullable: false),
                    TrangThai = table.Column<string>(type: "TEXT", nullable: false),
                    TaiKhoanMaTaiKhoan = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhieuDatChos", x => x.MaPhieuDatCho);
                    table.ForeignKey(
                        name: "FK_PhieuDatChos_TaiKhoans_TaiKhoanMaTaiKhoan",
                        column: x => x.TaiKhoanMaTaiKhoan,
                        principalTable: "TaiKhoans",
                        principalColumn: "MaTaiKhoan");
                });

            migrationBuilder.CreateTable(
                name: "GheMayBays",
                columns: table => new
                {
                    MaGheMayBay = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaMayBay = table.Column<int>(type: "INTEGER", nullable: false),
                    SoGhe = table.Column<string>(type: "TEXT", nullable: false),
                    MaHangGhe = table.Column<int>(type: "INTEGER", nullable: false),
                    DangSuDung = table.Column<int>(type: "INTEGER", nullable: false),
                    MayBayMaMayBay = table.Column<int>(type: "INTEGER", nullable: true),
                    HangGheMaHangGhe = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GheMayBays", x => x.MaGheMayBay);
                    table.ForeignKey(
                        name: "FK_GheMayBays_HangGhes_HangGheMaHangGhe",
                        column: x => x.HangGheMaHangGhe,
                        principalTable: "HangGhes",
                        principalColumn: "MaHangGhe");
                    table.ForeignKey(
                        name: "FK_GheMayBays_MayBays_MayBayMaMayBay",
                        column: x => x.MayBayMaMayBay,
                        principalTable: "MayBays",
                        principalColumn: "MaMayBay");
                });

            migrationBuilder.CreateTable(
                name: "ChuyenBays",
                columns: table => new
                {
                    MaChuyenBay = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaLoTrinh = table.Column<int>(type: "INTEGER", nullable: false),
                    MaMayBay = table.Column<int>(type: "INTEGER", nullable: false),
                    GioKhoiHanh = table.Column<string>(type: "TEXT", nullable: false),
                    GioHaCanh = table.Column<string>(type: "TEXT", nullable: false),
                    NhaGa = table.Column<string>(type: "TEXT", nullable: true),
                    CuaLen = table.Column<string>(type: "TEXT", nullable: true),
                    GioBatDauCheckIn = table.Column<string>(type: "TEXT", nullable: true),
                    GioKetThucCheckIn = table.Column<string>(type: "TEXT", nullable: true),
                    GioLenMayBay = table.Column<string>(type: "TEXT", nullable: true),
                    GioKhoiHanhThucTe = table.Column<string>(type: "TEXT", nullable: true),
                    GioHaCanhThucTe = table.Column<string>(type: "TEXT", nullable: true),
                    LyDoTreChuyen = table.Column<string>(type: "TEXT", nullable: true),
                    GiaCoBan = table.Column<decimal>(type: "TEXT", nullable: false),
                    TrangThai = table.Column<string>(type: "TEXT", nullable: false),
                    LoTrinhMaLoTrinh = table.Column<int>(type: "INTEGER", nullable: true),
                    MayBayMaMayBay = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChuyenBays", x => x.MaChuyenBay);
                    table.ForeignKey(
                        name: "FK_ChuyenBays_LoTrinhs_LoTrinhMaLoTrinh",
                        column: x => x.LoTrinhMaLoTrinh,
                        principalTable: "LoTrinhs",
                        principalColumn: "MaLoTrinh");
                    table.ForeignKey(
                        name: "FK_ChuyenBays_MayBays_MayBayMaMayBay",
                        column: x => x.MayBayMaMayBay,
                        principalTable: "MayBays",
                        principalColumn: "MaMayBay");
                });

            migrationBuilder.CreateTable(
                name: "ThanhToans",
                columns: table => new
                {
                    MaThanhToan = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaPhieuDatCho = table.Column<int>(type: "INTEGER", nullable: false),
                    PhuongThuc = table.Column<string>(type: "TEXT", nullable: false),
                    NhaCungCap = table.Column<string>(type: "TEXT", nullable: true),
                    MaGiaoDich = table.Column<string>(type: "TEXT", nullable: true),
                    NgayThanhToan = table.Column<string>(type: "TEXT", nullable: true),
                    SoTien = table.Column<decimal>(type: "TEXT", nullable: false),
                    TrangThai = table.Column<string>(type: "TEXT", nullable: false),
                    LyDoLoi = table.Column<string>(type: "TEXT", nullable: true),
                    PhieuDatChoMaPhieuDatCho = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ThanhToans", x => x.MaThanhToan);
                    table.ForeignKey(
                        name: "FK_ThanhToans_PhieuDatChos_PhieuDatChoMaPhieuDatCho",
                        column: x => x.PhieuDatChoMaPhieuDatCho,
                        principalTable: "PhieuDatChos",
                        principalColumn: "MaPhieuDatCho");
                });

            migrationBuilder.CreateTable(
                name: "GheChuyenBays",
                columns: table => new
                {
                    MaGheChuyenBay = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaChuyenBay = table.Column<int>(type: "INTEGER", nullable: false),
                    MaGheMayBay = table.Column<int>(type: "INTEGER", nullable: false),
                    TrangThaiGhe = table.Column<string>(type: "TEXT", nullable: false),
                    GiaGhe = table.Column<decimal>(type: "TEXT", nullable: false),
                    PhienBan = table.Column<int>(type: "INTEGER", nullable: false),
                    ChuyenBayMaChuyenBay = table.Column<int>(type: "INTEGER", nullable: true),
                    GheMayBayMaGheMayBay = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GheChuyenBays", x => x.MaGheChuyenBay);
                    table.ForeignKey(
                        name: "FK_GheChuyenBays_ChuyenBays_ChuyenBayMaChuyenBay",
                        column: x => x.ChuyenBayMaChuyenBay,
                        principalTable: "ChuyenBays",
                        principalColumn: "MaChuyenBay");
                    table.ForeignKey(
                        name: "FK_GheChuyenBays_GheMayBays_GheMayBayMaGheMayBay",
                        column: x => x.GheMayBayMaGheMayBay,
                        principalTable: "GheMayBays",
                        principalColumn: "MaGheMayBay");
                });

            migrationBuilder.CreateTable(
                name: "Ves",
                columns: table => new
                {
                    MaVe = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaPhieuDatCho = table.Column<int>(type: "INTEGER", nullable: false),
                    MaGheChuyenBay = table.Column<int>(type: "INTEGER", nullable: false),
                    MaHanhKhach = table.Column<int>(type: "INTEGER", nullable: false),
                    GiaVe = table.Column<decimal>(type: "TEXT", nullable: false),
                    TrangThaiVe = table.Column<string>(type: "TEXT", nullable: false),
                    PhieuDatChoMaPhieuDatCho = table.Column<int>(type: "INTEGER", nullable: true),
                    GheChuyenBayMaGheChuyenBay = table.Column<int>(type: "INTEGER", nullable: true),
                    HanhKhachMaHanhKhach = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ves", x => x.MaVe);
                    table.ForeignKey(
                        name: "FK_Ves_GheChuyenBays_GheChuyenBayMaGheChuyenBay",
                        column: x => x.GheChuyenBayMaGheChuyenBay,
                        principalTable: "GheChuyenBays",
                        principalColumn: "MaGheChuyenBay");
                    table.ForeignKey(
                        name: "FK_Ves_HanhKhachs_HanhKhachMaHanhKhach",
                        column: x => x.HanhKhachMaHanhKhach,
                        principalTable: "HanhKhachs",
                        principalColumn: "MaHanhKhach");
                    table.ForeignKey(
                        name: "FK_Ves_PhieuDatChos_PhieuDatChoMaPhieuDatCho",
                        column: x => x.PhieuDatChoMaPhieuDatCho,
                        principalTable: "PhieuDatChos",
                        principalColumn: "MaPhieuDatCho");
                });

            migrationBuilder.CreateTable(
                name: "ChiTietDichVus",
                columns: table => new
                {
                    MaChiTietDichVu = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaVe = table.Column<int>(type: "INTEGER", nullable: false),
                    MaDichVu = table.Column<int>(type: "INTEGER", nullable: false),
                    SoLuong = table.Column<int>(type: "INTEGER", nullable: false),
                    Gia = table.Column<decimal>(type: "TEXT", nullable: false),
                    VeMaVe = table.Column<int>(type: "INTEGER", nullable: true),
                    DichVuThemMaDichVu = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChiTietDichVus", x => x.MaChiTietDichVu);
                    table.ForeignKey(
                        name: "FK_ChiTietDichVus_DichVuThems_DichVuThemMaDichVu",
                        column: x => x.DichVuThemMaDichVu,
                        principalTable: "DichVuThems",
                        principalColumn: "MaDichVu");
                    table.ForeignKey(
                        name: "FK_ChiTietDichVus_Ves_VeMaVe",
                        column: x => x.VeMaVe,
                        principalTable: "Ves",
                        principalColumn: "MaVe");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChiTietDichVus_DichVuThemMaDichVu",
                table: "ChiTietDichVus",
                column: "DichVuThemMaDichVu");

            migrationBuilder.CreateIndex(
                name: "IX_ChiTietDichVus_MaVe_MaDichVu",
                table: "ChiTietDichVus",
                columns: new[] { "MaVe", "MaDichVu" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChiTietDichVus_VeMaVe",
                table: "ChiTietDichVus",
                column: "VeMaVe");

            migrationBuilder.CreateIndex(
                name: "IX_ChuyenBay_TimKiem",
                table: "ChuyenBays",
                columns: new[] { "MaLoTrinh", "GioKhoiHanh" });

            migrationBuilder.CreateIndex(
                name: "IX_ChuyenBays_LoTrinhMaLoTrinh",
                table: "ChuyenBays",
                column: "LoTrinhMaLoTrinh");

            migrationBuilder.CreateIndex(
                name: "IX_ChuyenBays_MayBayMaMayBay",
                table: "ChuyenBays",
                column: "MayBayMaMayBay");

            migrationBuilder.CreateIndex(
                name: "IX_GheChuyenBay_ChuyenBay",
                table: "GheChuyenBays",
                columns: new[] { "MaChuyenBay", "TrangThaiGhe" });

            migrationBuilder.CreateIndex(
                name: "IX_GheChuyenBays_ChuyenBayMaChuyenBay",
                table: "GheChuyenBays",
                column: "ChuyenBayMaChuyenBay");

            migrationBuilder.CreateIndex(
                name: "IX_GheChuyenBays_GheMayBayMaGheMayBay",
                table: "GheChuyenBays",
                column: "GheMayBayMaGheMayBay");

            migrationBuilder.CreateIndex(
                name: "IX_GheChuyenBays_MaChuyenBay_MaGheMayBay",
                table: "GheChuyenBays",
                columns: new[] { "MaChuyenBay", "MaGheMayBay" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GheMayBays_HangGheMaHangGhe",
                table: "GheMayBays",
                column: "HangGheMaHangGhe");

            migrationBuilder.CreateIndex(
                name: "IX_GheMayBays_MaMayBay_SoGhe",
                table: "GheMayBays",
                columns: new[] { "MaMayBay", "SoGhe" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GheMayBays_MayBayMaMayBay",
                table: "GheMayBays",
                column: "MayBayMaMayBay");

            migrationBuilder.CreateIndex(
                name: "IX_HangBays_MaCode",
                table: "HangBays",
                column: "MaCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HangGhes_TenHangGhe",
                table: "HangGhes",
                column: "TenHangGhe",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LoTrinh_TimKiem",
                table: "LoTrinhs",
                columns: new[] { "MaSanBayDi", "MaSanBayDen" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LoTrinhs_MaSanBayDen",
                table: "LoTrinhs",
                column: "MaSanBayDen");

            migrationBuilder.CreateIndex(
                name: "IX_MayBays_HangBayMaHangBay",
                table: "MayBays",
                column: "HangBayMaHangBay");

            migrationBuilder.CreateIndex(
                name: "IX_MayBays_SoHieuDangKy",
                table: "MayBays",
                column: "SoHieuDangKy",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PhieuDatCho_TaiKhoan",
                table: "PhieuDatChos",
                column: "MaTaiKhoan");

            migrationBuilder.CreateIndex(
                name: "IX_PhieuDatChos_TaiKhoanMaTaiKhoan",
                table: "PhieuDatChos",
                column: "TaiKhoanMaTaiKhoan");

            migrationBuilder.CreateIndex(
                name: "IX_TaiKhoans_Email",
                table: "TaiKhoans",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaiKhoans_SoDienThoai",
                table: "TaiKhoans",
                column: "SoDienThoai",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ThanhToan_PhieuDatCho",
                table: "ThanhToans",
                column: "MaPhieuDatCho");

            migrationBuilder.CreateIndex(
                name: "IX_ThanhToans_PhieuDatChoMaPhieuDatCho",
                table: "ThanhToans",
                column: "PhieuDatChoMaPhieuDatCho");

            migrationBuilder.CreateIndex(
                name: "IX_Ve_PhieuDatCho",
                table: "Ves",
                column: "MaPhieuDatCho");

            migrationBuilder.CreateIndex(
                name: "IX_Ves_GheChuyenBayMaGheChuyenBay",
                table: "Ves",
                column: "GheChuyenBayMaGheChuyenBay");

            migrationBuilder.CreateIndex(
                name: "IX_Ves_HanhKhachMaHanhKhach",
                table: "Ves",
                column: "HanhKhachMaHanhKhach");

            migrationBuilder.CreateIndex(
                name: "IX_Ves_PhieuDatChoMaPhieuDatCho",
                table: "Ves",
                column: "PhieuDatChoMaPhieuDatCho");

            migrationBuilder.CreateIndex(
                name: "UQ_Ve_GheChuyenBay_ConHieuLuc",
                table: "Ves",
                column: "MaGheChuyenBay",
                unique: true,
                filter: "TrangThaiVe NOT IN ('Canceled', 'Refunded')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChiTietDichVus");

            migrationBuilder.DropTable(
                name: "ThanhToans");

            migrationBuilder.DropTable(
                name: "DichVuThems");

            migrationBuilder.DropTable(
                name: "Ves");

            migrationBuilder.DropTable(
                name: "GheChuyenBays");

            migrationBuilder.DropTable(
                name: "HanhKhachs");

            migrationBuilder.DropTable(
                name: "PhieuDatChos");

            migrationBuilder.DropTable(
                name: "ChuyenBays");

            migrationBuilder.DropTable(
                name: "GheMayBays");

            migrationBuilder.DropTable(
                name: "TaiKhoans");

            migrationBuilder.DropTable(
                name: "LoTrinhs");

            migrationBuilder.DropTable(
                name: "HangGhes");

            migrationBuilder.DropTable(
                name: "MayBays");

            migrationBuilder.DropTable(
                name: "SanBays");

            migrationBuilder.DropTable(
                name: "HangBays");
        }
    }
}
