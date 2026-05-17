using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class RaftRepository : GenericRepository<Raft>, IRaftRepository
    {
        private readonly AppDbContext _context;

        public RaftRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Raft?> GetWithDetails(int id)
        {
            return await _context.Rafts
                .Include(r => r.Warehouse)
                .Include(r => r.Inventories)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<List<Raft>> GetAllWithDetails()
        {
            return await _context.Rafts
                .Include(r => r.Warehouse)
                .Include(r => r.Inventories)
                .ToListAsync();
        }

        public async Task<List<Raft>> GetByWarehouseId(int warehouseId)
        {
            return await _context.Rafts
                .Include(r => r.Warehouse)
                .Where(r => r.WarehouseId == warehouseId)
                .ToListAsync();
        }

        public async Task<Raft?> GetByRaftNumber(string raftNumber)
        {
            return await _context.Rafts
                .Include(r => r.Warehouse)
                .FirstOrDefaultAsync(r => r.RaftNumber == raftNumber);
        }
    }
}