using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warehouse.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_AspNetUsers_UserId",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_Shippments_PackingLists_PackingListId",
                table: "Shippments");

            migrationBuilder.DropForeignKey(
                name: "FK_Shippments_Warehouses_WarehouseId",
                table: "Shippments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Shippments",
                table: "Shippments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Notifications",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications");

            migrationBuilder.RenameTable(
                name: "Shippments",
                newName: "Shipments");

            migrationBuilder.RenameTable(
                name: "Notifications",
                newName: "Notification");

            migrationBuilder.RenameColumn(
                name: "PackingListStatus",
                table: "PackingLists",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "ShipmentStatus",
                table: "Shipments",
                newName: "Status");

            migrationBuilder.RenameIndex(
                name: "IX_Shippments_WarehouseId",
                table: "Shipments",
                newName: "IX_Shipments_WarehouseId");

            migrationBuilder.RenameIndex(
                name: "IX_Shippments_PackingListId",
                table: "Shipments",
                newName: "IX_Shipments_PackingListId");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "Notification",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "Notification");

            migrationBuilder.AddColumn<string>(
                name: "Id",
                table: "Notification",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ApplicationUserId",
                table: "Notification",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Shipments",
                table: "Shipments",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Notification",
                table: "Notification",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Notification_ApplicationUserId",
                table: "Notification",
                column: "ApplicationUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notification_AspNetUsers_ApplicationUserId",
                table: "Notification",
                column: "ApplicationUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_PackingLists_PackingListId",
                table: "Shipments",
                column: "PackingListId",
                principalTable: "PackingLists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Warehouses_WarehouseId",
                table: "Shipments",
                column: "WarehouseId",
                principalTable: "Warehouses",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Notification_AspNetUsers_ApplicationUserId",
                table: "Notification");

            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_PackingLists_PackingListId",
                table: "Shipments");

            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Warehouses_WarehouseId",
                table: "Shipments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Shipments",
                table: "Shipments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Notification",
                table: "Notification");

            migrationBuilder.DropIndex(
                name: "IX_Notification_ApplicationUserId",
                table: "Notification");

            migrationBuilder.DropColumn(
                name: "ApplicationUserId",
                table: "Notification");

            migrationBuilder.RenameTable(
                name: "Shipments",
                newName: "Shippments");

            migrationBuilder.RenameTable(
                name: "Notification",
                newName: "Notifications");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "PackingLists",
                newName: "PackingListStatus");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Shippments",
                newName: "ShipmentStatus");

            migrationBuilder.RenameIndex(
                name: "IX_Shipments_WarehouseId",
                table: "Shippments",
                newName: "IX_Shippments_WarehouseId");

            migrationBuilder.RenameIndex(
                name: "IX_Shipments_PackingListId",
                table: "Shippments",
                newName: "IX_Shippments_PackingListId");

            migrationBuilder.AlterColumn<string>(
                name: "UserId",
                table: "Notifications",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "Notifications",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)")
                .Annotation("SqlServer:Identity", "1, 1");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Shippments",
                table: "Shippments",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Notifications",
                table: "Notifications",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_AspNetUsers_UserId",
                table: "Notifications",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Shippments_PackingLists_PackingListId",
                table: "Shippments",
                column: "PackingListId",
                principalTable: "PackingLists",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Shippments_Warehouses_WarehouseId",
                table: "Shippments",
                column: "WarehouseId",
                principalTable: "Warehouses",
                principalColumn: "Id");
        }
    }
}
