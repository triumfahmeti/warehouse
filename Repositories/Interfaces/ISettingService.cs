using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Repositories.Interfaces
{
    public interface ISettingRepository : IGenericRepository<Setting>
    {
        Task<Setting?> GetWithDetails(int id);
        Task<List<Setting>> GetAllWithDetails();
    }
}