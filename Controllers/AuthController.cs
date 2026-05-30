using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;
using Warehouse.DTOs.Auth;
using Warehouse.Models;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly AppDbContext _context;

        public AuthController(IAuthService authService, AppDbContext context)
        {
            _authService = authService;
            _context = context;
        }

        [HttpGet("me")]
        [Authorize]
        public IActionResult GetCurrentUser()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = User.FindFirst(ClaimTypes.Email)?.Value;
            var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
            var permissions = User.FindAll("permission").Select(c => c.Value).ToList();

            return Ok(new
            {
                userId,
                email,
                roles,
                permissions
            });
        }


        [HttpPost("register")]
        // [Authorize]
        // [HasPermission(Permissions.Users.Create)]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(currentUserId))
                return Unauthorized("Unable to identify the current user.");

            var currentUserRoles = User.FindAll(ClaimTypes.Role)
                .Select(c => c.Value)
                .ToList();

            try
            {
                var result = await _authService.RegisterAsync(dto, currentUserId, currentUserRoles);
                if (result.Contains("successfully"))
                {
                    // Audit log per krijimin e user-it (admini qe e krijoi = currentUserId).
                    _context.AuditLogs.Add(new AuditLog
                    {
                        UserId = currentUserId,
                        IpAddress = HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "unknown",
                        Action = "Create User",
                        Entity = "User",
                        EntityId = null,
                        OldValue = "",
                        NewValue = JsonSerializer.Serialize(new { dto.Name, dto.Email, dto.Role }),
                        CreatedAt = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();

                    return Ok(new { message = result });
                }
                else
                    return BadRequest(new { message = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                var result = await _authService.LoginAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
        {
            var result = await _authService.RefreshTokenAsync(dto);
            if (result != null)
                return Ok(result);
            else
                return BadRequest("Invalid refresh token.");
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto dto)
        {
            var result = await _authService.LogoutAsync(dto.RefreshToken);
            if (result)
                return Ok(new { message = "Logged out successfully." });
            else
                return BadRequest(new { message = "Invalid refresh token." });


        }
    }
}