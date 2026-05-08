using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class InventoryService : IInventoryService
    {
        private readonly IInventoryRepository _inventoryRepository;
        private readonly ISalesOrderRepository _salesOrderRepository;
        private readonly AppDbContext _context;

        public InventoryService(IInventoryRepository inventoryRepository, ISalesOrderRepository salesOrderRepository, AppDbContext context)
        {
            _inventoryRepository = inventoryRepository;
            _salesOrderRepository = salesOrderRepository;
            _context = context;
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
                await _context.SaveChangesAsync();
            }
            else
            {
                inventory.QuantityOnHand += quantity;
                await _inventoryRepository.UpdateAsync(inventory);
                await _context.SaveChangesAsync();
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
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetAvailableStock(int productId)
        {
            return await _inventoryRepository.GetAvailableStock(productId);
        }

        public async Task ReserveStock(int salesOrderId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

            try
            {
                var order = await _salesOrderRepository.GetOrderWithItems(salesOrderId);

                if (order == null)
                    throw new InvalidOperationException("Sales order not found");

                if (order.Status != SalesOrderStatus.Confirmed)
                    throw new InvalidOperationException("Order must be in Confirmed status");

                foreach (var item in order.SalesOrderItems)
                {
                    var reserved = 0;
                    var inventories = await _inventoryRepository
                        .GetInventoriesByProduct(item.ProductId);

                    foreach (var inv in inventories.OrderBy(i => i.Id))
                    {
                        if (reserved >= item.Quantity)
                            break;

                        var available = inv.QuantityOnHand - inv.ReservedQuantity;
                        var toReserve = Math.Min(available, item.Quantity - reserved);

                        if (toReserve > 0)
                        {
                            var rowsUpdated = await _inventoryRepository
                                .ReserveStockAtomicAsync(inv.Id, toReserve);

                            if (rowsUpdated > 0)
                                reserved += toReserve;
                        }
                    }

                    if (reserved < item.Quantity)
                        throw new InvalidOperationException(
                            $"Not enough stock for product {item.ProductId}");
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}