using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Warehouse.DTOs.NotificationDto;
using Warehouse.DTOs.ShipmentDto;
using Warehouse.Enums;
using Warehouse.Hubs;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class ShipmentService : IShipmentService
    {
        private readonly IShipmentRepository _shipmentRepository;
        private readonly IPackingListRepository _packingListRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly UserManager<ApplicationUser> _userManager;

        public ShipmentService(
            IShipmentRepository shipmentRepository,
            IPackingListRepository packingListRepository,
            IInventoryRepository inventoryRepository,
            AppDbContext context,
            INotificationService notificationService,
            IHubContext<NotificationHub> hubContext,
            UserManager<ApplicationUser> userManager)
        {
            _shipmentRepository = shipmentRepository;
            _packingListRepository = packingListRepository;
            _inventoryRepository = inventoryRepository;
            _context = context;
            _notificationService = notificationService;
            _hubContext = hubContext;
            _userManager = userManager;
        }

        public async Task<List<ShipmentDto>> GetAllAsync()
        {
            var list = await _shipmentRepository.GetAllWithDetails();
            return list.Select(s => ToDto(s)).ToList();
        }

        public async Task<ShipmentDto?> GetByIdAsync(int id)
        {
            var shipment = await _shipmentRepository.GetWithDetails(id);
            return shipment == null ? null : ToDto(shipment);
        }

        public async Task<int> CreateShipment(CreateEditShipmentDto dto)
        {
            var packingList = await _packingListRepository.GetByIdAsync(dto.PackingListId)
                ?? throw new InvalidOperationException("Packing list not found");

            if (packingList.Status != PackingListStatus.Ready)
                throw new InvalidOperationException("Packing list must be Ready");

            var shipment = new Shipment
            {
                PackingListId = dto.PackingListId,
                WarehouseId = dto.WarehouseId,
                ShipmentNumber = $"SHP-{dto.WarehouseId}-{DateTime.UtcNow.Ticks}",
                Status = ShipmentStatus.Draft,
                Notes = dto.Notes
            };

            await _shipmentRepository.AddAsync(shipment);
            await _context.SaveChangesAsync();
            return shipment.Id;
        }

        public async Task MarkShipmentReady(int shipmentId)
        {
            var shipment = await _shipmentRepository.GetByIdAsync(shipmentId)
                ?? throw new InvalidOperationException("Shipment not found");

            if (shipment.Status != ShipmentStatus.Draft)
                throw new InvalidOperationException("Shipment must be in Draft status");

            shipment.Status = ShipmentStatus.Ready;
            await _shipmentRepository.UpdateAsync(shipment);
            await _context.SaveChangesAsync();
        }

        public async Task Ship(int shipmentId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var shipment = await _shipmentRepository.GetWithDetails(shipmentId)
                    ?? throw new InvalidOperationException("Shipment not found");

                if (shipment.Status != ShipmentStatus.Ready)
                    throw new InvalidOperationException("Shipment must be Ready to ship");

                foreach (var pallet in shipment.PackingList.Pallets)
                {
                    foreach (var item in pallet.Pallet.Items)
                    {
                        var inventories = await _inventoryRepository.GetInventoriesByProduct(item.ProductId);
                        var remaining = item.Quantity;

                        foreach (var inv in inventories.OrderBy(i => i.Id))
                        {
                            if (inv.QuantityOnHand <= 0)
                                continue;

                            var toDeduct = Math.Min(inv.QuantityOnHand, remaining);
                            inv.QuantityOnHand -= toDeduct;
                            await _inventoryRepository.UpdateAsync(inv);
                            remaining -= toDeduct;

                            if (remaining == 0)
                                break;
                        }

                        if (remaining > 0)
                            throw new InvalidOperationException("Stock inconsistency detected");
                    }
                }

                shipment.Status = ShipmentStatus.Shipped;
                await _shipmentRepository.UpdateAsync(shipment);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                // Njoftim te te gjithe Employee-t: dergesa u nis
                var employees = await _userManager.GetUsersInRoleAsync("Employee");
                foreach (var employee in employees)
                {
                    await SendNotification(
                        userId: employee.Id,
                        type: "Shipment",
                        title: "Shipment Shipped",
                        message: $"Shipment {shipment.ShipmentNumber} has been shipped successfully."
                    );
                }
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task Deliver(int shipmentId)
        {
            var shipment = await _shipmentRepository.GetByIdAsync(shipmentId)
                ?? throw new InvalidOperationException("Shipment not found");

            if (shipment.Status != ShipmentStatus.Shipped)
                throw new InvalidOperationException("Shipment must be Shipped before delivering");

            shipment.Status = ShipmentStatus.Delivered;
            await _shipmentRepository.UpdateAsync(shipment);
            await _context.SaveChangesAsync();

            // Njoftim te te gjithe Employee-t: dergesa u dorezua
            var employees = await _userManager.GetUsersInRoleAsync("Employee");
            foreach (var employee in employees)
            {
                await SendNotification(
                    userId: employee.Id,
                    type: "Shipment",
                    title: "Shipment Delivered",
                    message: $"Shipment {shipment.ShipmentNumber} has been delivered."
                );
            }
        }

        public async Task CancelAsync(int id)
        {
            var shipment = await _shipmentRepository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("Shipment not found");

            if (shipment.Status is ShipmentStatus.Shipped or ShipmentStatus.Delivered)
                throw new InvalidOperationException("Cannot cancel a shipped or delivered shipment");

            shipment.Status = ShipmentStatus.Cancelled;
            await _shipmentRepository.UpdateAsync(shipment);
            await _context.SaveChangesAsync();
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

        private static ShipmentDto ToDto(Shipment s) => new()
        {
            Id = s.Id,
            ShipmentNumber = s.ShipmentNumber,
            Status = s.Status.ToString(),
            Notes = s.Notes,
            WarehouseId = s.WarehouseId,
            WarehouseName = s.Warehouse?.Name ?? "",
            PackingListId = s.PackingListId,
            PackingListNumber = s.PackingList?.PackingListNumber ?? "",
        };
    }
}