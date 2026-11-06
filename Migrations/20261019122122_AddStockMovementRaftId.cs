using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Migrations
{
    /// <inheritdoc />
    public partial class AddStockMovementRaftId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RaftId",
                table: "StockMovements",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_RaftId",
                table: "StockMovements",
                column: "RaftId");

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_Rafts_RaftId",
                table: "StockMovements",
                column: "RaftId",
                principalTable: "Rafts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_Rafts_RaftId",
                table: "StockMovements");

            migrationBuilder.DropIndex(
                name: "IX_StockMovements_RaftId",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "RaftId",
                table: "StockMovements");
        }
    }
}
