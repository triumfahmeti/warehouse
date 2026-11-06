using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class InventoryRepository : GenericRepository<Inventory>, IInventoryRepository
    {
        private readonly AppDbContext _context;

        public InventoryRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Inventory?> GetInventoryByProductAndRaft(int productId, int raftId)
        {
            return await _context.Inventories
            .FirstOrDefaultAsync(i => i.ProductId == productId && i.RaftId == raftId);
        }

        public async Task<int> GetAvailableStock(int productId)
        {
            return await _context.Inventories
                .Where(i => i.ProductId == productId)
                .SumAsync(i => i.QuantityOnHand - i.ReservedQuantity);
        }

        public async Task<List<Inventory>> GetInventoriesByProduct(int productId)
        {
            return await _context.Inventories
                .Where(i => i.ProductId == productId)
                .ToListAsync();
        }

        public async Task<List<Inventory>> GetInventoriesWithRaftByProduct(int productId)
        {
            return await _context.Inventories
                .Include(i => i.Raft)
                    .ThenInclude(r => r.Warehouse)
                .Include(i => i.Product)
                .Where(i => i.ProductId == productId && i.ReservedQuantity > 0)
                .ToListAsync();
        }

        public async Task<int> ReserveStockAtomicAsync(int inventoryId, int quantityToReserve)
        {
            // Query filter-i nuk aplikohet ne SQL raw — tenanti filtrohet manualisht.
            return await _context.Database.ExecuteSqlRawAsync(@"
        UPDATE Inventories 
        SET ReservedQuantity = ReservedQuantity + {0} 
        WHERE Id = {1} AND TenantId = {2} AND (QuantityOnHand - ReservedQuantity) >= {0}",
                quantityToReserve, inventoryId, _context.CurrentTenantId);
        }

        public async Task<int> ReleaseReservedStockAtomicAsync(int inventoryId, int quantityToRelease)
        {
            return await _context.Database.ExecuteSqlRawAsync(@"
        UPDATE Inventories 
        SET ReservedQuantity = ReservedQuantity - {0} 
        WHERE Id = {1} AND TenantId = {2} AND ReservedQuantity >= {0}",
                quantityToRelease, inventoryId, _context.CurrentTenantId);
        }

        public Task<bool> RaftExistsAsync(int raftId)
            => _context.Rafts.AnyAsync(r => r.Id == raftId);







    }
}