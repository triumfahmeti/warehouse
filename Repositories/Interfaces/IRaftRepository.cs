using Warehouse.Models;
using Warehouse.Services.Interfaces;
 
namespace Warehouse.Repositories.Interfaces
{
    public interface IRaftRepository : IGenericRepository<Raft>
    {
        Task<Raft?> GetWithDetails(int id);
        Task<List<Raft>> GetAllWithDetails();
        Task<List<Raft>> GetByWarehouseId(int warehouseId);
        Task<Raft?> GetByRaftNumber(string raftNumber);
    }
}