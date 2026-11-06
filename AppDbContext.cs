using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Warehouse.Models;
using System.Security.Claims;
using Warehouse.Services.Tenancy;
using System.Reflection;


namespace Warehouse
{
    public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string, IdentityUserClaim<string>, UserRoles, IdentityUserLogin<string>, IdentityRoleClaim<string>, IdentityUserToken<string>>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ITenantProvider _tenantProvider;
        public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor httpContextAccessor, ITenantProvider tenantProvider)
               : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
            _tenantProvider = tenantProvider;
        }
        // 0 s'i perket asnje tenanti, pra query filter-i nuk kthen asnje rresht.
        public int CurrentTenantId => _tenantProvider.TenantId ?? 0;

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
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<StockMovement> StockMovements { get; set; }



        public DbSet<SalesOrderItem> SalesOrderItems { get; set; }






        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Notification eshte dokument MongoDB, jo entitet SQL. E perjashtojme
            // shprehimisht qe te mos riterhiqet ne model nga ndonje navigacion i
            // ardhshem dhe te mos rikrijohet tabela e vdekur "Notification".
            modelBuilder.Ignore<Notification>();

            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.CreatedByUser)
                .WithMany()
                .HasForeignKey(u => u.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ApplicationUser>()
                .HasOne<Tenant>()
                .WithMany()
                .HasForeignKey(u => u.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Client>(b =>
        {
            b.HasOne(c => c.User)
                .WithOne()
                .HasForeignKey<Client>(c => c.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasIndex(c => c.UserId).IsUnique();
        });

            modelBuilder.Entity<Inventory>()
                .HasIndex(i => new { i.TenantId, i.ProductId, i.RaftId })
                .IsUnique();

            modelBuilder.Entity<Setting>()
                .HasIndex(s => new { s.TenantId, s.Key })
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

            // Ruajme ProductType si string ne DB (kolona mbetet nvarchar, lexueshme).
            modelBuilder.Entity<Product>()
                .Property(p => p.Type)
                .HasConversion<string>();

            modelBuilder.Entity<Product>(b =>
    {
        b.Property(p => p.Barcode).HasMaxLength(50);

        // Unik brenda tenant-it. Filtri lejon shumë produkte pa barkod (NULL).
        b.HasIndex(p => new { p.TenantId, p.Barcode })
        .IsUnique()
        .HasFilter("[Barcode] IS NOT NULL");
    });

            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(poi => poi.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<PurchaseOrderItem>(b =>
            {
                b.HasIndex(i => new { i.TenantId, i.PurchaseOrderId, i.ProductId }).IsUnique();
            });

            modelBuilder.Entity<SalesOrderItem>()
                .Property(poi => poi.UnitPrice)
                .HasPrecision(18, 2);

            modelBuilder.Entity<SalesOrder>()
                .Property(so => so.TotalAmount)
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

            // Rafti burim i rreshtit të paletës (opsional). NoAction për të shmangur
            // konflikt me shtigjet e tjera të kaskadës mbi Raft (Inventory etj.).
            modelBuilder.Entity<PalletItem>()
                .HasOne(pi => pi.Raft)
                .WithMany()
                .HasForeignKey(pi => pi.RaftId)
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
            modelBuilder.Entity<Tenant>(b =>
               {
                   b.HasIndex(t => t.Slug).IsUnique();
                   b.Property(t => t.Name).HasMaxLength(200).IsRequired();
                   b.Property(t => t.Slug).HasMaxLength(100).IsRequired();
               });

            foreach (var entityType in modelBuilder.Model.GetEntityTypes()
        .Where(t => typeof(BaseEntity).IsAssignableFrom(t.ClrType)))
            {
                modelBuilder.Entity(entityType.ClrType)
                    .HasOne(typeof(ApplicationUser), "CreatedBy")
                    .WithMany()
                    .HasForeignKey("CreatedById")
                    .OnDelete(DeleteBehavior.NoAction);

                modelBuilder.Entity(entityType.ClrType)
                    .HasOne(typeof(ApplicationUser), "UpdatedBy")
                    .WithMany()
                    .HasForeignKey("UpdatedById")
                    .OnDelete(DeleteBehavior.NoAction);
            }

            foreach (var entityType in modelBuilder.Model.GetEntityTypes()
    .Where(t => typeof(ITenantEntity).IsAssignableFrom(t.ClrType)))
            {
                ConfigureTenantMethod.MakeGenericMethod(entityType.ClrType)
                    .Invoke(this, new object[] { modelBuilder });
            }



        }

        private static readonly MethodInfo ConfigureTenantMethod =
    typeof(AppDbContext).GetMethod(nameof(ConfigureTenantEntity),
        BindingFlags.NonPublic | BindingFlags.Instance)!;

        private void ConfigureTenantEntity<T>(ModelBuilder modelBuilder) where T : class, ITenantEntity
        {
            modelBuilder.Entity<T>().HasQueryFilter(e => e.TenantId == CurrentTenantId);
            modelBuilder.Entity<T>().HasIndex(e => e.TenantId);
            modelBuilder.Entity<T>()
                .HasOne<Tenant>()
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
        }

        // Entitetet kritike per te cilat shkruajme automatikisht audit log.
        // Inventory eshte i perjashtuar me qellim: ai logohet ne InventoryService
        // me nje format te dedikuar (QOH/Reserved) qe perdoret nga historiku i inventarit.
        private static readonly HashSet<Type> AuditedTypes = new()
        {
            typeof(Product),
            typeof(SalesOrder),
            typeof(Shipment),
            typeof(Client),
            typeof(PurchaseOrder),
            typeof(Models.Warehouse),
            typeof(Supplier),
            typeof(Raft),
            typeof(Pallet),
            typeof(PackingList),
        };

        // Kolonat e auditimit ne nivel rreshti nuk i perfshijme ne old/new value,
        // qe logu te jete per te dhenat reale e jo per metadata.
        private static readonly HashSet<string> AuditIgnoredProps = new()
        {
            "CreatedAt", "CreatedById", "UpdatedAt", "UpdatedById","TenantId"
        };

        // Serializojme enum-et si emra (psh. "Received") jo si numra ("2") qe audit-i te jete i lexueshem.
        private static readonly JsonSerializerOptions AuditJsonOptions = new()
        {
            Converters = { new JsonStringEnumConverter() }
        };

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyTenantId();
            ApplyAuditInfo();

            var userId = _httpContextAccessor?.HttpContext?.User?
                .FindFirst(ClaimTypes.NameIdentifier)?.Value;
            // Logojme vetem kur ka nje user te identifikuar (UserId eshte i detyrueshem
            // dhe eshte FK ndaj perdoruesit). Veprimet e sistemit/seed nuk logohen.
            var pending = string.IsNullOrEmpty(userId) ? null : CapturePendingAudits();

            var result = await base.SaveChangesAsync(cancellationToken);

            if (pending is { Count: > 0 })
            {
                WriteAuditLogs(pending, userId!);
                await base.SaveChangesAsync(cancellationToken);
            }

            return result;
        }

        public override int SaveChanges()
        {
            ApplyTenantId();
            ApplyAuditInfo();

            var userId = _httpContextAccessor?.HttpContext?.User?
                .FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var pending = string.IsNullOrEmpty(userId) ? null : CapturePendingAudits();

            var result = base.SaveChanges();

            if (pending is { Count: > 0 })
            {
                WriteAuditLogs(pending, userId!);
                base.SaveChanges();
            }

            return result;
        }

        // Kap gjendjen e entiteteve te interesit PARA ruajtjes (per old/new values
        // dhe per veprimin). EntityId per Create-t plotesohet pas ruajtjes.
        private List<PendingAudit> CapturePendingAudits()
        {
            var list = new List<PendingAudit>();

            foreach (var entry in ChangeTracker.Entries())
            {
                if (!AuditedTypes.Contains(entry.Metadata.ClrType))
                    continue;

                string? action = entry.State switch
                {
                    EntityState.Added => "Create",
                    EntityState.Modified => "Update",
                    EntityState.Deleted => "Delete",
                    _ => null
                };
                if (action == null)
                    continue;

                // Anashkalo update-et ku ndryshuan vetem kolonat e auditimit.
                if (entry.State == EntityState.Modified && !HasRealChanges(entry))
                    continue;

                list.Add(new PendingAudit
                {
                    Entry = entry,
                    Entity = entry.Metadata.ClrType.Name,
                    Action = action,
                    OldValue = entry.State == EntityState.Added ? "" : SerializeValues(entry, original: true),
                    NewValue = entry.State == EntityState.Deleted ? "" : SerializeValues(entry, original: false),
                    EntityId = TryGetId(entry),
                });
            }

            return list;
        }

        private void WriteAuditLogs(List<PendingAudit> pending, string userId)
        {
            var ip = _httpContextAccessor?.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "unknown";

            foreach (var p in pending)
            {
                // Per Create, Id-ja gjenerohet nga DB-ja dhe behet e disponueshme pas ruajtjes.
                if (p.Action == "Create")
                    p.EntityId = TryGetId(p.Entry);

                AuditLogs.Add(new AuditLog
                {
                    UserId = userId,
                    TenantId = _tenantProvider.TenantId
               ?? throw new InvalidOperationException("Audit pa tenant aktiv."),
                    IpAddress = ip,
                    Action = p.Action,
                    Entity = p.Entity,
                    EntityId = p.EntityId,
                    OldValue = p.OldValue,
                    NewValue = p.NewValue,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        private static bool HasRealChanges(EntityEntry entry)
        {
            foreach (var p in entry.Properties)
            {
                if (!p.IsModified) continue;
                if (AuditIgnoredProps.Contains(p.Metadata.Name)) continue;
                return true;
            }
            return false;
        }

        private static string SerializeValues(EntityEntry entry, bool original)
        {
            var onlyModified = entry.State == EntityState.Modified;
            var dict = new Dictionary<string, object?>();

            foreach (var p in entry.Properties)
            {
                if (p.Metadata.IsPrimaryKey()) continue;
                if (AuditIgnoredProps.Contains(p.Metadata.Name)) continue;
                if (onlyModified && !p.IsModified) continue;
                dict[p.Metadata.Name] = original ? p.OriginalValue : p.CurrentValue;
            }

            return JsonSerializer.Serialize(dict, AuditJsonOptions);
        }

        private static int? TryGetId(EntityEntry entry)
        {
            var keyProp = entry.Metadata.FindPrimaryKey()?.Properties.FirstOrDefault();
            if (keyProp == null) return null;
            var val = entry.Property(keyProp.Name).CurrentValue;
            return val is int i ? i : null;
        }

        private sealed class PendingAudit
        {
            public EntityEntry Entry { get; set; } = null!;
            public string Entity { get; set; } = null!;
            public string Action { get; set; } = null!;
            public string OldValue { get; set; } = "";
            public string NewValue { get; set; } = "";
            public int? EntityId { get; set; }
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

        private void ApplyTenantId()
        {
            var tenantId = _tenantProvider.TenantId;

            foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
            {
                if (entry.State == EntityState.Added)
                {
                    if (entry.Entity.TenantId == 0)
                    {
                        if (tenantId is null or 0)
                            throw new InvalidOperationException(
                                $"Nuk mund te ruhet {entry.Metadata.ClrType.Name} pa tenant aktiv.");

                        entry.Entity.TenantId = tenantId.Value;
                    }
                    else if (tenantId is not null && entry.Entity.TenantId != tenantId)
                    {
                        // Mbrojtje nga shkrimi i qellimshem ne nje tenant tjeter.
                        throw new InvalidOperationException("TenantId i pavlefshem ne insert.");
                    }
                }
                else if (entry.State == EntityState.Modified)
                {
                    // Nje rresht nuk zhvendoset dot nga nje tenant te tjetri.
                    entry.Property(nameof(ITenantEntity.TenantId)).IsModified = false;
                }
            }
        }

    }

}
