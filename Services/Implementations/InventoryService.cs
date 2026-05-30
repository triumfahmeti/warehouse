using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.Inventory;
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
        private readonly IHttpContextAccessor _httpContextAccessor;

        public InventoryService(IInventoryRepository inventoryRepository, ISalesOrderRepository salesOrderRepository, AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _inventoryRepository = inventoryRepository;
            _salesOrderRepository = salesOrderRepository;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        private static string BuildStateString(int quantityOnHand, int reservedQuantity)
        {
            return $"QOH:{quantityOnHand};Reserved:{reservedQuantity}";
        }

        private void AddInventoryLog(Inventory inventory, string action, int? quantityDelta, int oldQoh, int oldReserved, int newQoh, int newReserved)
        {
            var userId = _httpContextAccessor?.HttpContext?.User?
                .FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // UserId eshte i detyrueshem (NOT NULL + FK). Pa nje user te identifikuar
            // nuk e shkruajme logun, qe te mos deshtoje ruajtja.
            if (string.IsNullOrEmpty(userId))
                return;

            var ip = _httpContextAccessor?.HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "unknown";
            var actionText = quantityDelta.HasValue ? $"{action} (delta: {quantityDelta.Value})" : action;

            _context.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                IpAddress = ip,
                Action = actionText,
                Entity = "Inventory",
                EntityId = inventory.Id,
                OldValue = BuildStateString(oldQoh, oldReserved),
                NewValue = BuildStateString(newQoh, newReserved)
            });
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

        public async Task TransferStock(int productId, int fromRaftId, int toRaftId, int quantity)
        {
            if (quantity <= 0)
                throw new InvalidOperationException("Quantity must be greater than zero");

            if (fromRaftId == toRaftId)
                throw new InvalidOperationException("Source and destination raft must be different");

            using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

            try
            {
                var fromInventory = await _inventoryRepository.GetInventoryByProductAndRaft(productId, fromRaftId);
                if (fromInventory == null)
                    throw new InvalidOperationException("Source inventory not found");

                var available = fromInventory.QuantityOnHand - fromInventory.ReservedQuantity;
                if (available < quantity)
                    throw new InvalidOperationException("Not enough available stock to transfer");

                var toInventory = await _inventoryRepository.GetInventoryByProductAndRaft(productId, toRaftId);
                var toWasNew = false;
                if (toInventory == null)
                {
                    toInventory = new Inventory
                    {
                        ProductId = productId,
                        RaftId = toRaftId,
                        QuantityOnHand = 0,
                        ReservedQuantity = 0
                    };
                    await _inventoryRepository.AddAsync(toInventory);
                    toWasNew = true;
                }

                var fromOldQoh = fromInventory.QuantityOnHand;
                var fromOldReserved = fromInventory.ReservedQuantity;
                var toOldQoh = toInventory.QuantityOnHand;
                var toOldReserved = toInventory.ReservedQuantity;

                fromInventory.QuantityOnHand -= quantity;
                toInventory.QuantityOnHand += quantity;
                fromInventory.LastUpdated = DateTime.UtcNow;
                toInventory.LastUpdated = DateTime.UtcNow;

                await _inventoryRepository.UpdateAsync(fromInventory);
                if (!toWasNew)
                    await _inventoryRepository.UpdateAsync(toInventory);

                await _context.SaveChangesAsync();

                AddInventoryLog(fromInventory, "TransferStockOut", -quantity, fromOldQoh, fromOldReserved, fromInventory.QuantityOnHand, fromInventory.ReservedQuantity);
                AddInventoryLog(toInventory, "TransferStockIn", quantity, toOldQoh, toOldReserved, toInventory.QuantityOnHand, toInventory.ReservedQuantity);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task AdjustStock(int productId, int raftId, int quantityDelta, string reason)
        {
            if (quantityDelta == 0)
                return;

            using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

            try
            {
                var inventory = await _inventoryRepository.GetInventoryByProductAndRaft(productId, raftId);
                var wasNew = false;

                if (inventory == null)
                {
                    if (quantityDelta < 0)
                        throw new InvalidOperationException("Inventory not found for negative adjustment");

                    inventory = new Inventory
                    {
                        ProductId = productId,
                        RaftId = raftId,
                        QuantityOnHand = 0,
                        ReservedQuantity = 0
                    };
                    await _inventoryRepository.AddAsync(inventory);
                    wasNew = true;
                }

                var oldQoh = inventory.QuantityOnHand;
                var oldReserved = inventory.ReservedQuantity;
                var newQoh = inventory.QuantityOnHand + quantityDelta;

                if (newQoh < inventory.ReservedQuantity)
                    throw new InvalidOperationException("Adjusted quantity cannot be less than reserved quantity");

                inventory.QuantityOnHand = newQoh;
                inventory.LastUpdated = DateTime.UtcNow;

                if (!wasNew)
                    await _inventoryRepository.UpdateAsync(inventory);

                await _context.SaveChangesAsync();

                var action = string.IsNullOrWhiteSpace(reason) ? "AdjustStock" : $"AdjustStock - {reason}";
                AddInventoryLog(inventory, action, quantityDelta, oldQoh, oldReserved, inventory.QuantityOnHand, inventory.ReservedQuantity);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task CycleCount(int productId, int raftId, int countedQuantity)
        {
            if (countedQuantity < 0)
                throw new InvalidOperationException("Counted quantity cannot be negative");

            using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

            try
            {
                var inventory = await _inventoryRepository.GetInventoryByProductAndRaft(productId, raftId);
                var wasNew = false;

                if (inventory == null)
                {
                    inventory = new Inventory
                    {
                        ProductId = productId,
                        RaftId = raftId,
                        QuantityOnHand = 0,
                        ReservedQuantity = 0
                    };
                    await _inventoryRepository.AddAsync(inventory);
                    wasNew = true;
                }

                if (countedQuantity < inventory.ReservedQuantity)
                    throw new InvalidOperationException("Counted quantity cannot be less than reserved quantity");

                var oldQoh = inventory.QuantityOnHand;
                var oldReserved = inventory.ReservedQuantity;

                inventory.QuantityOnHand = countedQuantity;
                inventory.LastUpdated = DateTime.UtcNow;

                if (!wasNew)
                    await _inventoryRepository.UpdateAsync(inventory);

                await _context.SaveChangesAsync();

                var delta = inventory.QuantityOnHand - oldQoh;
                AddInventoryLog(inventory, "CycleCount", delta, oldQoh, oldReserved, inventory.QuantityOnHand, inventory.ReservedQuantity);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task ReleaseReservedStock(int salesOrderId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

            try
            {
                var order = await _salesOrderRepository.GetOrderWithItems(salesOrderId);
                if (order == null)
                    throw new InvalidOperationException("Sales order not found");

                foreach (var item in order.SalesOrderItems)
                {
                    var released = 0;
                    var inventories = await _inventoryRepository.GetInventoriesByProduct(item.ProductId);

                    foreach (var inv in inventories.OrderBy(i => i.Id))
                    {
                        if (released >= item.Quantity)
                            break;

                        if (inv.ReservedQuantity <= 0)
                            continue;

                        var toRelease = Math.Min(inv.ReservedQuantity, item.Quantity - released);
                        if (toRelease <= 0)
                            continue;

                        var rowsUpdated = await _inventoryRepository
                            .ReleaseReservedStockAtomicAsync(inv.Id, toRelease);

                        if (rowsUpdated > 0)
                        {
                            var oldQoh = inv.QuantityOnHand;
                            var oldReserved = inv.ReservedQuantity;
                            inv.ReservedQuantity -= toRelease;
                            inv.LastUpdated = DateTime.UtcNow;

                            AddInventoryLog(inv, "ReleaseReservedStock", -toRelease, oldQoh, oldReserved, inv.QuantityOnHand, inv.ReservedQuantity);
                            released += toRelease;
                        }
                    }

                    if (released < item.Quantity)
                        throw new InvalidOperationException(
                            $"Not enough reserved stock for product {item.ProductId}");
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

        public async Task<List<InventoryMovementDto>> GetInventoryMovements(int productId, DateTime? from = null, DateTime? to = null)
        {
            var inventories = await _context.Inventories
                .Where(i => i.ProductId == productId)
                .ToListAsync();

            if (inventories.Count == 0)
                return new List<InventoryMovementDto>();

            var inventoryIds = inventories.Select(i => i.Id).ToList();
            var inventoryMap = inventories.ToDictionary(i => i.Id, i => i);

            var query = _context.AuditLogs
                .Where(l => l.Entity == "Inventory" && l.EntityId.HasValue && inventoryIds.Contains(l.EntityId.Value));

            if (from.HasValue)
                query = query.Where(l => l.CreatedAt >= from.Value);

            if (to.HasValue)
                query = query.Where(l => l.CreatedAt <= to.Value);

            var logs = await query
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();

            var result = new List<InventoryMovementDto>();

            foreach (var log in logs)
            {
                if (!log.EntityId.HasValue || !inventoryMap.TryGetValue(log.EntityId.Value, out var inv))
                    continue;

                result.Add(new InventoryMovementDto
                {
                    InventoryId = inv.Id,
                    ProductId = inv.ProductId,
                    RaftId = inv.RaftId,
                    Action = log.Action ?? string.Empty,
                    QuantityDelta = null,
                    QuantityOnHand = inv.QuantityOnHand,
                    ReservedQuantity = inv.ReservedQuantity,
                    OldValue = log.OldValue,
                    NewValue = log.NewValue,
                    OccurredAt = log.CreatedAt
                });
            }

            return result;
        }
    }
}