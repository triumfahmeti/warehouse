using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class PalletItemRepository : GenericRepository<PalletItem>, IPalletItemRepository
    {
        private readonly AppDbContext _context;

        public PalletItemRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<PalletItem?> GetWithDetails(int id)
        {
            return await _context.PalletItems
                .Include(pi => pi.Pallet)
                .Include(pi => pi.Product)
                .FirstOrDefaultAsync(pi => pi.Id == id);
        }

        public async Task<List<PalletItem>> GetByPalletId(int palletId)
        {
            return await _context.PalletItems
                .Include(pi => pi.Product)
                .Where(pi => pi.PalletId == palletId)
                .ToListAsync();
        }

        public async Task<List<PalletItem>> GetByProductId(int productId)
        {
            return await _context.PalletItems
                .Include(pi => pi.Pallet)
                .Where(pi => pi.ProductId == productId)
                .ToListAsync();
        }
    }
}