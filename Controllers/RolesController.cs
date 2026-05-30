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
    public class RolesController : ControllerBase
    {
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly AppDbContext _context;

        public RolesController(RoleManager<ApplicationRole> roleManager, AppDbContext context)
        {
            _roleManager = roleManager;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var allPermissions = await _context.Permissions.ToListAsync();

            var roles = await _roleManager.Roles
                .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .ToListAsync();

            var result = roles.Select(r => new RoleWithPermissionsDto
            {
                Id = r.Id,
                Name = r.Name ?? string.Empty,
                Description = r.Description,
                Permissions = r.RolePermissions.Select(rp => rp.Permission.Name).ToList(),
                AllPermissions = allPermissions.Select(p => p.Name).ToList()
            }).ToList();

            return Ok(result);
        }

        [HttpPut("{roleId}/permissions")]
        public async Task<IActionResult> UpdatePermissions(string roleId, [FromBody] UpdateRolePermissionsDto dto)
        {
            var role = await _roleManager.Roles
                .Include(r => r.RolePermissions)
                .FirstOrDefaultAsync(r => r.Id == roleId);

            if (role == null) return NotFound();

            _context.RolePermissions.RemoveRange(role.RolePermissions);

            var permissions = await _context.Permissions
                .Where(p => dto.PermissionNames.Contains(p.Name))
                .ToListAsync();

            foreach (var perm in permissions)
            {
                _context.RolePermissions.Add(new RolePermission
                {
                    RoleId = roleId,
                    PermissionId = perm.Id
                });
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
