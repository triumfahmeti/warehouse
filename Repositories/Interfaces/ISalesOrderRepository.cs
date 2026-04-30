using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.Models;
using Warehouse.Services.Interfaces;

namespace Warehouse.Repositories.Interfaces
{
    public interface ISalesOrderRepository : IGenericRepository<SalesOrder>
    {
        Task<SalesOrder?> GetOrderWithItems(int salesOrderId);
    }
}