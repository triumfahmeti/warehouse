using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;
using Warehouse.DTOs.Auth;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
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
        [Authorize]
        [HasPermission(Permissions.Users.Create)]
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

            // var currentUserId = "system"; // For testing purposes, replace with actual user ID in production

            var result = await _authService.RegisterAsync(dto, currentUserId, currentUserRoles);
            if (result.Contains("successfully"))
                return Ok(result);
            else
                return BadRequest(result);
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
                return Ok("Logged out successfully.");
            else
                return BadRequest("Invalid refresh token.");


        }
    }
}