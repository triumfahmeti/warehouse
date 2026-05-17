using Warehouse.Models;
using Warehouse.Services.Interfaces;

namespace Warehouse.Repositories.Interfaces
{
    public interface IPurchaseOrderRepository : IGenericRepository<PurchaseOrder>
    {
        Task<PurchaseOrder?> GetOrderWithItems(int purchaseOrderId);
    }
}
