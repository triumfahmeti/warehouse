using System.Collections.Generic;
using System.Linq;

namespace Warehouse.Authorization.Constants
{
    // Katalogu qendror i lejeve. Çdo nën-klasë = një resurs; çdo const = një veprim
    // (Resource.Action). Lexime të shumta (GetAll/GetById/GetBy...) përmblidhen në "View".
    // GetAll() i mbledh të gjitha përmes reflektimit (përdoret nga DataSeeder).
    public class Permissions
    {
        // ---- Sales orders ----
        public static class SalesOrders
        {
            public const string View = "SalesOrders.View";        // GetAll
            public const string ViewOwn = "SalesOrders.ViewOwn";  // GetMine (Client)
            public const string Create = "SalesOrders.Create";
            public const string SetPrices = "SalesOrders.SetPrices";
            public const string Confirm = "SalesOrders.Confirm";
            public const string Cancel = "SalesOrders.Cancel";
        }

        // ---- Purchase orders ----
        public static class PurchaseOrders
        {
            public const string View = "PurchaseOrders.View";
            public const string Create = "PurchaseOrders.Create";
            public const string Receive = "PurchaseOrders.Receive";
            public const string Cancel = "PurchaseOrders.Cancel";
            public const string Close = "PurchaseOrders.Close";
        }

        // ---- Products ----
        public static class Products
        {
            public const string View = "Products.View";
            public const string Create = "Products.Create";
            public const string Edit = "Products.Edit";
            public const string Delete = "Products.Delete";
        }

        // ---- Inventory ----
        public static class Inventory
        {
            public const string View = "Inventory.View";
            public const string AddStock = "Inventory.AddStock";
            public const string RemoveStock = "Inventory.RemoveStock";
            public const string Reserve = "Inventory.Reserve";
            public const string ReleaseReserved = "Inventory.ReleaseReserved";
            public const string Transfer = "Inventory.Transfer";
            public const string Adjust = "Inventory.Adjust";
            public const string CycleCount = "Inventory.CycleCount";
            public const string ViewMovements = "Inventory.ViewMovements";
        }

        // ---- Warehouses ----
        public static class Warehouses
        {
            public const string View = "Warehouses.View";
            public const string Create = "Warehouses.Create";
            public const string Edit = "Warehouses.Edit";
            public const string Delete = "Warehouses.Delete";
        }

        // ---- Rafts ----
        public static class Rafts
        {
            public const string View = "Rafts.View";
            public const string Create = "Rafts.Create";
            public const string Edit = "Rafts.Edit";
            public const string Delete = "Rafts.Delete";
        }

        // ---- Suppliers ----
        public static class Suppliers
        {
            public const string View = "Suppliers.View";
            public const string Create = "Suppliers.Create";
            public const string Edit = "Suppliers.Edit";
            public const string Delete = "Suppliers.Delete";
        }

        // ---- Clients ----
        public static class Clients
        {
            public const string View = "Clients.View";
            public const string Create = "Clients.Create";
            public const string Edit = "Clients.Edit";
            public const string ViewOrders = "Clients.ViewOrders";
        }

        // ---- Pallets ----
        public static class Pallets
        {
            public const string View = "Pallets.View";
            public const string Create = "Pallets.Create";
            public const string Edit = "Pallets.Edit";
            public const string Delete = "Pallets.Delete";
            public const string CreateFromOrder = "Pallets.CreateFromOrder";
        }

        // ---- Pallet items ----
        public static class PalletItems
        {
            public const string View = "PalletItems.View";
            public const string Create = "PalletItems.Create";
            public const string Edit = "PalletItems.Edit";
            public const string Delete = "PalletItems.Delete";
        }

        // ---- Packing lists ----
        public static class PackingLists
        {
            public const string View = "PackingLists.View";
            public const string Create = "PackingLists.Create";
            public const string Edit = "PackingLists.Edit";
            public const string MarkReady = "PackingLists.MarkReady";
            public const string Cancel = "PackingLists.Cancel";
        }

        // ---- Shipments ----
        public static class Shipments
        {
            public const string View = "Shipments.View";
            public const string ViewOwn = "Shipments.ViewOwn"; // GetMine (Client)
            public const string Create = "Shipments.Create";
            public const string MarkReady = "Shipments.MarkReady";
            public const string Ship = "Shipments.Ship";
            public const string Deliver = "Shipments.Deliver";
            public const string Cancel = "Shipments.Cancel";
        }

        // ---- Users ----
        public static class Users
        {
            public const string View = "Users.View";
            public const string Create = "Users.Create";
            public const string Edit = "Users.Edit";
            public const string Activate = "Users.Activate";
            public const string Deactivate = "Users.Deactivate";
            public const string ManageRoles = "Users.ManageRoles";
        }

        // ---- Roles & permissions ----
        public static class Roles
        {
            public const string View = "Roles.View";
            public const string ManagePermissions = "Roles.ManagePermissions";
        }

        // ---- Audit logs ----
        public static class AuditLogs
        {
            public const string View = "AuditLogs.View";
            public const string Create = "AuditLogs.Create";
            public const string Edit = "AuditLogs.Edit";
            public const string Delete = "AuditLogs.Delete";
        }

        // ---- System settings ----
        public static class Settings
        {
            public const string View = "Settings.View";
            public const string Create = "Settings.Create";
            public const string Edit = "Settings.Edit";
            public const string Delete = "Settings.Delete";
        }

        // ---- Files ----
        public static class Files
        {
            public const string View = "Files.View";
            public const string Create = "Files.Create";
            public const string Edit = "Files.Edit";
            public const string Delete = "Files.Delete";
        }

        // ---- Notifications ----
        public static class Notifications
        {
            public const string View = "Notifications.View";
            public const string Create = "Notifications.Create";
            public const string Edit = "Notifications.Edit";
            public const string MarkAsRead = "Notifications.MarkAsRead";
            public const string Delete = "Notifications.Delete";
        }

        // ---- Reports ----
        public static class Reports
        {
            public const string ViewInventory = "Reports.ViewInventory";
            public const string ViewSales = "Reports.ViewSales";
            public const string ViewShipment = "Reports.ViewShipment";
        }

        // ---- Export / Import ----
        public static class ExportImport
        {
            public const string Export = "ExportImport.Export";
            public const string Import = "ExportImport.Import";
        }

        // ---- Admin dashboard ----
        public static class Dashboard
        {
            public const string View = "Dashboard.View";
        }

        public static IEnumerable<string> GetAll()
        {
            return typeof(Permissions).GetNestedTypes()
                .SelectMany(t => t.GetFields())
                .Where(f => f.IsLiteral && f.FieldType == typeof(string))
                .Select(f => (string)f.GetRawConstantValue()!);
        }
    }
}
