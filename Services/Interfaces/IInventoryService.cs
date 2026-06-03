using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.DTOs.Inventory;

namespace Warehouse.Services.Interfaces
{
    public interface IInventoryService
    {
        Task<List<InventoryDto>> GetAllAsync();
        Task AddStock(int productId, int raftId, int quantity);
        Task RemoveStock(int productId, int raftId, int quantity);
        Task<int> GetAvailableStock(int productId);
        Task ReserveStock(int salesOrderId);
        Task TransferStock(int productId, int fromRaftId, int toRaftId, int quantity);
        Task AdjustStock(int productId, int raftId, int quantityDelta, string reason);
        Task CycleCount(int productId, int raftId, int countedQuantity);
        Task ReleaseReservedStock(int salesOrderId);
        Task<List<InventoryMovementDto>> GetInventoryMovements(int productId, DateTime? from = null, DateTime? to = null);
    }
}