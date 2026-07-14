using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightBookingSystem.Web.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingContactSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmailLienHe",
                table: "PhieuDatChos",
                type: "TEXT",
                maxLength: 254,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HoTenLienHe",
                table: "PhieuDatChos",
                type: "TEXT",
                maxLength: 160,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SoDienThoaiLienHe",
                table: "PhieuDatChos",
                type: "TEXT",
                maxLength: 40,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmailLienHe",
                table: "PhieuDatChos");

            migrationBuilder.DropColumn(
                name: "HoTenLienHe",
                table: "PhieuDatChos");

            migrationBuilder.DropColumn(
                name: "SoDienThoaiLienHe",
                table: "PhieuDatChos");
        }
    }
}
