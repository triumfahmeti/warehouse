using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Migrations
{
    /// <inheritdoc />
    public partial class RemovePalletRaft_AddPalletItemRaft : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pallets_Rafts_RaftId",
                table: "Pallets");

            migrationBuilder.DropIndex(
                name: "IX_Pallets_RaftId",
                table: "Pallets");

            migrationBuilder.DropColumn(
                name: "RaftId",
                table: "Pallets");

            migrationBuilder.AddColumn<int>(
                name: "RaftId",
                table: "PalletItems",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PalletItems_RaftId",
                table: "PalletItems",
                column: "RaftId");

            migrationBuilder.AddForeignKey(
                name: "FK_PalletItems_Rafts_RaftId",
                table: "PalletItems",
                column: "RaftId",
                principalTable: "Rafts",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PalletItems_Rafts_RaftId",
                table: "PalletItems");

            migrationBuilder.DropIndex(
                name: "IX_PalletItems_RaftId",
                table: "PalletItems");

            migrationBuilder.DropColumn(
                name: "RaftId",
                table: "PalletItems");

            migrationBuilder.AddColumn<int>(
                name: "RaftId",
                table: "Pallets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Pallets_RaftId",
                table: "Pallets",
                column: "RaftId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pallets_Rafts_RaftId",
                table: "Pallets",
                column: "RaftId",
                principalTable: "Rafts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
