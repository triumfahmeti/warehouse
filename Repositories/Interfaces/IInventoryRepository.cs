using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.Models;
using Warehouse.Services.Interfaces;

namespace Warehouse.Repositories.Interfaces
{
    public interface IInventoryRepository : IGenericRepository<Inventory>
    {
        Task<Inventory?> GetInventoryByProductAndRaft(int productId, int raftId);
        Task<int> GetAvailableStock(int productId);
        Task<List<Inventory>> GetInventoriesByProduct(int productId);
        Task<int> ReserveStockAtomicAsync(int inventoryId, int quantityToReserve);
    }
}