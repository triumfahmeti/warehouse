using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Warehouse.Authorization.Constants;
using Warehouse.Models;

namespace Warehouse.Data
{
    public class DataSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            var db = services.GetRequiredService<AppDbContext>();
            var roleMgr = services.GetRequiredService<RoleManager<ApplicationRole>>();
            var userMgr = services.GetRequiredService<UserManager<ApplicationUser>>();

            await db.Database.MigrateAsync();

            // Seed permissions
            var allPerms = Permissions.GetAll().ToList();
            foreach (var p in allPerms)
            {
                if (!await db.Permissions.AnyAsync(x => x.Name == p))
                    db.Permissions.Add(new Permission { Name = p, Description = p });
            }
            await db.SaveChangesAsync();

            // Pastro lejet që s'janë më në katalog (p.sh. të hequrat legacy) — që të
            // mos mbeten "fantazma" në DB dhe te ekrani Roles. Heq edhe caktimet e tyre.
            var validNames = allPerms.ToHashSet();
            var stalePerms = await db.Permissions.Where(p => !validNames.Contains(p.Name)).ToListAsync();
            if (stalePerms.Count > 0)
            {
                var staleIds = stalePerms.Select(p => p.Id).ToList();
                var staleRolePerms = await db.RolePermissions.Where(rp => staleIds.Contains(rp.PermissionId)).ToListAsync();
                db.RolePermissions.RemoveRange(staleRolePerms);
                db.Permissions.RemoveRange(stalePerms);
                await db.SaveChangesAsync();
            }

            // Seed roles
            string[] roles = { "Admin", "Manager", "Worker", "Client" };
            foreach (var r in roles)
                if (!await roleMgr.RoleExistsAsync(r))
                    await roleMgr.CreateAsync(new ApplicationRole { Name = r, Description = $"{r} role" });

            // Assign permissions to roles
            await AssignPermissions(db, "Admin", allPerms); // Admin merr të gjitha

            // Manager — menaxhim operacional (pa user/role/settings admin).
            await AssignPermissions(db, "Manager", new[] {
                Permissions.SalesOrders.View, Permissions.SalesOrders.SetPrices, Permissions.SalesOrders.Cancel,
                Permissions.PurchaseOrders.View, Permissions.PurchaseOrders.Create, Permissions.PurchaseOrders.Receive, Permissions.PurchaseOrders.Cancel, Permissions.PurchaseOrders.Close,
                Permissions.Products.View, Permissions.Products.Create, Permissions.Products.Edit, Permissions.Products.Delete,
                Permissions.Inventory.View, Permissions.Inventory.AddStock, Permissions.Inventory.RemoveStock, Permissions.Inventory.Reserve, Permissions.Inventory.ReleaseReserved, Permissions.Inventory.Transfer, Permissions.Inventory.Adjust, Permissions.Inventory.CycleCount, Permissions.Inventory.ViewMovements,
                Permissions.Warehouses.View, Permissions.Warehouses.Create, Permissions.Warehouses.Edit, Permissions.Warehouses.Delete,
                Permissions.Rafts.View, Permissions.Rafts.Create, Permissions.Rafts.Edit, Permissions.Rafts.Delete,
                Permissions.Suppliers.View, Permissions.Suppliers.Create, Permissions.Suppliers.Edit, Permissions.Suppliers.Delete,
                Permissions.Clients.View, Permissions.Clients.Create, Permissions.Clients.Edit, Permissions.Clients.ViewOrders,
                Permissions.Pallets.View, Permissions.Pallets.Create, Permissions.Pallets.Edit, Permissions.Pallets.Delete, Permissions.Pallets.CreateFromOrder,
                Permissions.PalletItems.View, Permissions.PalletItems.Create, Permissions.PalletItems.Edit, Permissions.PalletItems.Delete,
                Permissions.PackingLists.View, Permissions.PackingLists.Create, Permissions.PackingLists.Edit, Permissions.PackingLists.MarkReady, Permissions.PackingLists.Cancel,
                Permissions.Shipments.View, Permissions.Shipments.Create, Permissions.Shipments.MarkReady, Permissions.Shipments.Ship, Permissions.Shipments.Deliver, Permissions.Shipments.Cancel,
                Permissions.Reports.ViewInventory, Permissions.Reports.ViewSales, Permissions.Reports.ViewShipment,
                Permissions.AuditLogs.View, Permissions.Users.View,
                Permissions.ExportImport.Export, Permissions.ExportImport.Import,
                Permissions.Dashboard.View, Permissions.Notifications.View,
            });

            // Worker — operacionet e fulfillment-it.
            await AssignPermissions(db, "Worker", new[] {
                // Sheh porositë e konfirmuara për t'i palletizuar (modali "From Sales Order").
                Permissions.SalesOrders.View,
                Permissions.Products.View,
                Permissions.Inventory.View, Permissions.Inventory.AddStock, Permissions.Inventory.RemoveStock, Permissions.Inventory.Transfer, Permissions.Inventory.Adjust, Permissions.Inventory.CycleCount, Permissions.Inventory.ViewMovements,
                Permissions.Warehouses.View, Permissions.Rafts.View, Permissions.Suppliers.View,
                Permissions.PurchaseOrders.View, Permissions.PurchaseOrders.Receive,
                Permissions.Pallets.View, Permissions.Pallets.Create, Permissions.Pallets.Edit, Permissions.Pallets.Delete, Permissions.Pallets.CreateFromOrder,
                Permissions.PalletItems.View, Permissions.PalletItems.Create, Permissions.PalletItems.Edit, Permissions.PalletItems.Delete,
                Permissions.PackingLists.View, Permissions.PackingLists.Create, Permissions.PackingLists.Edit, Permissions.PackingLists.MarkReady, Permissions.PackingLists.Cancel,
                Permissions.Shipments.View, Permissions.Shipments.Create, Permissions.Shipments.MarkReady, Permissions.Shipments.Ship, Permissions.Shipments.Deliver, Permissions.Shipments.Cancel,
                Permissions.Notifications.View, Permissions.Dashboard.View,
            });

            // Client — vetëshërbim.
            await AssignPermissions(db, "Client", new[] {
                Permissions.SalesOrders.ViewOwn, Permissions.SalesOrders.Create, Permissions.SalesOrders.Confirm, Permissions.SalesOrders.Cancel,
                Permissions.Products.View,
                Permissions.Shipments.ViewOwn, // klienti vetëm e ndjek dërgesën (Delivered e cakton stafi)
                Permissions.Notifications.View,
            });

            // Default admin user
            var adminUser = await userMgr.FindByEmailAsync("admin@warehouse.com");
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = "admin@warehouse.com",
                    Email = "admin@warehouse.com",
                    Name = "System Admin",
                    EmailConfirmed = true,
                    IsActive = true
                };
                var createAdminResult = await userMgr.CreateAsync(adminUser, "Admin123!");
                if (!createAdminResult.Succeeded)
                    throw new InvalidOperationException(string.Join("; ", createAdminResult.Errors.Select(e => e.Description)));
            }

            adminUser.EmailConfirmed = true;
            adminUser.IsActive = true;
            adminUser.UserName = "admin@warehouse.com";
            adminUser.Email = "admin@warehouse.com";

            var updateAdminResult = await userMgr.UpdateAsync(adminUser);
            if (!updateAdminResult.Succeeded)
                throw new InvalidOperationException(string.Join("; ", updateAdminResult.Errors.Select(e => e.Description)));

            if (!await userMgr.CheckPasswordAsync(adminUser, "Admin123!"))
            {
                var resetToken = await userMgr.GeneratePasswordResetTokenAsync(adminUser);
                var resetResult = await userMgr.ResetPasswordAsync(adminUser, resetToken, "Admin123!");
                if (!resetResult.Succeeded)
                    throw new InvalidOperationException(string.Join("; ", resetResult.Errors.Select(e => e.Description)));
            }

            if (!await userMgr.IsInRoleAsync(adminUser, "Admin"))
                await userMgr.AddToRoleAsync(adminUser, "Admin");
        }

        private static async Task AssignPermissions(AppDbContext db, string roleName, IEnumerable<string> perms)
        {
            var role = await db.Roles.FirstAsync(r => r.Name == roleName);
            foreach (var permName in perms)
            {
                var perm = await db.Permissions.FirstAsync(p => p.Name == permName);
                var exists = await db.RolePermissions.AnyAsync(rp =>
                    rp.RoleId == role.Id && rp.PermissionId == perm.Id);
                if (!exists)
                    db.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = perm.Id });
            }
            await db.SaveChangesAsync();
        }
    }
}