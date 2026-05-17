using Warehouse.Models;
using Warehouse.Repositories.Interfaces;    
using Warehouse.Services.Interfaces;

namespace Warehouse.Repositories.Interfaces
{
    public interface IPackingListRepository : IGenericRepository<PackingList>
    {
        Task<PackingList?> GetWithPalletsAndOrder(int id);
        Task<List<PackingList>> GetBySalesOrder(int salesOrderId);
        Task<List<PackingList>> GetAllWithDetails();
    }
}