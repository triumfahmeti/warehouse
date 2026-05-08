using Warehouse.Models;

namespace Warehouse.Repositories.Interfaces
{
    public interface IClientRepository
    {
        Task<Client?> GetByIdAsync(int id);
        Task<Client?> GetWithOrdersAsync(int id);
        Task AddAsync(Client client);
        Task UpdateAsync(Client client);
    }
}
