using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class PalletRepository : GenericRepository<Pallet>, IPalletRepository
    {
        private readonly AppDbContext _context;

        public PalletRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Pallet?> GetWithItems(int id)
        {
            return await _context.Pallets
                .Include(p => p.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<List<Pallet>> GetAllWithItems()
        {
            return await _context.Pallets
                .Include(p => p.Items)
                    .ThenInclude(i => i.Product)
                .ToListAsync();
        }

        public async Task<Pallet?> GetByPalletCode(string palletCode)
        {
            return await _context.Pallets
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.PalletCode == palletCode);
        }
    }
}