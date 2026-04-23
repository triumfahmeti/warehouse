using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Warehouse;
using Warehouse.DTOs.Auth;
using Warehouse.Models;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;
        public AuthService(UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager, IConfiguration configuration, AppDbContext context)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
            _context = context;


        }
        public async Task<string> RegisterAsync(RegisterDto dto, string? currentUserId)
        {
            // if (string.IsNullOrWhiteSpace(currentUserId))
            //     return "Creator user ID is required.";

            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
                return "Email already in use.";

            var user = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                Name = dto.Name,
                CreatedById = currentUserId,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
                return string.Join("; ", result.Errors.Select(e => e.Description));

            if (!await _roleManager.RoleExistsAsync(dto.Role))
            {
                var createRoleResult = await _roleManager.CreateAsync(new ApplicationRole
                {
                    Name = dto.Role,
                    Description = $"System role: {dto.Role}",
                    CreatedAt = DateTime.UtcNow

                });

                if (!createRoleResult.Succeeded)
                    return string.Join("; ", createRoleResult.Errors.Select(e => e.Description));
            }
            await _userManager.AddToRoleAsync(user, dto.Role);
            return "User registered successfully.";

        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
                throw new Exception("Invalid email.");

            var passwordValid = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!passwordValid)
                throw new Exception("Invalid  password.");

            // In a real application, you would generate a JWT token here
            var accessToken = await GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            await SaveRefreshTokenAsync(user.Id, refreshToken);
            var roles = await _userManager.GetRolesAsync(user);



            return new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"]!)),
                Email = user.Email ?? string.Empty,
                UserId = user.Id,
                Roles = roles.ToList()
            };
        }

        private async Task<string> GenerateJwtToken(ApplicationUser user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var roles = await _userManager.GetRolesAsync(user);
            var secretKey = jwtSettings["SecretKey"]
                ?? throw new InvalidOperationException("Missing configuration: JwtSettings:SecretKey");

            if (Encoding.UTF8.GetByteCount(secretKey) < 16)
                throw new InvalidOperationException("JwtSettings:SecretKey must be at least 16 bytes for HS256.");

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),

            };
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var expirationMinutes = int.Parse(jwtSettings["AccessTokenExpirationMinutes"]!);
            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }


        //Metoda per krijim te refresh tokenit.
        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        //Metoda per hash te tokenit.
        private string HashToken(string token)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(token);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        //Metoda per ruajtjen e refresh tokenit ne database sa her qe krijohet.
        public async Task<RefreshToken> SaveRefreshTokenAsync(string userId, string token)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var expirationDays = int.Parse(jwtSettings["RefreshTokenExpirationDays"]!);
            var tokenHash = HashToken(token);

            var refreshToken = new RefreshToken
            {
                TokenHash = tokenHash,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(expirationDays),
                RevokedAt = null
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();
            return refreshToken;
        }

        //Metoda per refreskim te tokenit.
        public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto)
        {
            var tokenHash = HashToken(dto.RefreshToken);
            var existingToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

            if (existingToken == null || existingToken.RevokedAt != null || existingToken.ExpiresAt < DateTime.UtcNow)
                throw new Exception("Invalid refresh token.");

            // Revoke the old token
            existingToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Generate new tokens
            var newAccessToken = await GenerateJwtToken(existingToken.User);
            var newRefreshToken = GenerateRefreshToken();
            await SaveRefreshTokenAsync(existingToken.UserId, newRefreshToken);
            var roles = await _userManager.GetRolesAsync(existingToken.User);

            return new AuthResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["JwtSettings:AccessTokenExpirationMinutes"]!)),
                Email = existingToken.User.Email ?? string.Empty,
                UserId = existingToken.User.Id,
                Roles = roles.ToList()
            };
        }

        public async Task<bool> LogoutAsync(string refreshToken)
        {
            var tokenHash = HashToken(refreshToken);
            var existingToken = await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

            if (existingToken == null || existingToken.RevokedAt != null)
                return false;

            existingToken.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }



    }
}