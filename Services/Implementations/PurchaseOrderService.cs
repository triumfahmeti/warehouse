using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.PurchaseOrder;
using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly IPurchaseOrderRepository _purchaseOrderRepository;
        private readonly IInventoryService _inventoryService;
        private readonly AppDbContext _context;

        public PurchaseOrderService(
            IPurchaseOrderRepository purchaseOrderRepository,
            IInventoryService inventoryService,
            AppDbContext context)
        {
            _purchaseOrderRepository = purchaseOrderRepository;
            _inventoryService = inventoryService;
            _context = context;
        }

        public async Task<int> CreatePurchaseOrder(int supplierId, List<CreatePurchaseOrderItemDto> items)
        {
            if (items == null || items.Count == 0)
            {
                throw new InvalidOperationException("Purchase order must have items");
            }

            var supplierExists = await _context.Suppliers.AnyAsync(s => s.Id == supplierId);
            if (!supplierExists)
            {
                throw new InvalidOperationException("Supplier not found");
            }

            if (items.Any(i => i.Quantity <= 0))
            {
                throw new InvalidOperationException("Order items must have quantity greater than zero");
            }

            if (items.Any(i => i.UnitPrice <= 0))
            {
                throw new InvalidOperationException("Unit price must be greater than zero");
            }

            var order = new PurchaseOrder
            {
                SupplierId = supplierId,
                Status = PurchaseOrderStatus.Pending,
                Items = items.Select(i => new PurchaseOrderItem
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice
                }).ToList()
            };

            await _purchaseOrderRepository.AddAsync(order);
            await _context.SaveChangesAsync();
            return order.Id;
        }

        public async Task ApprovePurchaseOrder(int purchaseOrderId)
        {
            var order = await _purchaseOrderRepository.GetOrderWithItems(purchaseOrderId);

            if (order == null)
            {
                throw new InvalidOperationException("Purchase order not found");
            }

            if (order.Status != PurchaseOrderStatus.Pending)
            {
                throw new InvalidOperationException("Only pending orders can be approved");
            }

            if (order.Items == null || !order.Items.Any())
            {
                throw new InvalidOperationException("Purchase order has no items");
            }

            order.Status = PurchaseOrderStatus.Approved;
            await _purchaseOrderRepository.UpdateAsync(order);
            await _context.SaveChangesAsync();
        }

        public async Task ReceivePurchaseOrder(int purchaseOrderId, List<ReceivePurchaseOrderItemDto> items)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                await AddReceivedStock(purchaseOrderId, items);

                var order = await _purchaseOrderRepository.GetOrderWithItems(purchaseOrderId);
                if (order == null)
                {
                    throw new InvalidOperationException("Purchase order not found");
                }

                if (order.Status != PurchaseOrderStatus.Approved)
                {
                    throw new InvalidOperationException("Only approved orders can be received");
                }

                order.Status = PurchaseOrderStatus.Received;
                await _purchaseOrderRepository.UpdateAsync(order);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task CancelPurchaseOrder(int purchaseOrderId)
        {
            var order = await _purchaseOrderRepository.GetOrderWithItems(purchaseOrderId);

            if (order == null)
            {
                throw new InvalidOperationException("Purchase order not found");
            }

            if (order.Status == PurchaseOrderStatus.Received || order.Status == PurchaseOrderStatus.Closed)
            {
                throw new InvalidOperationException("Received or closed orders cannot be cancelled");
            }

            order.Status = PurchaseOrderStatus.Cancelled;
            await _purchaseOrderRepository.UpdateAsync(order);
            await _context.SaveChangesAsync();
        }

        public async Task ClosePurchaseOrder(int purchaseOrderId)
        {
            var order = await _purchaseOrderRepository.GetOrderWithItems(purchaseOrderId);

            if (order == null)
            {
                throw new InvalidOperationException("Purchase order not found");
            }

            if (order.Status != PurchaseOrderStatus.Received)
            {
                throw new InvalidOperationException("Only received orders can be closed");
            }

            order.Status = PurchaseOrderStatus.Closed;
            await _purchaseOrderRepository.UpdateAsync(order);
            await _context.SaveChangesAsync();
        }

        public async Task AddReceivedStock(int purchaseOrderId, List<ReceivePurchaseOrderItemDto> items)
        {
            if (items == null || items.Count == 0)
            {
                throw new InvalidOperationException("Received items are required");
            }

            var order = await _purchaseOrderRepository.GetOrderWithItems(purchaseOrderId);
            if (order == null)
            {
                throw new InvalidOperationException("Purchase order not found");
            }

            if (order.Status != PurchaseOrderStatus.Approved)
            {
                throw new InvalidOperationException("Only approved orders can add received stock");
            }

            if (order.Items == null || !order.Items.Any())
            {
                throw new InvalidOperationException("Purchase order has no items");
            }

            if (items.Any(i => i.QuantityReceived <= 0))
            {
                throw new InvalidOperationException("Received quantity must be greater than zero");
            }

            var quantitiesByItem = items
                .GroupBy(i => i.PurchaseOrderItemId)
                .ToDictionary(g => g.Key, g => g.Sum(x => x.QuantityReceived));

            foreach (var orderItem in order.Items)
            {
                if (!quantitiesByItem.TryGetValue(orderItem.Id, out var receivedQty))
                {
                    throw new InvalidOperationException("Received items must include all order items");
                }

                if (receivedQty != orderItem.Quantity)
                {
                    throw new InvalidOperationException(
                        $"Received quantity must match ordered quantity for item {orderItem.Id}");
                }
            }

            foreach (var receiveItem in items)
            {
                var orderItem = order.Items.FirstOrDefault(i => i.Id == receiveItem.PurchaseOrderItemId);
                if (orderItem == null)
                {
                    throw new InvalidOperationException(
                        $"Order item with id {receiveItem.PurchaseOrderItemId} not found");
                }

                await _inventoryService.AddStock(orderItem.ProductId, receiveItem.RaftId, receiveItem.QuantityReceived);
            }
        }
    }
}
