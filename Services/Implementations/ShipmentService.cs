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

        public async Task<List<Shipment>> GetAllAsync()
            => await _shipmentRepository.GetAllWithDetails();

        public async Task<Shipment?> GetByIdAsync(int id)
            => await _shipmentRepository.GetWithDetails(id);

        public async Task<Shipment> CreateAsync(int packingListId, int warehouseId, string? notes)
        {
            var pl = await _packingListRepository.GetByIdAsync(packingListId)
                ?? throw new InvalidOperationException("PackingList not found");

            if (pl.Status != PackingListStatus.Ready)
                throw new InvalidOperationException("PackingList must be in Ready status");

            var existing = await _shipmentRepository.GetByPackingList(packingListId);
            if (existing != null)
                throw new InvalidOperationException("A shipment already exists for this packing list");

            var number = $"SHP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

            var shipment = new Shipment
            {
                ShipmentNumber = number,
                PackingListId = packingListId,
                WarehouseId = warehouseId,
                Notes = notes,
                Status = ShipmentStatus.Draft
            };

            await _shipmentRepository.AddAsync(shipment);
            await _context.SaveChangesAsync();
            return shipment;
        }

        public async Task MarkAsShippedAsync(int id)
        {
            var shipment = await _shipmentRepository.GetWithDetails(id)
                ?? throw new InvalidOperationException("Shipment not found");

            if (shipment.Status != ShipmentStatus.Ready)
                throw new InvalidOperationException("Shipment must be in Ready status to ship");

            shipment.Status = ShipmentStatus.Shipped;


            // Shëno PackingList si Shipped gjithashtu
            shipment.PackingList.Status = PackingListStatus.Shipped;

            await _shipmentRepository.UpdateAsync(shipment);
            await _context.SaveChangesAsync();
        }

        public async Task MarkAsDeliveredAsync(int id)
        {
            var shipment = await _shipmentRepository.GetWithDetails(id)
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
                throw new InvalidOperationException("Cannot cancel a shipment that is already shipped or delivered");

            shipment.Status = ShipmentStatus.Cancelled;
            await _shipmentRepository.UpdateAsync(shipment);
            await _context.SaveChangesAsync();
        }
    }
}