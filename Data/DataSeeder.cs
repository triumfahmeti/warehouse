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

            // Seed roles
            string[] roles = { "Admin", "Manager", "Worker", "Client" };
            foreach (var r in roles)
                if (!await roleMgr.RoleExistsAsync(r))
                    await roleMgr.CreateAsync(new ApplicationRole { Name = r, Description = $"{r} role" });

            // Assign permissions to roles
            await AssignPermissions(db, "Admin", allPerms); // Admin merr të gjitha
            await AssignPermissions(db, "Manager", new[] {
            Permissions.Orders.View, Permissions.Orders.Approve, Permissions.Orders.Create,
            Permissions.Inventory.View, Permissions.Inventory.Update, Permissions.Inventory.Transfer,
            Permissions.Products.View, Permissions.Products.Edit,
            Permissions.Reports.View, Permissions.Users.View
        });
            await AssignPermissions(db, "Worker", new[] {
            Permissions.Orders.View, Permissions.Inventory.View, Permissions.Inventory.Update,
            Permissions.Products.View
        });
            await AssignPermissions(db, "Client", new[] {
            Permissions.Orders.View, Permissions.Orders.Create, Permissions.Products.View
        });

            // Default admin user
            if (await userMgr.FindByEmailAsync("admin@warehouse.com") == null)
            {
                var admin = new ApplicationUser
                {
                    UserName = "admin@warehouse.com",
                    Email = "admin@warehouse.com",
                    Name = "System Admin",
                    EmailConfirmed = true
                };
                await userMgr.CreateAsync(admin, "Admin@123456");
                await userMgr.AddToRoleAsync(admin, "Admin");
            }
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