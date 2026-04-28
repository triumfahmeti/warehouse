using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class InventoryService : IInventoryService
    {
        private readonly IInventoryRepository _inventoryRepository;

        public InventoryService(IInventoryRepository inventoryRepository)
        {
            _inventoryRepository = inventoryRepository;
        }
        public async Task AddStock(int productId, int raftId, int quantity)
        {
            var inventory = await _inventoryRepository.GetInventoryByProductAndRaft(productId, raftId);
            if (inventory == null)
            {
                inventory = new Inventory
                {
                    ProductId = productId,
                    RaftId = raftId,
                    QuantityOnHand = quantity,
                };
                await _inventoryRepository.AddAsync(inventory);
            }
            else
            {
                inventory.QuantityOnHand += quantity;
                await _inventoryRepository.UpdateAsync(inventory);
            }
        }

        public async Task RemoveStock(int productId, int raftId, int quantity)
        {
            var inventory = await _inventoryRepository.GetInventoryByProductAndRaft(productId, raftId);
            if (inventory == null || inventory.QuantityOnHand - inventory.ReservedQuantity < quantity)
            {
                throw new InvalidOperationException("Not enough stock available");
            }
            inventory.QuantityOnHand -= quantity;
            await _inventoryRepository.UpdateAsync(inventory);
        }

        public async Task<int> GetAvailableStock(int productId)
        {
            return await _inventoryRepository.GetAvailableStock(productId);
        }
    }
}