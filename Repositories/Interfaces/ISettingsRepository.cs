using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.Models;
using Warehouse.Services.Interfaces;

namespace Warehouse.Repositories.Interfaces
{
    public interface ISettingsRepository : IGenericRepository<Setting>
    {
        Task<Setting?> GetByKeyAsync(string key);
        Task<List<Setting>> GetAllSettingsAsync();
        Task<Setting?> UpdateByKeyAsync(string key, string value, string description);
    }
}