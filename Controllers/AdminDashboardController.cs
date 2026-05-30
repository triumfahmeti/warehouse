using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.Admin;
using Warehouse.Models;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
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
        public async Task<IActionResult> GetStats()
        {
            var totalUsers = await _userManager.Users.CountAsync();
            var activeUsers = await _userManager.Users.CountAsync(u => u.IsActive);

            var recentLogins = await _context.RefreshTokens
                .Include(rt => rt.User)
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
                    UserName = a.User != null ? a.User.Name : "System",
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
