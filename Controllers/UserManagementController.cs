using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using Warehouse.DTOs.UserManagement;
using Warehouse.Models;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserManagementController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly AppDbContext _context;

        public UserManagementController(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            AppDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
        }

        [HttpGet]
        [HasPermission(Permissions.Users.View)]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userManager.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            var lastLogins = await _context.RefreshTokens
                .GroupBy(rt => rt.UserId)
                .Select(g => new { UserId = g.Key, LastLogin = g.Max(rt => rt.CreatedAt) })
                .ToListAsync();

            var lastLoginMap = lastLogins.ToDictionary(x => x.UserId, x => (DateTime?)x.LastLogin);

            // Rekordet Client (telefoni/adresa jetojne aty per user-at me rol Client).
            var clientMap = await _context.Clients
                .Where(c => c.UserId != null)
                .ToDictionaryAsync(c => c.UserId!, c => c);

            var result = new List<UserDto>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                clientMap.TryGetValue(user.Id, out var client);
                result.Add(new UserDto
                {
                    Id = user.Id,
                    Name = user.Name,
                    Email = user.Email ?? string.Empty,
                    IsActive = user.IsActive,
                    CreatedAt = user.CreatedAt,
                    Roles = roles.ToList(),
                    LastLoginAt = lastLoginMap.TryGetValue(user.Id, out var ll) ? ll : null,
                    PhoneNumber = client?.PhoneNumber,
                    Address = client?.Address
                });
            }

            return Ok(result);
        }

        [HttpPut("{id}")]
        [HasPermission(Permissions.Users.Edit)]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            // Kontroll eksplicit per email te zene nga nje user tjeter,
            // qe te kthejme nje mesazh te qarte ne vend te gabimit gjenerik te Identity.
            var existing = await _userManager.FindByEmailAsync(dto.Email);
            if (existing != null && existing.Id != user.Id)
                return BadRequest(new { message = $"Email '{dto.Email}' is already used by another user." });

            // Kap gjendjen e vjeter para ndryshimit per audit log.
            var oldValue = JsonSerializer.Serialize(new { user.Name, user.Email, user.PhoneNumber });

            user.Name = dto.Name;
            user.Email = dto.Email;
            user.UserName = dto.Email;
            user.PhoneNumber = dto.PhoneNumber;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(new { message = string.Join("; ", result.Errors.Select(e => e.Description)) });

            // Per user-at Client, telefoni/adresa ruhen te rekordi Client i lidhur.
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.UserId == user.Id);
            if (client != null)
            {
                client.FullName = dto.Name;
                client.Email = dto.Email;
                client.PhoneNumber = dto.PhoneNumber;
                client.Address = dto.Address;
                await _context.SaveChangesAsync();
            }

            var newValue = JsonSerializer.Serialize(new { dto.Name, dto.Email, dto.PhoneNumber, dto.Address });
            await LogUserActionAsync("Update User", user, oldValue, newValue);

            return NoContent();
        }

        [HttpPatch("{id}/deactivate")]
        [HasPermission(Permissions.Users.Deactivate)]
        public async Task<IActionResult> Deactivate(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (user.Id == currentUserId)
                return BadRequest(new { message = "Cannot deactivate your own account." });

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
            await LogUserActionAsync("Deactivate User", user);
            return NoContent();
        }

        [HttpPatch("{id}/activate")]
        [HasPermission(Permissions.Users.Activate)]
        public async Task<IActionResult> Activate(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
            await LogUserActionAsync("Activate User", user);
            return NoContent();
        }

        [HttpPost("{id}/roles")]
        [HasPermission(Permissions.Users.ManageRoles)]
        public async Task<IActionResult> AssignRole(string id, [FromBody] AssignRoleDto dto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            if (!await _roleManager.RoleExistsAsync(dto.Role))
                return BadRequest(new { message = $"Role '{dto.Role}' does not exist." });

            if (await _userManager.IsInRoleAsync(user, dto.Role))
                return BadRequest(new { message = $"User already has role '{dto.Role}'." });

            await _userManager.AddToRoleAsync(user, dto.Role);
            await LogUserActionAsync("Assign Role", user, newValue: $"{dto.Role} → {user.Email}");
            return NoContent();
        }

        [HttpDelete("{id}/roles/{role}")]
        [HasPermission(Permissions.Users.ManageRoles)]
        public async Task<IActionResult> RemoveRole(string id, string role)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();

            if (!await _userManager.IsInRoleAsync(user, role))
                return BadRequest(new { message = $"User does not have role '{role}'." });

            await _userManager.RemoveFromRoleAsync(user, role);
            await LogUserActionAsync("Remove Role", user, newValue: $"{role} → {user.Email}");
            return NoContent();
        }

        // Shkruan nje audit log per nje veprim mbi nje user. Id-ja e user-it eshte string,
        // ndaj nuk e vendosim te EntityId (int); identifikuesi ruhet te NewValue/OldValue.
        private async Task LogUserActionAsync(string action, ApplicationUser target, string? oldValue = null, string? newValue = null)
        {
            var actorId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(actorId)) return;

            _context.AuditLogs.Add(new AuditLog
            {
                UserId = actorId,
                IpAddress = HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "unknown",
                Action = action,
                Entity = "User",
                EntityId = null,
                OldValue = oldValue ?? "",
                NewValue = newValue ?? target.Email ?? "",
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }
    }
}
