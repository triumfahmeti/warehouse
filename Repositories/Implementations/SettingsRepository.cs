using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class SettingsRepository : GenericRepository<Setting>, ISettingsRepository
    {
        private readonly AppDbContext _context;

        public SettingsRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Setting?> GetByKeyAsync(string key)
        {
            return await _context.Settings.FirstOrDefaultAsync(s => s.Key == key);
        }

        public async Task<List<Setting>> GetAllSettingsAsync()
        {
            return await _context.Settings.ToListAsync();
        }

        public async Task<Setting?> UpdateByKeyAsync(string key, string value, string description)
        {
            var setting = await GetByKeyAsync(key);
            if (setting == null) return null;

            setting.Value = value;
            setting.Description = description;
            setting.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return setting;
        }
    }
}