using Warehouse.Models;

namespace Warehouse.Repositories.Interfaces
{
    public interface IClientRepository
    {
        Task<Client?> GetByIdAsync(int id);
        Task<List<SalesOrder>> GetOrdersByUserIdAsync(string userId);
        Task<Client?> GetClientByUserIdAsync(string userId);
        Task<Client?> GetWithOrdersAsync(int id);
        Task AddAsync(Client client);
        Task UpdateAsync(Client client);
    }
}
