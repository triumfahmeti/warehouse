using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.Admin;
using Warehouse.Models;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly AppDbContext _context;

        public AdminDashboardController(UserManager<ApplicationUser> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet("stats")]
        [HasPermission(Permissions.Dashboard.View)]
        public async Task<IActionResult> GetStats()
        {
            // ApplicationUser dhe RefreshToken nuk kane query filter (duhen te
            // aksesueshem para se tenanti te jete i njohur, gjate login/refresh),
            // prandaj ketu filtrohen me dore. 0 nuk i perket asnje tenanti.
            var tenantId = _context.CurrentTenantId;

            var tenantUsers = _userManager.Users.Where(u => u.TenantId == tenantId);
            var totalUsers = await tenantUsers.CountAsync();
            var activeUsers = await tenantUsers.CountAsync(u => u.IsActive);

            var recentLogins = await _context.RefreshTokens
                .Where(rt => rt.User.TenantId == tenantId)
                .OrderByDescending(rt => rt.CreatedAt)
                .Take(10)
                .Select(rt => new RecentLoginDto
                {
                    UserId = rt.UserId,
                    UserName = rt.User.Name,
                    Email = rt.User.Email ?? string.Empty,
                    LoginAt = rt.CreatedAt
                })
                .ToListAsync();

            var criticalActions = await _context.AuditLogs
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Take(10)
                .Select(a => new CriticalActionDto
                {
                    Id = a.Id,
                    // SuperAdmin-i (TenantId == null) maskohet, njesoj si te AuditLogService.
                    UserName = a.User == null ? "System"
                             : a.User.TenantId == null ? "Sys Admin"
                             : a.User.Name,
                    Action = a.Action,
                    Entity = a.Entity,
                    EntityId = a.EntityId,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return Ok(new AdminDashboardStatsDto
            {
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                InactiveUsers = totalUsers - activeUsers,
                TotalOrders = await _context.SalesOrders.CountAsync(),
                TotalShipments = await _context.Shipments.CountAsync(),
                TotalAuditLogs = await _context.AuditLogs.CountAsync(),
                RecentLogins = recentLogins,
                CriticalActions = criticalActions
            });
        }
    }
}
