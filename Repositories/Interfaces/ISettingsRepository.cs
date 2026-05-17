using System.Collections.Generic;
using System.Threading.Tasks;
using Warehouse.Models;

namespace Warehouse.Repositories.Interfaces
{
    public interface ISettingsRepository : IGenericRepository<Setting>
    {
        Task<Setting?> GetByKeyAsync(string key);
        Task<List<Setting>> GetAllSettingsAsync();
        Task<Setting?> UpdateByKeyAsync(string key, string value, string description);
    }
}