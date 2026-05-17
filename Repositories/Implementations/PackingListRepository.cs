using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class PackingListRepository : GenericRepository<PackingList>, IPackingListRepository
    {
        private readonly AppDbContext _context;

        public PackingListRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<PackingList?> GetWithPalletsAndOrder(int id)
        {
            return await _context.PackingLists
                .Include(pl => pl.Pallets)
                    .ThenInclude(p => p.Pallet)
                .Include(pl => pl.SalesOrder)
                    .ThenInclude(so => so.SalesOrderItems)
                .Include(pl => pl.Warehouse)
                .FirstOrDefaultAsync(pl => pl.Id == id);
        }

        public async Task<List<PackingList>> GetBySalesOrder(int salesOrderId)
        {
            return await _context.PackingLists
                .Include(pl => pl.Pallets)
                .Where(pl => pl.SalesOrderId == salesOrderId)
                .ToListAsync();
        }

        public async Task<List<PackingList>> GetAllWithDetails()
        {
            return await _context.PackingLists
                .Include(pl => pl.SalesOrder)
                .Include(pl => pl.Warehouse)
                .Include(pl => pl.Pallets)
                .OrderByDescending(pl => pl.CreatedAt)
                .ToListAsync();
        }
    }
}