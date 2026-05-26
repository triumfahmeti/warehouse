using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.SalesOrder;
using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Warehouse.Hubs;
using Warehouse.DTOs.NotificationDto;

namespace Warehouse.Services.Implementations
{
    public class SalesOrderService : ISalesOrderService
    {
        private readonly ISalesOrderRepository _salesOrderRepository;
          private readonly IInventoryRepository _inventoryRepository;

        private readonly IInventoryService _inventoryService;
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubContext;
       public SalesOrderService(
    ISalesOrderRepository salesOrderRepository,
    IInventoryRepository inventoryRepository,
    IInventoryService inventoryService,
    AppDbContext context,
    INotificationService notificationService,
    IHubContext<NotificationHub> hubContext)
{
    _salesOrderRepository = salesOrderRepository;
    _inventoryRepository = inventoryRepository;

    _inventoryService = inventoryService;
    _context = context;

    _notificationService = notificationService;
    _hubContext = hubContext;
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
            Console.WriteLine("ORDER SAVED");
            var notification = await _notificationService.CreateAsync(new CreateEditNotificationDto
            {
                UserId = "admin",
                Type = "SalesOrder",
                Title = "New Order",
                Message = $"Customer {clientId} created a new order with ID {order.Id}"
            });

            await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
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

        // public async Task ConfirmOrder(int salesOrderId)
        // {
        //     using var transaction = await _context.Database.BeginTransactionAsync();

        //     try
        //     {
        //         var order = await _salesOrderRepository.GetOrderWithItems(salesOrderId);

        //         if (order == null)
        //         {
        //             throw new InvalidOperationException("Order not found");
        //         }

        //         if (order.SalesOrderItems == null || !order.SalesOrderItems.Any())
        //         {
        //             throw new InvalidOperationException("Order have no items");
        //         }
        //         if (order.SalesOrderItems.Any(i => i.UnitPrice == null))
        //             throw new Exception("Order not priced");

        //         if (order.Status != SalesOrderStatus.New)
        //         {
        //             throw new InvalidOperationException("Only new orders can be confirmed");
        //         }

        //         if (order.SalesOrderItems.Any(i => i.Quantity <= 0))
        //         {
        //             throw new InvalidOperationException("Order items must have quantity greater than zero");
        //         }

        //         order.Status = SalesOrderStatus.Confirmed;
        //         await _salesOrderRepository.UpdateAsync(order);

        //         await _inventoryService.ReserveStock(salesOrderId);

        //         await _context.SaveChangesAsync();

        //         await transaction.CommitAsync();
        //     }

        //     catch
        //     {
        //         await transaction.RollbackAsync();
        //         throw;
        //     }
        // }

        public async Task ConfirmOrder(int salesOrderId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

            try
            {
                var order = await _salesOrderRepository.GetOrderWithItems(salesOrderId);

                if (order == null)
                    throw new InvalidOperationException("Order not found");

                if (order.SalesOrderItems == null || !order.SalesOrderItems.Any())
                    throw new InvalidOperationException("Order has no items");

                if (order.SalesOrderItems.Any(i => i.UnitPrice == null))
                    throw new InvalidOperationException("Order not priced");

                if (order.Status != SalesOrderStatus.New)
                    throw new InvalidOperationException("Only new orders can be confirmed");

                if (order.SalesOrderItems.Any(i => i.Quantity <= 0))
                    throw new InvalidOperationException("Order items must have quantity greater than zero");

                // Konfirmo orderin
                order.Status = SalesOrderStatus.Confirmed;
                await _salesOrderRepository.UpdateAsync(order);
                await _context.SaveChangesAsync();

                // Reserve stock direkt këtu — pa transaction të re
                foreach (var item in order.SalesOrderItems)
                {
                    var reserved = 0;
                    var inventories = await _inventoryRepository.GetInventoriesByProduct(item.ProductId);

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
