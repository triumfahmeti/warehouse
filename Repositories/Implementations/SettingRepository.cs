using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class SettingRepository : GenericRepository<Setting>, ISettingRepository
    {
        private readonly AppDbContext _context;

        public SettingRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Setting?> GetWithDetails(int id)
        {
            return await _context.Settings
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<List<Setting>> GetAllWithDetails()
        {
            return await _context.Settings
                .OrderByDescending(s => s.UpdatedAt)
                .ToListAsync();
        }
    }
}