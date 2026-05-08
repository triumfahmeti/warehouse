using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class SalesOrderRepository : GenericRepository<SalesOrder>, ISalesOrderRepository
    {
        private readonly AppDbContext _context;

        public SalesOrderRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<SalesOrder?> GetOrderWithItems(int salesOrderId)
        {
            return await _context.SalesOrders
                .Include(o => o.SalesOrderItems)
                .FirstOrDefaultAsync(o => o.Id == salesOrderId);
        }
    }
}