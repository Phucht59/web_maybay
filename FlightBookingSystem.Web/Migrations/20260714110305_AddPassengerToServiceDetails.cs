using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightBookingSystem.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddPassengerToServiceDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaHanhKhach",
                table: "ChiTietDichVus",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChiTietDichVu_HanhKhach",
                table: "ChiTietDichVus",
                column: "MaHanhKhach");

            migrationBuilder.AddForeignKey(
                name: "FK_ChiTietDichVus_HanhKhachs_MaHanhKhach",
                table: "ChiTietDichVus",
                column: "MaHanhKhach",
                principalTable: "HanhKhachs",
                principalColumn: "MaHanhKhach",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChiTietDichVus_HanhKhachs_MaHanhKhach",
                table: "ChiTietDichVus");

            migrationBuilder.DropIndex(
                name: "IX_ChiTietDichVu_HanhKhach",
                table: "ChiTietDichVus");

            migrationBuilder.DropColumn(
                name: "MaHanhKhach",
                table: "ChiTietDichVus");
        }
    }
}
