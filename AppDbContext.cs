using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using System.Security.Claims;


namespace Warehouse
{
    public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string, IdentityUserClaim<string>, UserRoles, IdentityUserLogin<string>, IdentityRoleClaim<string>, IdentityUserToken<string>>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor httpContextAccessor)
               : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public virtual DbSet<Permission> Permissions { get; set; }
        public DbSet<RolePermission> RolePermissions { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        //public DbSet<Notification> Notifications { get; set; }
        public DbSet<Setting> Settings { get; set; }
        public DbSet<Warehouse.Models.File> Files { get; set; }
        public DbSet<Warehouse.Models.Warehouse> Warehouses { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Inventory> Inventories { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<SalesOrder> SalesOrders { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        public DbSet<Shipment> Shipments { get; set; }
        // public DbSet<ShipmentItem> ShipmentItems { get; set; }
        public DbSet<Pallet> Pallets { get; set; }
        public DbSet<PalletItem> PalletItems { get; set; }
        public DbSet<PackingList> PackingLists { get; set; }
        public DbSet<PackingListPallet> PackingListPallets { get; set; }
        public DbSet<Raft> Rafts { get; set; }



        public DbSet<SalesOrderItem> SalesOrderItems { get; set; }






        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.CreatedByUser)
                .WithMany()
                .HasForeignKey(u => u.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Inventory>()
                .HasIndex(i => new { i.ProductId, i.RaftId })
                .IsUnique();

            modelBuilder.Entity<Product>()
                .Property(p => p.Length)
                .HasPrecision(18, 3);

            modelBuilder.Entity<Product>()
                .Property(p => p.Width)
                .HasPrecision(18, 3);

            modelBuilder.Entity<Product>()
                .Property(p => p.Height)
                .HasPrecision(18, 3);

            modelBuilder.Entity<Product>()
                .Property(p => p.Weight)
                .HasPrecision(18, 3);

            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(poi => poi.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<SalesOrderItem>()
                .Property(poi => poi.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PurchaseOrder>()
                .Property(po => po.Status)
                .HasConversion<string>();

            modelBuilder.Entity<Shipment>()
                .HasOne(s => s.Warehouse)
                .WithMany()
                .HasForeignKey(s => s.WarehouseId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<PackingListPallet>()
                .HasOne(plp => plp.Pallet)
                .WithMany()
                .HasForeignKey(plp => plp.PalletId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<UserRoles>(b =>
        {
            b.HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId)
                .IsRequired();

            b.HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId)
                .IsRequired();
        });

            modelBuilder.Entity<Permission>(b =>
        {
            b.HasIndex(p => p.Name).IsUnique();
            b.Property(p => p.Name).HasMaxLength(100).IsRequired();
            b.Property(p => p.Description).HasMaxLength(250);
        });

            modelBuilder.Entity<RolePermission>(b =>
        {
            b.HasIndex(rp => new { rp.RoleId, rp.PermissionId }).IsUnique();

            b.HasOne(rp => rp.Role)
                .WithMany(r => r.RolePermissions)
                .HasForeignKey(rp => rp.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(rp => rp.Permission)
                .WithMany(p => p.RolePermissions)
                .HasForeignKey(rp => rp.PermissionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

            foreach (var entityType in modelBuilder.Model.GetEntityTypes()
        .Where(t => typeof(BaseEntity).IsAssignableFrom(t.ClrType)))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasOne(typeof(ApplicationUser), "CreatedBy")
                    .WithMany()
                    .HasForeignKey("CreatedById")
                    .OnDelete(DeleteBehavior.SetNull);

                modelBuilder.Entity(entityType.ClrType)
                    .HasOne(typeof(ApplicationUser), "UpdatedBy")
                    .WithMany()
                    .HasForeignKey("UpdatedById")
                    .OnDelete(DeleteBehavior.SetNull);
            }


        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyAuditInfo();
            return await base.SaveChangesAsync(cancellationToken);
        }

        public override int SaveChanges()
        {
            ApplyAuditInfo();
            return base.SaveChanges();
        }

        private void ApplyAuditInfo()
        {
            var userId = _httpContextAccessor?.HttpContext?.User?
                .FindFirst(ClaimTypes.NameIdentifier)?.Value;

            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.CreatedById = userId;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedById = userId;

                    // Mbrojtja CreatedAt/CreatedById nga modifikimi
                    entry.Property(nameof(BaseEntity.CreatedAt)).IsModified = false;
                    entry.Property(nameof(BaseEntity.CreatedById)).IsModified = false;
                }
            }
        }
    }

}
