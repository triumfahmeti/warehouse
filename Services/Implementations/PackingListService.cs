using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class PackingListService : IPackingListService
    {
        private readonly IPackingListRepository _packingListRepository;
        private readonly AppDbContext _context;

        public PackingListService(IPackingListRepository packingListRepository, AppDbContext context)
        {
            _packingListRepository = packingListRepository;
            _context = context;
        }

        public async Task<List<PackingList>> GetAllAsync()
            => await _packingListRepository.GetAllWithDetails();

        public async Task<PackingList?> GetByIdAsync(int id)
            => await _packingListRepository.GetWithPalletsAndOrder(id);

        public async Task<PackingList> CreateAsync(int salesOrderId, int warehouseId, List<int> palletIds, string? notes)
        {
            var number = $"PL-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}";

            var packingList = new PackingList
            {
                PackingListNumber = number,
                SalesOrderId = salesOrderId,
                WarehouseId = warehouseId,
                Notes = notes,
                Status = PackingListStatus.Draft,
                Pallets = palletIds.Select(pid => new PackingListPallet { PalletId = pid }).ToList()
            };

            await _packingListRepository.AddAsync(packingList);
            await _context.SaveChangesAsync();
            return packingList;
        }

        public async Task MarkAsReadyAsync(int id)
        {
            var pl = await _packingListRepository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("PackingList not found");

            if (pl.Status != PackingListStatus.Draft)
                throw new InvalidOperationException("Only Draft packing lists can be marked as Ready");

            pl.Status = PackingListStatus.Ready;
            await _packingListRepository.UpdateAsync(pl);
            await _context.SaveChangesAsync();
        }

        public async Task CancelAsync(int id)
        {
            var pl = await _packingListRepository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("PackingList not found");

            if (pl.Status == PackingListStatus.Shipped)
                throw new InvalidOperationException("Cannot cancel a shipped packing list");

            pl.Status = PackingListStatus.Cancelled;
            await _packingListRepository.UpdateAsync(pl);
            await _context.SaveChangesAsync();
        }
    }
}