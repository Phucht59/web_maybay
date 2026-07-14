using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightBookingSystem.Web.Migrations
{
    /// <inheritdoc />
    public partial class MakeTicketNumberOptionalBeforePayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Ves_SoVeDienTu",
                table: "Ves");

            migrationBuilder.AlterColumn<string>(
                name: "SoVeDienTu",
                table: "Ves",
                type: "TEXT",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 30);

            migrationBuilder.CreateIndex(
                name: "IX_Ves_SoVeDienTu",
                table: "Ves",
                column: "SoVeDienTu",
                unique: true,
                filter: "SoVeDienTu IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Ves_SoVeDienTu",
                table: "Ves");

            migrationBuilder.AlterColumn<string>(
                name: "SoVeDienTu",
                table: "Ves",
                type: "TEXT",
                maxLength: 30,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ves_SoVeDienTu",
                table: "Ves",
                column: "SoVeDienTu",
                unique: true);
        }
    }
}
