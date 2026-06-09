using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.Pallet;
using Warehouse.DTOs.PalletItem;
using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;


namespace Warehouse.Services.Implementations
{
    public class PalletService : IPalletService
    {
        private readonly IPalletRepository _repo;
        private readonly ISalesOrderRepository _orderRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly AppDbContext _context;
        private readonly IRealtimeNotifier _realtime;

        public PalletService(
            IPalletRepository repo,
            ISalesOrderRepository orderRepository,
            IInventoryRepository inventoryRepository,
            AppDbContext context,
            IRealtimeNotifier realtime)
        {
            _repo = repo;
            _orderRepository = orderRepository;
            _inventoryRepository = inventoryRepository;
            _context = context;
            _realtime = realtime;
        }

        public async Task<IEnumerable<PalletDto>> GetAllAsync()
        {
            var pallets = await _repo.GetAllWithItems();
            return pallets.Select(MapToDto);
        }

        public async Task<PalletDto?> GetByIdAsync(int id)
        {
            var pallet = await _repo.GetWithItems(id);
            return pallet == null ? null : MapToDto(pallet);
        }

        public async Task<PalletDto?> GetByPalletCodeAsync(string palletCode)
        {
            var pallet = await _repo.GetByPalletCode(palletCode);
            return pallet == null ? null : MapToDto(pallet);
        }

        public async Task<PalletDto> AddAsync(CreateEditPalletDto dto)
        {
            var pallet = new Pallet
            {
                PalletCode = dto.PalletCode,
                PackingType = Enum.Parse<PackagingType>(dto.PackingType!), // string → enum
                SalesOrderId = dto.SalesOrderId
            };

            await _repo.AddAsync(pallet);
            await _context.SaveChangesAsync();
            await _realtime.ResourceChangedAsync("pallets");
            return MapToDto(pallet);
        }

        public async Task UpdateAsync(int id, CreateEditPalletDto dto)
        {
            var pallet = await _repo.GetByIdAsync(id)
                ?? throw new Exception("Pallet not found");

            if (await IsPalletLocked(id))
                throw new InvalidOperationException("Cannot modify a pallet that is part of a packing list.");

            pallet.PalletCode = dto.PalletCode;
            pallet.PackingType = Enum.Parse<PackagingType>(dto.PackingType!); // string → enum

            await _repo.UpdateAsync(pallet);
            await _context.SaveChangesAsync();
            await _realtime.ResourceChangedAsync("pallets");
        }

        public async Task DeleteAsync(int id)
        {
            var pallet = await _repo.GetByIdAsync(id)
                ?? throw new Exception("Pallet not found");

            if (await IsPalletLocked(id))
                throw new InvalidOperationException("Cannot delete a pallet that is part of a packing list.");

            await _repo.DeleteAsync(id);
            await _context.SaveChangesAsync();
            await _realtime.ResourceChangedAsync("pallets");
        }

        // True nëse paleta është caktuar në një packing list ende aktiv (jo Cancelled).
        // Atëherë është "e angazhuar" në procesin e dërgesës dhe s'duhet ndryshuar/fshirë.
        private async Task<bool> IsPalletLocked(int palletId)
        {
            return await _context.PackingListPallets
                .Where(plp => plp.PalletId == palletId)
                .AnyAsync(plp => _context.PackingLists.Any(pl =>
                    pl.Id == plp.PackingListId && pl.Status != PackingListStatus.Cancelled));
        }

        public async Task<OrderPickingPreviewDto?> GetOrderPickingPreviewAsync(int salesOrderId)
        {
            var order = await _context.SalesOrders
                .Include(o => o.Client)
                .Include(o => o.SalesOrderItems)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == salesOrderId);

            if (order == null) return null;

            var items = new List<PickingItemPreviewDto>();

            foreach (var item in order.SalesOrderItems)
            {
                var inventories = await _inventoryRepository
                    .GetInventoriesWithRaftByProduct(item.ProductId);

                var locations = inventories.Select(inv => new RaftLocationDto
                {
                    RaftId       = inv.RaftId,
                    RaftNumber   = inv.Raft?.RaftNumber   ?? $"Raft #{inv.RaftId}",
                    WarehouseName = inv.Raft?.Warehouse?.Name ?? "Unknown",
                    ReservedQuantity = inv.ReservedQuantity,
                }).ToList();

                items.Add(new PickingItemPreviewDto
                {
                    ProductId   = item.ProductId,
                    ProductName = item.Product?.Name ?? $"Product #{item.ProductId}",
                    Quantity    = item.Quantity,
                    Locations   = locations,
                });
            }

            return new OrderPickingPreviewDto
            {
                OrderId    = order.Id,
                ClientName = order.Client?.FullName ?? $"Client #{order.ClientId}",
                Status     = order.Status.ToString(),
                Items      = items,
            };
        }

        public async Task<int> CreatePalletFromOrder(CreatePalletDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            var order = await _orderRepository.GetOrderWithItems(dto.SalesOrderId);

            if (order == null)
                throw new InvalidOperationException("Order not found");

            if (order.Status != SalesOrderStatus.Confirmed)
                throw new InvalidOperationException("Order must be confirmed");

            // Një porosi palletizohet vetëm një herë (e gjithë sasia hyn në paleta).
            if (await _context.Pallets.AnyAsync(p => p.SalesOrderId == dto.SalesOrderId))
                throw new InvalidOperationException("Pallets have already been created for this order.");

            var pallet = new Pallet
            {
                SalesOrderId = dto.SalesOrderId,
                PackingType = dto.PackagingType, // direkt enum → enum
                PalletCode = $"PALT-{dto.SalesOrderId}-{dto.PackagingType}-{DateTime.UtcNow.Ticks}",
                Items = new List<PalletItem>()
            };

            foreach (var item in order.SalesOrderItems)
            {
                var remaining = item.Quantity;

                var inventories = await _inventoryRepository
                    .GetInventoriesByProduct(item.ProductId);

                foreach (var inv in inventories.OrderBy(i => i.Id))
                {
                    if (inv.ReservedQuantity <= 0)
                        continue;

                    var toPick = Math.Min(inv.ReservedQuantity, remaining);

                    inv.ReservedQuantity -= toPick;
                    await _inventoryRepository.UpdateAsync(inv);

                    // Rafti burim merret nga rreshti i inventarit ku ishte rezervuar stoku.
                    pallet.Items.Add(new PalletItem
                    {
                        ProductId = item.ProductId,
                        Quantity = toPick,
                        RaftId = inv.RaftId
                    });

                    remaining -= toPick;

                    if (remaining == 0)
                        break;
                }

                if (remaining > 0)
                    throw new InvalidOperationException("Not enough reserved stock to pick");
            }

            await _repo.AddAsync(pallet);

            // Porosia kalon në Processing sapo krijohen pallet-at për të.
            order.Status = SalesOrderStatus.Processing;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            // Pick-u nga porosia zbret ReservedQuantity → ndryshon edhe inventari.
            await _realtime.ResourceChangedAsync("pallets", "inventory", "salesorders");

            return pallet.Id;
        }

        public async Task<List<int>> CreatePalletsFromOrderSplit(CreatePalletSplitDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            var order = await _orderRepository.GetOrderWithItems(dto.SalesOrderId);

            if (order == null)
                throw new InvalidOperationException("Order not found");

            if (order.Status != SalesOrderStatus.Confirmed)
                throw new InvalidOperationException("Order must be confirmed");

            // Një porosi palletizohet vetëm një herë (e gjithë sasia hyn në paleta).
            if (await _context.Pallets.AnyAsync(p => p.SalesOrderId == dto.SalesOrderId))
                throw new InvalidOperationException("Pallets have already been created for this order.");

            if (dto.ItemsPerPallet <= 0)
                throw new InvalidOperationException("ItemsPerPallet must be greater than zero");

            var palletIds = new List<int>();

            foreach (var item in order.SalesOrderItems)
            {
                var inventories = await _inventoryRepository
                    .GetInventoriesByProduct(item.ProductId);

                var remaining = item.Quantity;

                while (remaining > 0)
                {
                    var toPickThisPallet = Math.Min(dto.ItemsPerPallet, remaining);

                    var pallet = new Pallet
                    {
                        SalesOrderId = dto.SalesOrderId,
                        PackingType = dto.PackagingType,
                        PalletCode = $"PALT-{dto.SalesOrderId}-{dto.PackagingType}-{DateTime.UtcNow.Ticks}-{palletIds.Count + 1}",
                        Items = new List<PalletItem>()
                    };

                    var pickedForPallet = 0;

                    foreach (var inv in inventories.OrderBy(i => i.Id))
                    {
                        if (pickedForPallet >= toPickThisPallet)
                            break;

                        if (inv.ReservedQuantity <= 0)
                            continue;

                        var toPick = Math.Min(inv.ReservedQuantity, toPickThisPallet - pickedForPallet);

                        inv.ReservedQuantity -= toPick;
                        await _inventoryRepository.UpdateAsync(inv);

                        // Rafti burim merret nga rreshti i inventarit ku ishte rezervuar stoku.
                        pallet.Items.Add(new PalletItem
                        {
                            ProductId = item.ProductId,
                            Quantity = toPick,
                            RaftId = inv.RaftId
                        });

                        pickedForPallet += toPick;
                    }

                    if (pickedForPallet == 0)
                        throw new InvalidOperationException("Not enough reserved stock to pick");

                    await _repo.AddAsync(pallet);
                    await _context.SaveChangesAsync();

                    palletIds.Add(pallet.Id);
                    remaining -= pickedForPallet;
                }
            }

            // Porosia kalon në Processing sapo krijohen pallet-at për të.
            order.Status = SalesOrderStatus.Processing;
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            await _realtime.ResourceChangedAsync("pallets", "inventory", "salesorders");
            return palletIds;
        }

        private static PalletDto MapToDto(Pallet p) => new PalletDto
        {
            Id           = p.Id,
            PalletCode   = p.PalletCode,
            PackingType  = p.PackingType.ToString(),
            SalesOrderId = p.SalesOrderId,
            Items = (p.Items ?? new List<PalletItem>()).Select(i => new PalletItemDto
            {
                Id          = i.Id,
                PalletId    = i.PalletId,
                PalletCode  = p.PalletCode,
                ProductId   = i.ProductId,
                ProductName = i.Product?.Name ?? $"Product #{i.ProductId}",
                Quantity    = i.Quantity,
                RaftId      = i.RaftId,
                RaftNumber  = i.Raft?.RaftNumber,
                WarehouseName = i.Raft?.Warehouse?.Name,
            }).ToList(),
        };
    }
}