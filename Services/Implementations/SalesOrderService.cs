using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.DTOs.SalesOrder;
using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class SalesOrderService : ISalesOrderService
    {
        private readonly ISalesOrderRepository _salesOrderRepository;
        private readonly IInventoryService _inventoryService;
        private readonly AppDbContext _context;

        public SalesOrderService(ISalesOrderRepository salesOrderRepository, IInventoryService inventoryService, AppDbContext context)
        {
            _salesOrderRepository = salesOrderRepository;
            _inventoryService = inventoryService;
            _context = context;
        }

        public async Task<int> CreateOrder(int clientId, List<CreateOrderItemDto> items)
        {
            if (items == null || !items.Any())
            {
                throw new InvalidOperationException("Order must have items");
            }
            var order = new SalesOrder
            {
                ClientId = clientId,
                Status = SalesOrderStatus.New,
                SalesOrderItems = items.Select(i => new SalesOrderItem
                {
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    UnitPrice = null
                }).ToList()
            };

            await _salesOrderRepository.AddAsync(order);
            await _context.SaveChangesAsync();
            return order.Id;
        }

        public async Task SetPrices(int salesOrderId, List<SetPriceDto> items)
        {
            var order = await _salesOrderRepository.GetOrderWithItems(salesOrderId);

            if (order == null)
            {
                throw new InvalidOperationException("Order not found");
            }

            if (order.Status != SalesOrderStatus.New)
            {
                throw new InvalidOperationException("Only new orders can be priced");
            }

            foreach (var itemDto in items)
            {
                var orderItem = order.SalesOrderItems.FirstOrDefault(i => i.Id == itemDto.SalesOrderItemId);

                if (orderItem == null)
                {
                    throw new InvalidOperationException($"Order item with id {itemDto.SalesOrderItemId} not found");
                }
                if (itemDto.UnitPrice <= 0)
                {
                    throw new InvalidOperationException("Unit price must be greater than zero");
                }
                orderItem.UnitPrice = itemDto.UnitPrice;
            }
            await _salesOrderRepository.UpdateAsync(order);
            await _context.SaveChangesAsync();
        }

        public async Task ConfirmOrder(int salesOrderId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var order = await _salesOrderRepository.GetOrderWithItems(salesOrderId);

                if (order == null)
                {
                    throw new InvalidOperationException("Order not found");
                }

                if (order.SalesOrderItems == null || !order.SalesOrderItems.Any())
                {
                    throw new InvalidOperationException("Order have no items");
                }
                if (order.SalesOrderItems.Any(i => i.UnitPrice == null))
                    throw new Exception("Order not priced");

                if (order.Status != SalesOrderStatus.New)
                {
                    throw new InvalidOperationException("Only new orders can be confirmed");
                }

                if (order.SalesOrderItems.Any(i => i.Quantity <= 0))
                {
                    throw new InvalidOperationException("Order items must have quantity greater than zero");
                }

                order.Status = SalesOrderStatus.Confirmed;
                await _salesOrderRepository.UpdateAsync(order);

                await _inventoryService.ReserveStock(salesOrderId);

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
            }

            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<SalesOrder> GetById(int salesOrderId)
        {
            var order = await _salesOrderRepository.GetOrderWithItems(salesOrderId);
            if (order == null)
            {
                throw new InvalidOperationException("Order not found");
            }
            return order;
        }

    }
}
