using Warehouse.DTOs.Client;
using Warehouse.Models;

namespace Warehouse.Services.Interfaces
{
    public interface IClientService
    {
        Task<List<ClientListDto>> GetAllAsync();
        Task<int> CreateClient(string fullName, string email, string? phoneNumber, string? address);
        Task UpdateClient(int id, string fullName, string email, string? phoneNumber, string? address);
        Task<List<SalesOrder>> GetClientOrders(int clientId);
        Task<List<MyOrderDto>> GetMyOrdersAsync(string userId);
        Task<MyStatsDto> GetMyStatsAsync(string userId);
    }
}
