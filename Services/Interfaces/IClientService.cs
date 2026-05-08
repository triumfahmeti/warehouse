using Warehouse.Models;

namespace Warehouse.Services.Interfaces
{
    public interface IClientService
    {
        Task<int> CreateClient(string fullName, string email, string? phoneNumber, string? address);
        Task UpdateClient(int id, string fullName, string email, string? phoneNumber, string? address);
        Task<List<SalesOrder>> GetClientOrders(int clientId);
    }
}
