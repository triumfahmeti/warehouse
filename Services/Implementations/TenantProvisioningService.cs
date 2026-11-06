using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MongoDB.Driver;
using Warehouse.DTOs.Tenant;
using Warehouse.Models;
using Warehouse.Services.Interfaces;
using Warehouse.Services.Tenancy;

namespace Warehouse.Services.Implementations
{
    public class TenantProvisioningService : ITenantProvisioningService
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITenantProvider _tenantProvider;

        public TenantProvisioningService(
            AppDbContext context,
            UserManager<ApplicationUser> userManager,
            ITenantProvider tenantProvider)
        {
            _context = context;
            _userManager = userManager;
            _tenantProvider = tenantProvider;
        }

        // Settings-at default, te zhvendosur nga Program.cs. Tani mbillen per
        // çdo tenant te ri, jo nje here globalisht.
        private static readonly (string Key, string Value, string Description)[] DefaultSettings =
        {
            ("company_name", "New Company", "Company name"),
            ("company_address", "", "Company address"),
            ("company_email", "", "Company email"),
            ("currency", "EUR", "Default currency"),

            ("low_stock_threshold", "10", "Notify when stock falls below this value"),
            ("critical_stock_threshold", "5", "Critical stock alert threshold"),
            ("auto_reserve_on_confirm", "true", "Automatically reserve stock when order is confirmed"),

            ("max_pallets_per_shipment", "20", "Maximum pallets allowed per shipment"),
            ("shipment_number_prefix", "SHP", "Prefix for shipment numbers"),
            ("packing_list_number_prefix", "PL", "Prefix for packing list numbers"),

            ("low_stock_alerts", "true", "Enable low stock notifications"),
            ("order_created_notify", "true", "Notify when order is created"),
            ("shipment_delivered_notify", "true", "Notify when shipment is delivered"),
        };

        public async Task<Tenant> CreateAsync(CreateTenantDto dto, string? actorUserId)
        {
            var slug = dto.Slug.Trim().ToLowerInvariant();

            if (await _context.Tenants.AnyAsync(t => t.Slug == slug))
                throw new InvalidOperationException($"Slug '{slug}' eshte i zene.");

            if (await _userManager.FindByEmailAsync(dto.AdminEmail) != null)
                throw new InvalidOperationException($"Email '{dto.AdminEmail}' eshte i zene.");

            using var tx = await _context.Database.BeginTransactionAsync();

            var tenant = new Tenant
            {
                Name = dto.Name.Trim(),
                Slug = slug,
                ContactEmail = dto.ContactEmail,
                ContactPhone = dto.ContactPhone,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            // Tenant nuk eshte ITenantEntity, prandaj ruhet pa pasur tenant aktiv.
            _context.Tenants.Add(tenant);
            await _context.SaveChangesAsync();

            // Nga ky çast e tutje, çdo shkrim brenda kesaj kerkese shkon te tenanti i ri.
            _tenantProvider.SetTenant(tenant.Id);

            await SeedDefaultSettingsAsync(tenant.Id);

            var admin = new ApplicationUser
            {
                UserName = dto.AdminEmail,
                Email = dto.AdminEmail,
                Name = dto.AdminName,
                IsActive = true,
                TenantId = tenant.Id,
                CreatedById = actorUserId,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _userManager.CreateAsync(admin, dto.AdminPassword);
            if (!created.Succeeded)
                throw new InvalidOperationException(string.Join("; ", created.Errors.Select(e => e.Description)));

            await _userManager.AddToRoleAsync(admin, "Admin");

            // Historiku i kompanise nis me krijimin e vet. TenantId e vendos
            // ApplyTenantId nga provider-i qe sapo e caktuam.
            if (!string.IsNullOrEmpty(actorUserId))
            {
                _context.AuditLogs.Add(new AuditLog
                {
                    UserId = actorUserId,
                    Action = "Create",
                    Entity = "Tenant",
                    EntityId = tenant.Id,
                    OldValue = "",
                    NewValue = $"{tenant.Name} ({tenant.Slug}) · admin: {dto.AdminEmail}",
                    IpAddress = "unknown",
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }

            await tx.CommitAsync();
            return tenant;
        }

        public async Task SeedDefaultSettingsAsync(int tenantId)
        {
            var existing = await _context.Settings
                .IgnoreQueryFilters()
                .Where(s => s.TenantId == tenantId)
                .Select(s => s.Key)
                .ToListAsync();

            foreach (var (key, value, description) in DefaultSettings)
            {
                if (existing.Contains(key)) continue;

                _context.Settings.Add(new Setting
                {
                    TenantId = tenantId,
                    Key = key,
                    Value = value,
                    Description = description,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
        }
    }
}