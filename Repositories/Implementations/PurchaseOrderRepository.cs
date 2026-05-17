using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class PurchaseOrderRepository : GenericRepository<PurchaseOrder>, IPurchaseOrderRepository
    {
        private readonly AppDbContext _context;

        public PurchaseOrderRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<PurchaseOrder?> GetOrderWithItems(int purchaseOrderId)
        {
            return await _context.PurchaseOrders
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == purchaseOrderId);
        }
    }
}
