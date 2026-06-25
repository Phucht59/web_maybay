using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightBookingSystem.Web.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeBookingSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChiTietDichVus_DichVuThems_DichVuThemMaDichVu",
                table: "ChiTietDichVus");

            migrationBuilder.DropForeignKey(
                name: "FK_ChiTietDichVus_Ves_VeMaVe",
                table: "ChiTietDichVus");

            migrationBuilder.DropForeignKey(
                name: "FK_ChuyenBays_LoTrinhs_LoTrinhMaLoTrinh",
                table: "ChuyenBays");

            migrationBuilder.DropForeignKey(
                name: "FK_ChuyenBays_MayBays_MayBayMaMayBay",
                table: "ChuyenBays");

            migrationBuilder.DropForeignKey(
                name: "FK_GheChuyenBays_ChuyenBays_ChuyenBayMaChuyenBay",
                table: "GheChuyenBays");

            migrationBuilder.DropForeignKey(
                name: "FK_GheChuyenBays_GheMayBays_GheMayBayMaGheMayBay",
                table: "GheChuyenBays");

            migrationBuilder.DropForeignKey(
                name: "FK_GheMayBays_HangGhes_HangGheMaHangGhe",
                table: "GheMayBays");

            migrationBuilder.DropForeignKey(
                name: "FK_GheMayBays_MayBays_MayBayMaMayBay",
                table: "GheMayBays");

            migrationBuilder.DropForeignKey(
                name: "FK_MayBays_HangBays_HangBayMaHangBay",
                table: "MayBays");

            migrationBuilder.DropForeignKey(
                name: "FK_PhieuDatChos_TaiKhoans_TaiKhoanMaTaiKhoan",
                table: "PhieuDatChos");

            migrationBuilder.DropForeignKey(
                name: "FK_ThanhToans_PhieuDatChos_PhieuDatChoMaPhieuDatCho",
                table: "ThanhToans");

            migrationBuilder.DropForeignKey(
                name: "FK_Ves_GheChuyenBays_GheChuyenBayMaGheChuyenBay",
                table: "Ves");

            migrationBuilder.DropForeignKey(
                name: "FK_Ves_HanhKhachs_HanhKhachMaHanhKhach",
                table: "Ves");

            migrationBuilder.DropForeignKey(
                name: "FK_Ves_PhieuDatChos_PhieuDatChoMaPhieuDatCho",
                table: "Ves");

            migrationBuilder.DropIndex(
                name: "IX_Ves_GheChuyenBayMaGheChuyenBay",
                table: "Ves");

            migrationBuilder.DropIndex(
                name: "IX_Ves_HanhKhachMaHanhKhach",
                table: "Ves");

            migrationBuilder.DropIndex(
                name: "IX_Ves_PhieuDatChoMaPhieuDatCho",
                table: "Ves");

            migrationBuilder.DropIndex(
                name: "IX_ThanhToans_PhieuDatChoMaPhieuDatCho",
                table: "ThanhToans");

            migrationBuilder.DropIndex(
                name: "IX_PhieuDatChos_TaiKhoanMaTaiKhoan",
                table: "PhieuDatChos");

            migrationBuilder.DropIndex(
                name: "IX_MayBays_HangBayMaHangBay",
                table: "MayBays");

            migrationBuilder.DropIndex(
                name: "IX_GheMayBays_HangGheMaHangGhe",
                table: "GheMayBays");

            migrationBuilder.DropIndex(
                name: "IX_GheMayBays_MayBayMaMayBay",
                table: "GheMayBays");

            migrationBuilder.DropIndex(
                name: "IX_ChuyenBays_LoTrinhMaLoTrinh",
                table: "ChuyenBays");

            migrationBuilder.DropIndex(
                name: "IX_ChuyenBays_MayBayMaMayBay",
                table: "ChuyenBays");

            migrationBuilder.DropIndex(
                name: "IX_ChiTietDichVus_DichVuThemMaDichVu",
                table: "ChiTietDichVus");

            migrationBuilder.DropIndex(
                name: "IX_ChiTietDichVus_MaVe_MaDichVu",
                table: "ChiTietDichVus");

            migrationBuilder.DropIndex(
                name: "IX_ChiTietDichVus_VeMaVe",
                table: "ChiTietDichVus");

            migrationBuilder.DropColumn(
                name: "GheChuyenBayMaGheChuyenBay",
                table: "Ves");

            migrationBuilder.DropColumn(
                name: "HanhKhachMaHanhKhach",
                table: "Ves");

            migrationBuilder.DropColumn(
                name: "PhieuDatChoMaPhieuDatCho",
                table: "Ves");

            migrationBuilder.DropColumn(
                name: "PhieuDatChoMaPhieuDatCho",
                table: "ThanhToans");

            migrationBuilder.DropColumn(
                name: "TaiKhoanMaTaiKhoan",
                table: "PhieuDatChos");

            migrationBuilder.DropColumn(
                name: "HangBayMaHangBay",
                table: "MayBays");

            migrationBuilder.DropColumn(
                name: "SoCCCD",
                table: "HanhKhachs");

            migrationBuilder.DropColumn(
                name: "HangGheMaHangGhe",
                table: "GheMayBays");

            migrationBuilder.DropColumn(
                name: "MayBayMaMayBay",
                table: "GheMayBays");

            migrationBuilder.DropColumn(
                name: "LoTrinhMaLoTrinh",
                table: "ChuyenBays");

            migrationBuilder.DropColumn(
                name: "MayBayMaMayBay",
                table: "ChuyenBays");

            migrationBuilder.DropColumn(
                name: "DichVuThemMaDichVu",
                table: "ChiTietDichVus");

            migrationBuilder.DropColumn(
                name: "VeMaVe",
                table: "ChiTietDichVus");

            migrationBuilder.RenameColumn(
                name: "ThoiGianHetHan",
                table: "PhieuDatChos",
                newName: "NgayTao");

            migrationBuilder.RenameColumn(
                name: "SoHoChieu",
                table: "HanhKhachs",
                newName: "NgayHetHanGiayTo");

            migrationBuilder.RenameColumn(
                name: "GheMayBayMaGheMayBay",
                table: "GheChuyenBays",
                newName: "MaPhieuDatChoDangGiu");

            migrationBuilder.RenameColumn(
                name: "ChuyenBayMaChuyenBay",
                table: "GheChuyenBays",
                newName: "GiuBoiTaiKhoanId");

            migrationBuilder.RenameIndex(
                name: "IX_GheChuyenBays_GheMayBayMaGheMayBay",
                table: "GheChuyenBays",
                newName: "IX_GheChuyenBays_MaPhieuDatChoDangGiu");

            migrationBuilder.RenameIndex(
                name: "IX_GheChuyenBays_ChuyenBayMaChuyenBay",
                table: "GheChuyenBays",
                newName: "IX_GheChuyenBays_GiuBoiTaiKhoanId");

            migrationBuilder.AddColumn<int>(
                name: "MaChangDatCho",
                table: "Ves",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayTao",
                table: "Ves",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayXuatVe",
                table: "Ves",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SoVeDienTu",
                table: "Ves",
                type: "TEXT",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IdempotencyKey",
                table: "ThanhToans",
                type: "TEXT",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayTao",
                table: "ThanhToans",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<int>(
                name: "MaTaiKhoan",
                table: "PhieuDatChos",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddColumn<DateTime>(
                name: "GiuDenLuc",
                table: "PhieuDatChos",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LoaiChuyenDi",
                table: "PhieuDatChos",
                type: "TEXT",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "MaDatCho",
                table: "PhieuDatChos",
                type: "TEXT",
                maxLength: 12,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "NgayCapNhat",
                table: "PhieuDatChos",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "SoLuongHanhKhach",
                table: "PhieuDatChos",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "LoaiDuongBay",
                table: "LoTrinhs",
                type: "TEXT",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LoaiGiayTo",
                table: "HanhKhachs",
                type: "TEXT",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LoaiHanhKhach",
                table: "HanhKhachs",
                type: "TEXT",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MaPhieuDatCho",
                table: "HanhKhachs",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SoGiayTo",
                table: "HanhKhachs",
                type: "TEXT",
                maxLength: 40,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "GiuDenLuc",
                table: "GheChuyenBays",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SessionId",
                table: "GheChuyenBays",
                type: "TEXT",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "GheChuyenBays",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<int>(
                name: "KhoiLuongKg",
                table: "DichVuThems",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddColumn<string>(
                name: "LoaiDichVu",
                table: "DichVuThems",
                type: "TEXT",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TenDichVu",
                table: "DichVuThems",
                type: "TEXT",
                maxLength: 120,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SoHieuChuyenBay",
                table: "ChuyenBays",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "MaVe",
                table: "ChiTietDichVus",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddColumn<int>(
                name: "MaPhieuDatCho",
                table: "ChiTietDichVus",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ChangDatChos",
                columns: table => new
                {
                    MaChangDatCho = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaPhieuDatCho = table.Column<int>(type: "INTEGER", nullable: false),
                    MaChuyenBay = table.Column<int>(type: "INTEGER", nullable: false),
                    LoaiChang = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    ThuTuChang = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChangDatChos", x => x.MaChangDatCho);
                    table.ForeignKey(
                        name: "FK_ChangDatChos_ChuyenBays_MaChuyenBay",
                        column: x => x.MaChuyenBay,
                        principalTable: "ChuyenBays",
                        principalColumn: "MaChuyenBay",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChangDatChos_PhieuDatChos_MaPhieuDatCho",
                        column: x => x.MaPhieuDatCho,
                        principalTable: "PhieuDatChos",
                        principalColumn: "MaPhieuDatCho",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HoanTiens",
                columns: table => new
                {
                    MaHoanTien = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MaThanhToan = table.Column<int>(type: "INTEGER", nullable: false),
                    MaPhieuDatCho = table.Column<int>(type: "INTEGER", nullable: false),
                    SoTienHoan = table.Column<decimal>(type: "TEXT", nullable: false),
                    LyDo = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    TrangThai = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    MaGiaoDichHoanTien = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    NgayTao = table.Column<DateTime>(type: "TEXT", nullable: false),
                    NgayHoanTien = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HoanTiens", x => x.MaHoanTien);
                    table.ForeignKey(
                        name: "FK_HoanTiens_PhieuDatChos_MaPhieuDatCho",
                        column: x => x.MaPhieuDatCho,
                        principalTable: "PhieuDatChos",
                        principalColumn: "MaPhieuDatCho",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_HoanTiens_ThanhToans_MaThanhToan",
                        column: x => x.MaThanhToan,
                        principalTable: "ThanhToans",
                        principalColumn: "MaThanhToan",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Ves_MaChangDatCho_MaHanhKhach",
                table: "Ves",
                columns: new[] { "MaChangDatCho", "MaHanhKhach" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ves_MaHanhKhach",
                table: "Ves",
                column: "MaHanhKhach");

            migrationBuilder.CreateIndex(
                name: "IX_Ves_SoVeDienTu",
                table: "Ves",
                column: "SoVeDienTu",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ThanhToans_IdempotencyKey",
                table: "ThanhToans",
                column: "IdempotencyKey",
                unique: true,
                filter: "IdempotencyKey IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ThanhToans_MaGiaoDich",
                table: "ThanhToans",
                column: "MaGiaoDich",
                unique: true,
                filter: "MaGiaoDich IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PhieuDatCho_HetHan",
                table: "PhieuDatChos",
                columns: new[] { "TrangThai", "GiuDenLuc" });

            migrationBuilder.CreateIndex(
                name: "IX_PhieuDatChos_MaDatCho",
                table: "PhieuDatChos",
                column: "MaDatCho",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MayBays_MaHangBay",
                table: "MayBays",
                column: "MaHangBay");

            migrationBuilder.CreateIndex(
                name: "IX_HanhKhachs_MaPhieuDatCho_SoGiayTo",
                table: "HanhKhachs",
                columns: new[] { "MaPhieuDatCho", "SoGiayTo" });

            migrationBuilder.CreateIndex(
                name: "IX_GheMayBays_MaHangGhe",
                table: "GheMayBays",
                column: "MaHangGhe");

            migrationBuilder.CreateIndex(
                name: "IX_GheChuyenBay_Realtime",
                table: "GheChuyenBays",
                columns: new[] { "MaChuyenBay", "TrangThaiGhe", "GiuDenLuc" });

            migrationBuilder.CreateIndex(
                name: "IX_GheChuyenBays_MaGheMayBay",
                table: "GheChuyenBays",
                column: "MaGheMayBay");

            migrationBuilder.CreateIndex(
                name: "IX_DichVuThems_LoaiDichVu_TrangThai",
                table: "DichVuThems",
                columns: new[] { "LoaiDichVu", "TrangThai" });

            migrationBuilder.CreateIndex(
                name: "IX_ChuyenBays_MaMayBay",
                table: "ChuyenBays",
                column: "MaMayBay");

            migrationBuilder.CreateIndex(
                name: "IX_ChuyenBays_SoHieuChuyenBay_GioKhoiHanh",
                table: "ChuyenBays",
                columns: new[] { "SoHieuChuyenBay", "GioKhoiHanh" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChiTietDichVus_MaDichVu",
                table: "ChiTietDichVus",
                column: "MaDichVu");

            migrationBuilder.CreateIndex(
                name: "IX_ChiTietDichVus_MaPhieuDatCho_MaVe_MaDichVu",
                table: "ChiTietDichVus",
                columns: new[] { "MaPhieuDatCho", "MaVe", "MaDichVu" });

            migrationBuilder.CreateIndex(
                name: "IX_ChiTietDichVus_MaVe",
                table: "ChiTietDichVus",
                column: "MaVe");

            migrationBuilder.CreateIndex(
                name: "IX_ChangDatChos_MaChuyenBay_LoaiChang",
                table: "ChangDatChos",
                columns: new[] { "MaChuyenBay", "LoaiChang" });

            migrationBuilder.CreateIndex(
                name: "IX_ChangDatChos_MaPhieuDatCho_ThuTuChang",
                table: "ChangDatChos",
                columns: new[] { "MaPhieuDatCho", "ThuTuChang" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HoanTiens_MaGiaoDichHoanTien",
                table: "HoanTiens",
                column: "MaGiaoDichHoanTien",
                unique: true,
                filter: "MaGiaoDichHoanTien IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_HoanTiens_MaPhieuDatCho",
                table: "HoanTiens",
                column: "MaPhieuDatCho");

            migrationBuilder.CreateIndex(
                name: "IX_HoanTiens_MaThanhToan",
                table: "HoanTiens",
                column: "MaThanhToan");

            migrationBuilder.AddForeignKey(
                name: "FK_ChiTietDichVus_DichVuThems_MaDichVu",
                table: "ChiTietDichVus",
                column: "MaDichVu",
                principalTable: "DichVuThems",
                principalColumn: "MaDichVu",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ChiTietDichVus_PhieuDatChos_MaPhieuDatCho",
                table: "ChiTietDichVus",
                column: "MaPhieuDatCho",
                principalTable: "PhieuDatChos",
                principalColumn: "MaPhieuDatCho",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChiTietDichVus_Ves_MaVe",
                table: "ChiTietDichVus",
                column: "MaVe",
                principalTable: "Ves",
                principalColumn: "MaVe",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ChuyenBays_LoTrinhs_MaLoTrinh",
                table: "ChuyenBays",
                column: "MaLoTrinh",
                principalTable: "LoTrinhs",
                principalColumn: "MaLoTrinh",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ChuyenBays_MayBays_MaMayBay",
                table: "ChuyenBays",
                column: "MaMayBay",
                principalTable: "MayBays",
                principalColumn: "MaMayBay",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GheChuyenBays_ChuyenBays_MaChuyenBay",
                table: "GheChuyenBays",
                column: "MaChuyenBay",
                principalTable: "ChuyenBays",
                principalColumn: "MaChuyenBay",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GheChuyenBays_GheMayBays_MaGheMayBay",
                table: "GheChuyenBays",
                column: "MaGheMayBay",
                principalTable: "GheMayBays",
                principalColumn: "MaGheMayBay",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GheChuyenBays_PhieuDatChos_MaPhieuDatChoDangGiu",
                table: "GheChuyenBays",
                column: "MaPhieuDatChoDangGiu",
                principalTable: "PhieuDatChos",
                principalColumn: "MaPhieuDatCho",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_GheChuyenBays_TaiKhoans_GiuBoiTaiKhoanId",
                table: "GheChuyenBays",
                column: "GiuBoiTaiKhoanId",
                principalTable: "TaiKhoans",
                principalColumn: "MaTaiKhoan",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_GheMayBays_HangGhes_MaHangGhe",
                table: "GheMayBays",
                column: "MaHangGhe",
                principalTable: "HangGhes",
                principalColumn: "MaHangGhe",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_GheMayBays_MayBays_MaMayBay",
                table: "GheMayBays",
                column: "MaMayBay",
                principalTable: "MayBays",
                principalColumn: "MaMayBay",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_HanhKhachs_PhieuDatChos_MaPhieuDatCho",
                table: "HanhKhachs",
                column: "MaPhieuDatCho",
                principalTable: "PhieuDatChos",
                principalColumn: "MaPhieuDatCho",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MayBays_HangBays_MaHangBay",
                table: "MayBays",
                column: "MaHangBay",
                principalTable: "HangBays",
                principalColumn: "MaHangBay",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PhieuDatChos_TaiKhoans_MaTaiKhoan",
                table: "PhieuDatChos",
                column: "MaTaiKhoan",
                principalTable: "TaiKhoans",
                principalColumn: "MaTaiKhoan",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ThanhToans_PhieuDatChos_MaPhieuDatCho",
                table: "ThanhToans",
                column: "MaPhieuDatCho",
                principalTable: "PhieuDatChos",
                principalColumn: "MaPhieuDatCho",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Ves_ChangDatChos_MaChangDatCho",
                table: "Ves",
                column: "MaChangDatCho",
                principalTable: "ChangDatChos",
                principalColumn: "MaChangDatCho",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Ves_GheChuyenBays_MaGheChuyenBay",
                table: "Ves",
                column: "MaGheChuyenBay",
                principalTable: "GheChuyenBays",
                principalColumn: "MaGheChuyenBay",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Ves_HanhKhachs_MaHanhKhach",
                table: "Ves",
                column: "MaHanhKhach",
                principalTable: "HanhKhachs",
                principalColumn: "MaHanhKhach",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Ves_PhieuDatChos_MaPhieuDatCho",
                table: "Ves",
                column: "MaPhieuDatCho",
                principalTable: "PhieuDatChos",
                principalColumn: "MaPhieuDatCho",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChiTietDichVus_DichVuThems_MaDichVu",
                table: "ChiTietDichVus");

            migrationBuilder.DropForeignKey(
                name: "FK_ChiTietDichVus_PhieuDatChos_MaPhieuDatCho",
                table: "ChiTietDichVus");

            migrationBuilder.DropForeignKey(
                name: "FK_ChiTietDichVus_Ves_MaVe",
                table: "ChiTietDichVus");

            migrationBuilder.DropForeignKey(
                name: "FK_ChuyenBays_LoTrinhs_MaLoTrinh",
                table: "ChuyenBays");

            migrationBuilder.DropForeignKey(
                name: "FK_ChuyenBays_MayBays_MaMayBay",
                table: "ChuyenBays");

            migrationBuilder.DropForeignKey(
                name: "FK_GheChuyenBays_ChuyenBays_MaChuyenBay",
                table: "GheChuyenBays");

            migrationBuilder.DropForeignKey(
                name: "FK_GheChuyenBays_GheMayBays_MaGheMayBay",
                table: "GheChuyenBays");

            migrationBuilder.DropForeignKey(
                name: "FK_GheChuyenBays_PhieuDatChos_MaPhieuDatChoDangGiu",
                table: "GheChuyenBays");

            migrationBuilder.DropForeignKey(
                name: "FK_GheChuyenBays_TaiKhoans_GiuBoiTaiKhoanId",
                table: "GheChuyenBays");

            migrationBuilder.DropForeignKey(
                name: "FK_GheMayBays_HangGhes_MaHangGhe",
                table: "GheMayBays");

            migrationBuilder.DropForeignKey(
                name: "FK_GheMayBays_MayBays_MaMayBay",
                table: "GheMayBays");

            migrationBuilder.DropForeignKey(
                name: "FK_HanhKhachs_PhieuDatChos_MaPhieuDatCho",
                table: "HanhKhachs");

            migrationBuilder.DropForeignKey(
                name: "FK_MayBays_HangBays_MaHangBay",
                table: "MayBays");

            migrationBuilder.DropForeignKey(
                name: "FK_PhieuDatChos_TaiKhoans_MaTaiKhoan",
                table: "PhieuDatChos");

            migrationBuilder.DropForeignKey(
                name: "FK_ThanhToans_PhieuDatChos_MaPhieuDatCho",
                table: "ThanhToans");

            migrationBuilder.DropForeignKey(
                name: "FK_Ves_ChangDatChos_MaChangDatCho",
                table: "Ves");

            migrationBuilder.DropForeignKey(
                name: "FK_Ves_GheChuyenBays_MaGheChuyenBay",
                table: "Ves");

            migrationBuilder.DropForeignKey(
                name: "FK_Ves_HanhKhachs_MaHanhKhach",
                table: "Ves");

            migrationBuilder.DropForeignKey(
                name: "FK_Ves_PhieuDatChos_MaPhieuDatCho",
                table: "Ves");

            migrationBuilder.DropTable(
                name: "ChangDatChos");

            migrationBuilder.DropTable(
                name: "HoanTiens");

            migrationBuilder.DropIndex(
                name: "IX_Ves_MaChangDatCho_MaHanhKhach",
                table: "Ves");

            migrationBuilder.DropIndex(
                name: "IX_Ves_MaHanhKhach",
                table: "Ves");

            migrationBuilder.DropIndex(
                name: "IX_Ves_SoVeDienTu",
                table: "Ves");

            migrationBuilder.DropIndex(
                name: "IX_ThanhToans_IdempotencyKey",
                table: "ThanhToans");

            migrationBuilder.DropIndex(
                name: "IX_ThanhToans_MaGiaoDich",
                table: "ThanhToans");

            migrationBuilder.DropIndex(
                name: "IX_PhieuDatCho_HetHan",
                table: "PhieuDatChos");

            migrationBuilder.DropIndex(
                name: "IX_PhieuDatChos_MaDatCho",
                table: "PhieuDatChos");

            migrationBuilder.DropIndex(
                name: "IX_MayBays_MaHangBay",
                table: "MayBays");

            migrationBuilder.DropIndex(
                name: "IX_HanhKhachs_MaPhieuDatCho_SoGiayTo",
                table: "HanhKhachs");

            migrationBuilder.DropIndex(
                name: "IX_GheMayBays_MaHangGhe",
                table: "GheMayBays");

            migrationBuilder.DropIndex(
                name: "IX_GheChuyenBay_Realtime",
                table: "GheChuyenBays");

            migrationBuilder.DropIndex(
                name: "IX_GheChuyenBays_MaGheMayBay",
                table: "GheChuyenBays");

            migrationBuilder.DropIndex(
                name: "IX_DichVuThems_LoaiDichVu_TrangThai",
                table: "DichVuThems");

            migrationBuilder.DropIndex(
                name: "IX_ChuyenBays_MaMayBay",
                table: "ChuyenBays");

            migrationBuilder.DropIndex(
                name: "IX_ChuyenBays_SoHieuChuyenBay_GioKhoiHanh",
                table: "ChuyenBays");

            migrationBuilder.DropIndex(
                name: "IX_ChiTietDichVus_MaDichVu",
                table: "ChiTietDichVus");

            migrationBuilder.DropIndex(
                name: "IX_ChiTietDichVus_MaPhieuDatCho_MaVe_MaDichVu",
                table: "ChiTietDichVus");

            migrationBuilder.DropIndex(
                name: "IX_ChiTietDichVus_MaVe",
                table: "ChiTietDichVus");

            migrationBuilder.DropColumn(
                name: "MaChangDatCho",
                table: "Ves");

            migrationBuilder.DropColumn(
                name: "NgayTao",
                table: "Ves");

            migrationBuilder.DropColumn(
                name: "NgayXuatVe",
                table: "Ves");

            migrationBuilder.DropColumn(
                name: "SoVeDienTu",
                table: "Ves");

            migrationBuilder.DropColumn(
                name: "IdempotencyKey",
                table: "ThanhToans");

            migrationBuilder.DropColumn(
                name: "NgayTao",
                table: "ThanhToans");

            migrationBuilder.DropColumn(
                name: "GiuDenLuc",
                table: "PhieuDatChos");

            migrationBuilder.DropColumn(
                name: "LoaiChuyenDi",
                table: "PhieuDatChos");

            migrationBuilder.DropColumn(
                name: "MaDatCho",
                table: "PhieuDatChos");

            migrationBuilder.DropColumn(
                name: "NgayCapNhat",
                table: "PhieuDatChos");

            migrationBuilder.DropColumn(
                name: "SoLuongHanhKhach",
                table: "PhieuDatChos");

            migrationBuilder.DropColumn(
                name: "LoaiDuongBay",
                table: "LoTrinhs");

            migrationBuilder.DropColumn(
                name: "LoaiGiayTo",
                table: "HanhKhachs");

            migrationBuilder.DropColumn(
                name: "LoaiHanhKhach",
                table: "HanhKhachs");

            migrationBuilder.DropColumn(
                name: "MaPhieuDatCho",
                table: "HanhKhachs");

            migrationBuilder.DropColumn(
                name: "SoGiayTo",
                table: "HanhKhachs");

            migrationBuilder.DropColumn(
                name: "GiuDenLuc",
                table: "GheChuyenBays");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "GheChuyenBays");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "GheChuyenBays");

            migrationBuilder.DropColumn(
                name: "LoaiDichVu",
                table: "DichVuThems");

            migrationBuilder.DropColumn(
                name: "TenDichVu",
                table: "DichVuThems");

            migrationBuilder.DropColumn(
                name: "SoHieuChuyenBay",
                table: "ChuyenBays");

            migrationBuilder.DropColumn(
                name: "MaPhieuDatCho",
                table: "ChiTietDichVus");

            migrationBuilder.RenameColumn(
                name: "NgayTao",
                table: "PhieuDatChos",
                newName: "ThoiGianHetHan");

            migrationBuilder.RenameColumn(
                name: "NgayHetHanGiayTo",
                table: "HanhKhachs",
                newName: "SoHoChieu");

            migrationBuilder.RenameColumn(
                name: "MaPhieuDatChoDangGiu",
                table: "GheChuyenBays",
                newName: "GheMayBayMaGheMayBay");

            migrationBuilder.RenameColumn(
                name: "GiuBoiTaiKhoanId",
                table: "GheChuyenBays",
                newName: "ChuyenBayMaChuyenBay");

            migrationBuilder.RenameIndex(
                name: "IX_GheChuyenBays_MaPhieuDatChoDangGiu",
                table: "GheChuyenBays",
                newName: "IX_GheChuyenBays_GheMayBayMaGheMayBay");

            migrationBuilder.RenameIndex(
                name: "IX_GheChuyenBays_GiuBoiTaiKhoanId",
                table: "GheChuyenBays",
                newName: "IX_GheChuyenBays_ChuyenBayMaChuyenBay");

            migrationBuilder.AddColumn<int>(
                name: "GheChuyenBayMaGheChuyenBay",
                table: "Ves",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HanhKhachMaHanhKhach",
                table: "Ves",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PhieuDatChoMaPhieuDatCho",
                table: "Ves",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PhieuDatChoMaPhieuDatCho",
                table: "ThanhToans",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "MaTaiKhoan",
                table: "PhieuDatChos",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TaiKhoanMaTaiKhoan",
                table: "PhieuDatChos",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HangBayMaHangBay",
                table: "MayBays",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SoCCCD",
                table: "HanhKhachs",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HangGheMaHangGhe",
                table: "GheMayBays",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MayBayMaMayBay",
                table: "GheMayBays",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "KhoiLuongKg",
                table: "DichVuThems",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LoTrinhMaLoTrinh",
                table: "ChuyenBays",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MayBayMaMayBay",
                table: "ChuyenBays",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "MaVe",
                table: "ChiTietDichVus",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DichVuThemMaDichVu",
                table: "ChiTietDichVus",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VeMaVe",
                table: "ChiTietDichVus",
                type: "INTEGER",
                nullable: true);

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
                name: "IX_ThanhToans_PhieuDatChoMaPhieuDatCho",
                table: "ThanhToans",
                column: "PhieuDatChoMaPhieuDatCho");

            migrationBuilder.CreateIndex(
                name: "IX_PhieuDatChos_TaiKhoanMaTaiKhoan",
                table: "PhieuDatChos",
                column: "TaiKhoanMaTaiKhoan");

            migrationBuilder.CreateIndex(
                name: "IX_MayBays_HangBayMaHangBay",
                table: "MayBays",
                column: "HangBayMaHangBay");

            migrationBuilder.CreateIndex(
                name: "IX_GheMayBays_HangGheMaHangGhe",
                table: "GheMayBays",
                column: "HangGheMaHangGhe");

            migrationBuilder.CreateIndex(
                name: "IX_GheMayBays_MayBayMaMayBay",
                table: "GheMayBays",
                column: "MayBayMaMayBay");

            migrationBuilder.CreateIndex(
                name: "IX_ChuyenBays_LoTrinhMaLoTrinh",
                table: "ChuyenBays",
                column: "LoTrinhMaLoTrinh");

            migrationBuilder.CreateIndex(
                name: "IX_ChuyenBays_MayBayMaMayBay",
                table: "ChuyenBays",
                column: "MayBayMaMayBay");

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

            migrationBuilder.AddForeignKey(
                name: "FK_ChiTietDichVus_DichVuThems_DichVuThemMaDichVu",
                table: "ChiTietDichVus",
                column: "DichVuThemMaDichVu",
                principalTable: "DichVuThems",
                principalColumn: "MaDichVu");

            migrationBuilder.AddForeignKey(
                name: "FK_ChiTietDichVus_Ves_VeMaVe",
                table: "ChiTietDichVus",
                column: "VeMaVe",
                principalTable: "Ves",
                principalColumn: "MaVe");

            migrationBuilder.AddForeignKey(
                name: "FK_ChuyenBays_LoTrinhs_LoTrinhMaLoTrinh",
                table: "ChuyenBays",
                column: "LoTrinhMaLoTrinh",
                principalTable: "LoTrinhs",
                principalColumn: "MaLoTrinh");

            migrationBuilder.AddForeignKey(
                name: "FK_ChuyenBays_MayBays_MayBayMaMayBay",
                table: "ChuyenBays",
                column: "MayBayMaMayBay",
                principalTable: "MayBays",
                principalColumn: "MaMayBay");

            migrationBuilder.AddForeignKey(
                name: "FK_GheChuyenBays_ChuyenBays_ChuyenBayMaChuyenBay",
                table: "GheChuyenBays",
                column: "ChuyenBayMaChuyenBay",
                principalTable: "ChuyenBays",
                principalColumn: "MaChuyenBay");

            migrationBuilder.AddForeignKey(
                name: "FK_GheChuyenBays_GheMayBays_GheMayBayMaGheMayBay",
                table: "GheChuyenBays",
                column: "GheMayBayMaGheMayBay",
                principalTable: "GheMayBays",
                principalColumn: "MaGheMayBay");

            migrationBuilder.AddForeignKey(
                name: "FK_GheMayBays_HangGhes_HangGheMaHangGhe",
                table: "GheMayBays",
                column: "HangGheMaHangGhe",
                principalTable: "HangGhes",
                principalColumn: "MaHangGhe");

            migrationBuilder.AddForeignKey(
                name: "FK_GheMayBays_MayBays_MayBayMaMayBay",
                table: "GheMayBays",
                column: "MayBayMaMayBay",
                principalTable: "MayBays",
                principalColumn: "MaMayBay");

            migrationBuilder.AddForeignKey(
                name: "FK_MayBays_HangBays_HangBayMaHangBay",
                table: "MayBays",
                column: "HangBayMaHangBay",
                principalTable: "HangBays",
                principalColumn: "MaHangBay");

            migrationBuilder.AddForeignKey(
                name: "FK_PhieuDatChos_TaiKhoans_TaiKhoanMaTaiKhoan",
                table: "PhieuDatChos",
                column: "TaiKhoanMaTaiKhoan",
                principalTable: "TaiKhoans",
                principalColumn: "MaTaiKhoan");

            migrationBuilder.AddForeignKey(
                name: "FK_ThanhToans_PhieuDatChos_PhieuDatChoMaPhieuDatCho",
                table: "ThanhToans",
                column: "PhieuDatChoMaPhieuDatCho",
                principalTable: "PhieuDatChos",
                principalColumn: "MaPhieuDatCho");

            migrationBuilder.AddForeignKey(
                name: "FK_Ves_GheChuyenBays_GheChuyenBayMaGheChuyenBay",
                table: "Ves",
                column: "GheChuyenBayMaGheChuyenBay",
                principalTable: "GheChuyenBays",
                principalColumn: "MaGheChuyenBay");

            migrationBuilder.AddForeignKey(
                name: "FK_Ves_HanhKhachs_HanhKhachMaHanhKhach",
                table: "Ves",
                column: "HanhKhachMaHanhKhach",
                principalTable: "HanhKhachs",
                principalColumn: "MaHanhKhach");

            migrationBuilder.AddForeignKey(
                name: "FK_Ves_PhieuDatChos_PhieuDatChoMaPhieuDatCho",
                table: "Ves",
                column: "PhieuDatChoMaPhieuDatCho",
                principalTable: "PhieuDatChos",
                principalColumn: "MaPhieuDatCho");
        }
    }
}
