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
    }
}