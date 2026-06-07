using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.PackingList;
using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;



namespace Warehouse.Services.Implementations
{
    public class PackingListService : IPackingListService
    {
        private readonly ISalesOrderRepository _orderRepository;
        private readonly IGenericRepository<Pallet> _palletRepository;
        private readonly IGenericRepository<PackingList> _packingListRepository;
        private readonly IGenericRepository<PackingListPallet> _packingListPalletRepository;
        private readonly AppDbContext _context;
        private readonly IRealtimeNotifier _realtime;

        public PackingListService(
            ISalesOrderRepository orderRepository,
            IGenericRepository<Pallet> palletRepository,
            IGenericRepository<PackingList> packingListRepository,
            IGenericRepository<PackingListPallet> packingListPalletRepository,
            AppDbContext context,
            IRealtimeNotifier realtime)
        {
            _orderRepository = orderRepository;
            _palletRepository = palletRepository;
            _packingListRepository = packingListRepository;
            _packingListPalletRepository = packingListPalletRepository;
            _context = context;
            _realtime = realtime;
        }
   public async Task<List<PackingList>> GetAllAsync()
{
    return await _context.PackingLists
        .Include(pl => pl.Warehouse)
        .Include(pl => pl.SalesOrder)
            .ThenInclude(so => so.Client)
        .AsNoTracking()
        .ToListAsync();
}
    public async Task<PackingList?> GetByIdAsync(int id)
    {
        return await _context.PackingLists.FindAsync(id);
    }

    public async Task<PackingList> CreateAsync(CreateEditPackingListDto dto)
    {
        // Packing list krijohet vetëm për porosi në Processing (pallet-at janë krijuar,
        // ende e padorëzuar). Kjo bllokon Cancelled, Completed, New dhe Confirmed.
        var order = await _context.SalesOrders.FindAsync(dto.SalesOrderId)
            ?? throw new InvalidOperationException("Order not found");

        if (order.Status != SalesOrderStatus.Processing)
            throw new InvalidOperationException(
                "Packing lists can be created only for orders in Processing status (pallets created, not yet delivered).");

        // Një packing list ka kuptim vetëm me pallet. Marrim pallet-at e kësaj porosie
        // që s'janë caktuar ende në ndonjë packing list dhe i bashkojmë automatikisht.
        var assignedPalletIds = await _context.PackingListPallets
            .Select(plp => plp.PalletId)
            .ToListAsync();

        var orderPallets = await _context.Pallets
            .Where(p => p.SalesOrderId == dto.SalesOrderId && !assignedPalletIds.Contains(p.Id))
            .ToListAsync();

        if (orderPallets.Count == 0)
            throw new InvalidOperationException(
                "This order has no unassigned pallets. Create pallets for the order first.");

        // Warehouse-i derivohet nga raftet ku ndodhen fizikisht pallet-at (raft → warehouse).
        // Nuk zgjidhet manualisht. Nëse pallet-at janë në depo të ndryshme, s'mund të
        // grupohen në një packing list / një shipment të vetëm.
        var palletIds = orderPallets.Select(p => p.Id).ToList();
        var warehouseIds = await _context.PalletItems
            .Where(pi => palletIds.Contains(pi.PalletId) && pi.RaftId != null)
            .Select(pi => pi.Raft!.WarehouseId)
            .Distinct()
            .ToListAsync();

        if (warehouseIds.Count == 0)
            throw new InvalidOperationException(
                "Cannot determine the warehouse: these pallets have no raft information.");
        if (warehouseIds.Count > 1)
            throw new InvalidOperationException(
                "These pallets are stored in multiple warehouses and cannot be grouped into one packing list.");

        var packingList = new PackingList
        {
            WarehouseId = warehouseIds[0],
            SalesOrderId = dto.SalesOrderId,
            Notes = dto.Notes,
            PackingListNumber = $"PL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
            Status = PackingListStatus.Draft
        };

        await _packingListRepository.AddAsync(packingList);
        await _context.SaveChangesAsync();

        foreach (var pallet in orderPallets)
        {
            await _packingListPalletRepository.AddAsync(new PackingListPallet
            {
                PackingListId = packingList.Id,
                PalletId = pallet.Id
            });
        }

        await _context.SaveChangesAsync();
        await _realtime.ResourceChangedAsync("packinglists");

        return packingList;
    }

    public async Task UpdateAsync(int id, CreateEditPackingListDto dto)
    {
        var packingList = await _context.PackingLists.FindAsync(id);

        if (packingList == null)
            throw new Exception("Packing list not found");

        packingList.WarehouseId = dto.WarehouseId;
        packingList.SalesOrderId = dto.SalesOrderId;

        await _context.SaveChangesAsync();
        await _realtime.ResourceChangedAsync("packinglists");
    }

    public async Task MarkAsReadyAsync(int id)
    {
        var packingList = await _context.PackingLists.FindAsync(id);

        if (packingList == null)
            throw new Exception("Packing list not found");

        packingList.Status = PackingListStatus.Ready;

        await _context.SaveChangesAsync();
        await _realtime.ResourceChangedAsync("packinglists");
    }

    public async Task CancelAsync(int id)
    {
        var packingList = await _context.PackingLists.FindAsync(id);

        if (packingList == null)
            throw new Exception("Packing list not found");

        // Closed = nisur tashmë (auto nga shipment); s'mund të anulohet.
        if (packingList.Status == PackingListStatus.Closed)
            throw new InvalidOperationException("Cannot cancel a packing list whose shipment has already been sent.");

        packingList.Status = PackingListStatus.Cancelled;
        await _context.SaveChangesAsync();
        await _realtime.ResourceChangedAsync("packinglists");
    }


        public async Task<int> CreatePackingList(CreatePackingListDto dto)
        {
            var order = await _orderRepository.GetOrderWithItems(dto.SalesOrderId);

            if (order == null)
                throw new InvalidOperationException("Order not found");

            if (order.Status != SalesOrderStatus.Confirmed)
                throw new InvalidOperationException("Order must be confirmed");

            if (dto.PalletIds == null || !dto.PalletIds.Any())
                throw new InvalidOperationException("No pallets selected");

            var pallets = new List<Pallet>();

            foreach (var palletId in dto.PalletIds.Distinct())
            {
                var pallet = await _palletRepository.GetByIdAsync(palletId);

                if (pallet == null)
                    throw new InvalidOperationException($"Pallet {palletId} not found");

                if (pallet.SalesOrderId != dto.SalesOrderId)
                    throw new InvalidOperationException("Pallet does not belong to this order");

                var alreadyAssigned = await _context.PackingListPallets
                    .AnyAsync(plp => plp.PalletId == palletId);

                if (alreadyAssigned)
                    throw new InvalidOperationException("Pallet already assigned");

                pallets.Add(pallet);
            }

            var packingList = new PackingList
            {
               WarehouseId = dto.WarehouseId,
                SalesOrderId = dto.SalesOrderId,
                Notes = dto.Notes,
                PackingListNumber = $"PL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
                Status = PackingListStatus.Draft
            };

            await _packingListRepository.AddAsync(packingList);
            await _context.SaveChangesAsync();

            foreach (var pallet in pallets)
            {
                await _packingListPalletRepository.AddAsync(new PackingListPallet
                {
                    PackingListId = packingList.Id,
                    PalletId = pallet.Id
                });
            }

            await _context.SaveChangesAsync();
            await _realtime.ResourceChangedAsync("packinglists");

            return packingList.Id;
        }

        public async Task<List<PackingList>> GetAvailableAsync()
        {
            var assignedIds = await _context.Shipments
                .Select(s => s.PackingListId)
                .ToListAsync();

            return await _context.PackingLists
                .Include(pl => pl.Warehouse)
                .Include(pl => pl.SalesOrder)
                    .ThenInclude(so => so.Client)
                .Where(pl => pl.Status == PackingListStatus.Ready && !assignedIds.Contains(pl.Id))
                .ToListAsync();
        }
    }
}
