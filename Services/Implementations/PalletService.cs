using Warehouse.DTOs.Pallet;
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

        public PalletService(
            IPalletRepository repo,
            ISalesOrderRepository orderRepository,
            IInventoryRepository inventoryRepository,
            AppDbContext context)
        {
            _repo = repo;
            _orderRepository = orderRepository;
            _inventoryRepository = inventoryRepository;
            _context = context;
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
                RaftId = dto.RaftId,
                 SalesOrderId = dto.SalesOrderId
            };

            await _repo.AddAsync(pallet);
            await _context.SaveChangesAsync();
            return MapToDto(pallet);
        }

        public async Task UpdateAsync(int id, CreateEditPalletDto dto)
        {
            var pallet = await _repo.GetByIdAsync(id)
                ?? throw new Exception("Pallet not found");

            pallet.PalletCode = dto.PalletCode;
            pallet.PackingType = Enum.Parse<PackagingType>(dto.PackingType!); // string → enum
            pallet.RaftId = dto.RaftId;

            await _repo.UpdateAsync(pallet);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var pallet = await _repo.GetByIdAsync(id)
                ?? throw new Exception("Pallet not found");

            await _repo.DeleteAsync(id);
            await _context.SaveChangesAsync();
        }

        public async Task<int> CreatePalletFromOrder(CreatePalletDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            var order = await _orderRepository.GetOrderWithItems(dto.SalesOrderId);

            if (order == null)
                throw new InvalidOperationException("Order not found");

            if (order.Status != SalesOrderStatus.Confirmed)
                throw new InvalidOperationException("Order must be confirmed");

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

                    pallet.Items.Add(new PalletItem
                    {
                        ProductId = item.ProductId,
                        Quantity = toPick
                    });

                    remaining -= toPick;

                    if (remaining == 0)
                        break;
                }

                if (remaining > 0)
                    throw new InvalidOperationException("Not enough reserved stock to pick");
            }

            await _repo.AddAsync(pallet);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return pallet.Id;
        }

        private static PalletDto MapToDto(Pallet p) => new PalletDto
        {
            Id = p.Id,
            PalletCode = p.PalletCode,
            PackingType = p.PackingType.ToString() // enum → string për DTO
        };
    }
}