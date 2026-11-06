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
        private readonly IRealtimeNotifier _realtime;

        public PurchaseOrderService(
            IPurchaseOrderRepository purchaseOrderRepository,
            IInventoryService inventoryService,
            AppDbContext context,
            IRealtimeNotifier realtime)
        {
            _purchaseOrderRepository = purchaseOrderRepository;
            _inventoryService = inventoryService;
            _context = context;
            _realtime = realtime;
        }

        public async Task<List<PurchaseOrderDto>> GetAllAsync()
        {
            var orders = await _context.PurchaseOrders
                .Include(o => o.Supplier)
                .Include(o => o.Items).ThenInclude(i => i.Product)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return orders.Select(MapToDto).ToList();
        }

        public async Task<PurchaseOrderDto?> GetByIdAsync(int purchaseOrderId)
        {
            var order = await _context.PurchaseOrders
                .Include(o => o.Supplier)
                .Include(o => o.Items).ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == purchaseOrderId);

            return order == null ? null : MapToDto(order);
        }

        private static PurchaseOrderDto MapToDto(PurchaseOrder o) => new PurchaseOrderDto
        {
            Id = o.Id,
            SupplierId = o.SupplierId,
            SupplierName = o.Supplier?.Name,
            OrderDate = o.OrderDate,
            ExpectedDeliveryDate = o.ExpectedDeliveryDate,
            Status = o.Status.ToString(),
            TotalAmount = o.Items?.Sum(i => i.Quantity * i.UnitPrice) ?? 0,
            Items = o.Items?.Select(i => new PurchaseOrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                ReceivedQuantity = i.ReceivedQuantity,
                RemainingQuantity = i.RemainingQuantity,
            }).ToList() ?? new List<PurchaseOrderItemDto>()
        };

        public async Task<int> CreatePurchaseOrder(int supplierId, DateTime? expectedDeliveryDate, List<CreatePurchaseOrderItemDto> items)
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
            if (items.Select(i => i.ProductId).Distinct().Count() != items.Count)
                throw new InvalidOperationException("A product can only appear once in the order items.");

            var order = new PurchaseOrder
            {
                SupplierId = supplierId,
                ExpectedDeliveryDate = expectedDeliveryDate,
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
            await _realtime.ResourceChangedAsync("purchaseorders");
            return order.Id;
        }

        public async Task ReceiveLineAsync(int purchaseOrderId, ReceivePurchaseOrderItemDto dto)
        {
            if (dto.QuantityReceived <= 0)
                throw new InvalidOperationException("Quantity received must be greater than zero");

            using var transaction = await _context.Database.BeginTransactionAsync();
            int productId;
            try
            {
                // Të ngarkuar me tracking, që ndryshimet të ruhen dhe RowVersion të kontrollohet
                var order = await _purchaseOrderRepository.GetOrderWithItems(purchaseOrderId)
                    ?? throw new InvalidOperationException("Purchase order not found");

                if (order.Status is PurchaseOrderStatus.Cancelled
                                 or PurchaseOrderStatus.Received
                                 or PurchaseOrderStatus.Closed)
                    throw new InvalidOperationException("Order cannot be received in its current status.");

                var line = order.Items.FirstOrDefault(i => i.Id == dto.PurchaseOrderItemId)
                    ?? throw new InvalidOperationException("Received line not found in the purchase order");

                if (dto.QuantityReceived > line.RemainingQuantity)
                    throw new InvalidOperationException(
                        $"Quantity received {dto.QuantityReceived} exceeds the remaining quantity ({line.RemainingQuantity}).");

                productId = line.ProductId;

                // Stoku dhe StockMovement shtohen në të njëjtin transaksion
                await _inventoryService.IncreaseStockCore(
                    line.ProductId, dto.RaftId, dto.QuantityReceived);

                line.ReceivedQuantity += dto.QuantityReceived;
                order.LastReceivedAt = DateTime.UtcNow;
                order.Status = order.Items.All(i => i.RemainingQuantity == 0)
                    ? PurchaseOrderStatus.Received
                    : PurchaseOrderStatus.Receiving;

                // Këtu kontrollohet RowVersion. Dy pranime paralele të së njëjtës porosi
                // njëri dështon, dhe transaksioni i tij rrotullohet mbrapsht.
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync();
                throw new InvalidOperationException(
                    "Order has been updated by another user. Please refresh and try again.");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }

            await _realtime.ResourceChangedAsync("purchaseorders", "inventory", "products");
            await _inventoryService.CheckLowStockForProduct(productId);
        }

        public async Task CancelPurchaseOrder(int purchaseOrderId)
        {
            var order = await _purchaseOrderRepository.GetOrderWithItems(purchaseOrderId);

            if (order == null)
            {
                throw new InvalidOperationException("Purchase order not found");
            }

            if (order.Status is not (PurchaseOrderStatus.Pending or PurchaseOrderStatus.Approved))
                throw new InvalidOperationException(
                    $"Order with status '{order.Status}' cannot be cancelled.");

            order.Status = PurchaseOrderStatus.Cancelled;
            await _purchaseOrderRepository.UpdateAsync(order);
            await _context.SaveChangesAsync();
            await _realtime.ResourceChangedAsync("purchaseorders");
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
            await _realtime.ResourceChangedAsync("purchaseorders");
        }


    }
}
