using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.NotificationDto;
using Warehouse.DTOs.SalesOrder;
using Warehouse.Enums;
using Warehouse.Hubs;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class SalesOrderService : ISalesOrderService
    {
        private readonly ISalesOrderRepository _salesOrderRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IInventoryService _inventoryService;
        private readonly IClientRepository _clientRepository;
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly UserManager<ApplicationUser> _userManager;

        public SalesOrderService(
            ISalesOrderRepository salesOrderRepository,
            IInventoryRepository inventoryRepository,
            IInventoryService inventoryService,
            IClientRepository clientRepository,
            AppDbContext context,
            INotificationService notificationService,
            IHubContext<NotificationHub> hubContext,
            UserManager<ApplicationUser> userManager)
        {
            _salesOrderRepository = salesOrderRepository;
            _inventoryRepository = inventoryRepository;
            _inventoryService = inventoryService;
            _clientRepository = clientRepository;
            _context = context;
            _notificationService = notificationService;
            _hubContext = hubContext;
            _userManager = userManager;
        }

        public async Task<List<SalesOrderDto>> GetAllAsync()
        {
            var orders = await _context.SalesOrders
                .Include(o => o.Client)
                .Include(o => o.SalesOrderItems).ThenInclude(i => i.Product)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
            return orders.Select(MapToDto).ToList();
        }

        public async Task<List<SalesOrderDto>> GetOrdersForUserAsync(string userId)
        {
            var client = await _clientRepository.GetClientByUserIdAsync(userId)
                ?? throw new InvalidOperationException("Client profile not found for this user.");

            var orders = await _context.SalesOrders
                .Include(o => o.Client)
                .Include(o => o.SalesOrderItems).ThenInclude(i => i.Product)
                .Where(o => o.ClientId == client.Id)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
            return orders.Select(MapToDto).ToList();
        }

        public async Task<SalesOrderDto?> GetDtoByIdAsync(int salesOrderId)
        {
            var order = await _context.SalesOrders
                .Include(o => o.Client)
                .Include(o => o.SalesOrderItems).ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == salesOrderId);
            return order == null ? null : MapToDto(order);
        }

        public async Task<int> CreateOrderForUser(string userId, List<CreateOrderItemDto> items)
        {
            var client = await _clientRepository.GetClientByUserIdAsync(userId)
                ?? throw new InvalidOperationException("Client profile not found for this user.");
            return await CreateOrder(client.Id, items);
        }

        public async Task ConfirmOrderForUser(string userId, int salesOrderId)
        {
            var client = await _clientRepository.GetClientByUserIdAsync(userId)
                ?? throw new InvalidOperationException("Client profile not found for this user.");

            var order = await _salesOrderRepository.GetOrderWithItems(salesOrderId)
                ?? throw new InvalidOperationException("Order not found");

            if (order.ClientId != client.Id)
                throw new InvalidOperationException("You can only confirm your own orders.");

            await ConfirmOrder(salesOrderId);
        }

        public async Task CancelOrder(int salesOrderId)
        {
            var order = await _salesOrderRepository.GetOrderWithItems(salesOrderId)
                ?? throw new InvalidOperationException("Order not found");

            // Vetem porosite e pakonfirmuara (New) mund te anulohen. Pas Confirm s'ka anulim.
            if (order.Status != SalesOrderStatus.New)
                throw new InvalidOperationException("Only new (unconfirmed) orders can be cancelled");

            order.Status = SalesOrderStatus.Cancelled;
            await _salesOrderRepository.UpdateAsync(order);
            await _context.SaveChangesAsync();
        }

        public async Task CancelOrderForUser(string userId, int salesOrderId)
        {
            var client = await _clientRepository.GetClientByUserIdAsync(userId)
                ?? throw new InvalidOperationException("Client profile not found for this user.");

            var order = await _salesOrderRepository.GetOrderWithItems(salesOrderId)
                ?? throw new InvalidOperationException("Order not found");

            if (order.ClientId != client.Id)
                throw new InvalidOperationException("You can only cancel your own orders.");

            await CancelOrder(salesOrderId);
        }

        private static SalesOrderDto MapToDto(SalesOrder o) => new SalesOrderDto
        {
            Id = o.Id,
            ClientId = o.ClientId,
            ClientName = o.Client?.FullName,
            OrderDate = o.OrderDate,
            Status = o.Status.ToString(),
            TotalAmount = o.SalesOrderItems.Sum(i => (i.UnitPrice ?? 0) * i.Quantity),
            IsPriced = o.SalesOrderItems.Any() && o.SalesOrderItems.All(i => i.UnitPrice != null),
            Items = o.SalesOrderItems.Select(i => new SalesOrderItemDto
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList()
        };

        public async Task<int> CreateOrder(int clientId, List<CreateOrderItemDto> items)
        {
            if (items == null || !items.Any())
                throw new InvalidOperationException("Order must have items");

            // Kontroll stoku qe ne krijim, qe te shmanget overselling nga porosi te shumta:
            //   available efektiv = stoku fizik i lire − demanda e porosive te tjera ende New
            //   (porosite New nuk kane rezervuar ende; Confirmed-at jane tashme te zbritura nga ReservedQuantity).
            foreach (var item in items)
            {
                if (item.Quantity <= 0)
                    throw new InvalidOperationException("Order items must have quantity greater than zero");

                var physicalAvailable = await _inventoryRepository.GetAvailableStock(item.ProductId);

                var pendingDemand = await _context.SalesOrderItems
                    .Where(soi => soi.ProductId == item.ProductId
                                  && soi.SalesOrder.Status == SalesOrderStatus.New)
                    .SumAsync(soi => soi.Quantity);

                var effectiveAvailable = physicalAvailable - pendingDemand;

                if (effectiveAvailable < item.Quantity)
                {
                    var product = await _context.Products.FindAsync(item.ProductId);
                    var name = product?.Name ?? $"#{item.ProductId}";
                    throw new InvalidOperationException(
                        $"Not enough stock for '{name}'. Available: {Math.Max(0, effectiveAvailable)}, requested: {item.Quantity}.");
                }
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

            // Njoftim te te gjithe Manager-et
            var managers = await _userManager.GetUsersInRoleAsync("Manager");
            foreach (var manager in managers)
            {
                await SendNotification(
                    userId: manager.Id,
                    type: "SalesOrder",
                    title: "New Order",
                    message: $"Client ID {clientId} created a new order with ID {order.Id}."
                );
            }

            return order.Id;
        }

        public async Task SetPrices(int salesOrderId, List<SetPriceDto> items)
        {
            var order = await _salesOrderRepository.GetOrderWithItems(salesOrderId)
                ?? throw new InvalidOperationException("Order not found");

            if (order.Status != SalesOrderStatus.New)
                throw new InvalidOperationException("Only new orders can be priced");

            foreach (var itemDto in items)
            {
                var orderItem = order.SalesOrderItems.FirstOrDefault(i => i.Id == itemDto.SalesOrderItemId)
                    ?? throw new InvalidOperationException($"Order item with id {itemDto.SalesOrderItemId} not found");

                if (itemDto.UnitPrice <= 0)
                    throw new InvalidOperationException("Unit price must be greater than zero");

                orderItem.UnitPrice = itemDto.UnitPrice;
            }

            // Ruajme totalin sa here qe caktohen/ndryshohen cmimet.
            order.TotalAmount = order.SalesOrderItems.Sum(i => (i.UnitPrice ?? 0) * i.Quantity);

            await _salesOrderRepository.UpdateAsync(order);
            await _context.SaveChangesAsync();

            // Njoftim te Clienti: cmimi u caktua
            var client = await _clientRepository.GetByIdAsync(order.ClientId);
            if (client != null)
            {
                var clientUser = await _userManager.FindByEmailAsync(client.Email);
                if (clientUser != null)
                {
                    var totalAmount = order.SalesOrderItems.Sum(i => (i.UnitPrice ?? 0) * i.Quantity);

                    await SendNotification(
                        userId: clientUser.Id,
                        type: "SalesOrder",
                        title: "Order Priced",
                        message: $"Your order ID {salesOrderId} has been priced. Total: {totalAmount:F2}. Please confirm your order."
                    );
                }
            }
        }

        public async Task ConfirmOrder(int salesOrderId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

            try
            {
                var order = await _salesOrderRepository.GetOrderWithItems(salesOrderId)
                    ?? throw new InvalidOperationException("Order not found");

                if (order.SalesOrderItems == null || !order.SalesOrderItems.Any())
                    throw new InvalidOperationException("Order has no items");

                if (order.SalesOrderItems.Any(i => i.UnitPrice == null))
                    throw new InvalidOperationException("Order not priced");

                if (order.Status != SalesOrderStatus.New)
                    throw new InvalidOperationException("Only new orders can be confirmed");

                if (order.SalesOrderItems.Any(i => i.Quantity <= 0))
                    throw new InvalidOperationException("Order items must have quantity greater than zero");

                order.Status = SalesOrderStatus.Confirmed;
                await _salesOrderRepository.UpdateAsync(order);
                await _context.SaveChangesAsync();

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

                // Njoftim te Manager-et: order u konfirmua nga clienti
                var managers = await _userManager.GetUsersInRoleAsync("Manager");
                foreach (var manager in managers)
                {
                    await SendNotification(
                        userId: manager.Id,
                        type: "SalesOrder",
                        title: "Order Confirmed",
                        message: $"Order ID {salesOrderId} has been confirmed by the client."
                    );
                }
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<SalesOrder> GetById(int salesOrderId)
        {
            return await _salesOrderRepository.GetOrderWithItems(salesOrderId)
                ?? throw new InvalidOperationException("Order not found");
        }

        private async Task SendNotification(string userId, string type, string title, string message)
        {
            var notification = await _notificationService.CreateAsync(new CreateEditNotificationDto
            {
                UserId = userId,
                Type = type,
                Title = title,
                Message = message
            });

            await _hubContext.Clients.All.SendAsync("ReceiveNotification", notification);
        }
    }
}