using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.DTOs.Auth;
using Warehouse.Models;

namespace Warehouse.Services.Interfaces
{
    public interface IAuthService
    {
        Task<string> RegisterAsync(RegisterDto dto, string? currentUserId);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);

        Task<RefreshToken> SaveRefreshTokenAsync(string userId, string token);
        Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto dto);
        Task<bool> LogoutAsync(string refreshToken);



    }
}