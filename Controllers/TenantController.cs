using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;
using Warehouse.DTOs.Tenant;
using Warehouse.Models;
using Warehouse.Services.Interfaces;
using Warehouse.Services.Tenancy;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // Mbrojtje e dyfishte: roli e ndalon aksesin edhe sikur lejet te keqkonfigurohen.
    [Authorize(Roles = TenantProvider.SuperAdminRole)]
    public class TenantController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantProvisioningService _provisioning;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IRealtimeNotifier _realtime;

        public TenantController(
            AppDbContext context,
            ITenantProvisioningService provisioning,
            UserManager<ApplicationUser> userManager,
            IRealtimeNotifier realtime)
        {
            _context = context;
            _provisioning = provisioning;
            _userManager = userManager;
            _realtime = realtime;
        }

        [HttpGet]
        [HasPermission(Permissions.Tenants.View)]
        public async Task<IActionResult> GetAll()
        {
            var counts = await _userManager.Users
                .Where(u => u.TenantId != null)
                .GroupBy(u => u.TenantId!.Value)
                .Select(g => new { TenantId = g.Key, Count = g.Count() })
                .ToListAsync();

            var countMap = counts.ToDictionary(x => x.TenantId, x => x.Count);

            var tenants = await _context.Tenants
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(tenants.Select(t => new TenantDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                ContactEmail = t.ContactEmail,
                ContactPhone = t.ContactPhone,
                IsActive = t.IsActive,
                CreatedAt = t.CreatedAt,
                UserCount = countMap.TryGetValue(t.Id, out var c) ? c : 0
            }));
        }

        [HttpGet("platform-stats")]
        [HasPermission(Permissions.Tenants.View)]
        public async Task<IActionResult> GetPlatformStats()
        {
            // Ky endpoint eshte qellimisht cross-tenant: SuperAdmin-i duhet te shohe
            // gjithe platformen edhe pa "hyre" ne nje tenant. Prandaj IgnoreQueryFilters().
            var tenants = await _context.Tenants
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            // ApplicationUser s'ka query filter -> filtrohet me dore (null = SuperAdmin).
            var userStats = await _userManager.Users
                .Where(u => u.TenantId != null)
                .GroupBy(u => u.TenantId!.Value)
                .Select(g => new
                {
                    TenantId = g.Key,
                    Total = g.Count(),
                    Active = g.Count(x => x.IsActive)
                })
                .ToListAsync();

            var productStats = await _context.Products
                .IgnoreQueryFilters()
                .GroupBy(p => p.TenantId)
                .Select(g => new { TenantId = g.Key, Count = g.Count() })
                .ToListAsync();

            var orderStats = await _context.SalesOrders
                .IgnoreQueryFilters()
                .GroupBy(o => o.TenantId)
                .Select(g => new { TenantId = g.Key, Count = g.Count() })
                .ToListAsync();

            var shipmentStats = await _context.Shipments
                .IgnoreQueryFilters()
                .GroupBy(s => s.TenantId)
                .Select(g => new { TenantId = g.Key, Count = g.Count() })
                .ToListAsync();

            // Aktiviteti i fundit = audit log-u me i ri i atij tenanti.
            var activityStats = await _context.AuditLogs
                .IgnoreQueryFilters()
                .GroupBy(a => a.TenantId)
                .Select(g => new { TenantId = g.Key, Last = g.Max(a => a.CreatedAt) })
                .ToListAsync();

            var userMap = userStats.ToDictionary(x => x.TenantId);
            var productMap = productStats.ToDictionary(x => x.TenantId, x => x.Count);
            var orderMap = orderStats.ToDictionary(x => x.TenantId, x => x.Count);
            var shipmentMap = shipmentStats.ToDictionary(x => x.TenantId, x => x.Count);
            var activityMap = activityStats.ToDictionary(x => x.TenantId, x => x.Last);

            var usage = tenants.Select(t => new TenantUsageDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                IsActive = t.IsActive,
                CreatedAt = t.CreatedAt,
                Users = userMap.TryGetValue(t.Id, out var u) ? u.Total : 0,
                ActiveUsers = userMap.TryGetValue(t.Id, out var u2) ? u2.Active : 0,
                Products = productMap.TryGetValue(t.Id, out var p) ? p : 0,
                SalesOrders = orderMap.TryGetValue(t.Id, out var o) ? o : 0,
                Shipments = shipmentMap.TryGetValue(t.Id, out var s) ? s : 0,
                LastActivityAt = activityMap.TryGetValue(t.Id, out var a) ? a : null
            }).ToList();

            return Ok(new PlatformStatsDto
            {
                TotalTenants = tenants.Count,
                ActiveTenants = tenants.Count(t => t.IsActive),
                SuspendedTenants = tenants.Count(t => !t.IsActive),
                TotalUsers = usage.Sum(x => x.Users),
                ActiveUsers = usage.Sum(x => x.ActiveUsers),
                TotalProducts = usage.Sum(x => x.Products),
                TotalSalesOrders = usage.Sum(x => x.SalesOrders),
                TotalShipments = usage.Sum(x => x.Shipments),
                Tenants = usage
            });
        }

        [HttpPost]
        [HasPermission(Permissions.Tenants.Create)]
        public async Task<IActionResult> Create([FromBody] CreateTenantDto dto)
        {
            var actorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var tenant = await _provisioning.CreateAsync(dto, actorId);

            await _realtime.PlatformChangedAsync("tenants");

            return Ok(new { tenant.Id, tenant.Name, tenant.Slug });
        }

        [HttpPut("{id}")]
        [HasPermission(Permissions.Tenants.Edit)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTenantDto dto)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null) return NotFound();

            tenant.Name = dto.Name.Trim();
            tenant.ContactEmail = dto.ContactEmail;
            tenant.ContactPhone = dto.ContactPhone;
            tenant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _realtime.PlatformChangedAsync("tenants");

            return NoContent();
        }

        [HttpPatch("{id}/activate")]
        [HasPermission(Permissions.Tenants.Edit)]
        public Task<IActionResult> Activate(int id) => SetActive(id, true);

        [HttpPatch("{id}/deactivate")]
        [HasPermission(Permissions.Tenants.Edit)]
        public Task<IActionResult> Deactivate(int id) => SetActive(id, false);

        private async Task<IActionResult> SetActive(int id, bool isActive)
        {
            var tenant = await _context.Tenants.FindAsync(id);
            if (tenant == null) return NotFound();

            tenant.IsActive = isActive;
            tenant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await _realtime.PlatformChangedAsync("tenants");

            return NoContent();
        }
    }
}