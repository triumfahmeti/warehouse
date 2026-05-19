using Warehouse.DTOs.ShipmentDto;
using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class ShipmentService : IShipmentService
    {
        private readonly IShipmentRepository _shipmentRepository;
        private readonly IPackingListRepository _packingListRepository;
        private readonly AppDbContext _context;

        public ShipmentService(
            IShipmentRepository shipmentRepository,
            IPackingListRepository packingListRepository,
            AppDbContext context)
        {
            _shipmentRepository = shipmentRepository;
            _packingListRepository = packingListRepository;
            _context = context;
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

        public async Task<ShipmentDto> CreateAsync(CreateEditShipmentDto dto)
        {
            var pl = await _packingListRepository.GetByIdAsync(dto.PackingListId)
                ?? throw new InvalidOperationException("PackingList not found");

            if (pl.Status != PackingListStatus.Ready)
                throw new InvalidOperationException("PackingList must be in Ready status");

            var existing = await _shipmentRepository.GetByPackingList(dto.PackingListId);
            if (existing != null)
                throw new InvalidOperationException("A shipment already exists for this packing list");

            var number = $"SHP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

            var shipment = new Shipment
            {
                ShipmentNumber = number,
                PackingListId = dto.PackingListId,
                WarehouseId = dto.WarehouseId,
                Notes = dto.Notes,
                Status = ShipmentStatus.Draft
            };

            await _shipmentRepository.AddAsync(shipment);
            await _context.SaveChangesAsync();
            return ToDto(shipment);
        }

        public async Task UpdateAsync(int id, CreateEditShipmentDto dto)
        {
            var shipment = await _shipmentRepository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("Shipment not found");

            if (shipment.Status is ShipmentStatus.Shipped or ShipmentStatus.Delivered)
                throw new InvalidOperationException("Cannot edit a shipped or delivered shipment");

            shipment.WarehouseId = dto.WarehouseId;
            shipment.Notes = dto.Notes;

            await _shipmentRepository.UpdateAsync(shipment);
            await _context.SaveChangesAsync();
        }

        public async Task MarkAsShippedAsync(int id)
        {
            var shipment = await _shipmentRepository.GetWithDetails(id)
                ?? throw new InvalidOperationException("Shipment not found");

            if (shipment.Status != ShipmentStatus.Ready)
                throw new InvalidOperationException("Shipment must be in Ready status to ship");

            shipment.Status = ShipmentStatus.Shipped;
            shipment.PackingList.Status = PackingListStatus.Closed;

            await _shipmentRepository.UpdateAsync(shipment);
            await _context.SaveChangesAsync();
        }

        public async Task MarkAsDeliveredAsync(int id)
        {
            var shipment = await _shipmentRepository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("Shipment not found");

            if (shipment.Status != ShipmentStatus.Shipped)
                throw new InvalidOperationException("Shipment must be Shipped before marking as Delivered");

            shipment.Status = ShipmentStatus.Delivered;

            await _shipmentRepository.UpdateAsync(shipment);
            await _context.SaveChangesAsync();
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