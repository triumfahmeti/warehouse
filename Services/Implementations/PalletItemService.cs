using Warehouse.DTOs.PalletItem;
using Warehouse.Repositories.Interfaces;

using Warehouse.Models;
using Warehouse.Services.Interfaces;



namespace Warehouse.Services.Implementations
{
    public class PalletItemService : IPalletItemService
    {
        private readonly IPalletItemRepository _repo;
        private readonly AppDbContext _context;

        public PalletItemService(IPalletItemRepository repo, AppDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        public async Task<IEnumerable<PalletItemDto>> GetAllAsync()
        {
            var items = await _repo.GetAllAsync();
            return items.Select(MapToDto);
        }

        public async Task<PalletItemDto?> GetByIdAsync(int id)
        {
            var item = await _repo.GetWithDetails(id);
            return item == null ? null : MapToDto(item);
        }

        public async Task<IEnumerable<PalletItemDto>> GetByPalletIdAsync(int palletId)
        {
            var items = await _repo.GetByPalletId(palletId);
            return items.Select(MapToDto);
        }

        public async Task<IEnumerable<PalletItemDto>> GetByProductIdAsync(int productId)
        {
            var items = await _repo.GetByProductId(productId);
            return items.Select(MapToDto);
        }

        public async Task<PalletItemDto> AddAsync(CreateEditPalletItemDto dto)
        {
            var item = new PalletItem
            {
                PalletId = dto.PalletId,
                ProductId = dto.ProductId,
                Quantity = dto.Quantity
            };

            await _repo.AddAsync(item);
            await _context.SaveChangesAsync();
            return MapToDto(item);
        }

        public async Task UpdateAsync(int id, CreateEditPalletItemDto dto)
        {
            var item = await _repo.GetByIdAsync(id);
            if (item == null)
                throw new Exception("PalletItem not found");

            item.PalletId = dto.PalletId;
            item.ProductId = dto.ProductId;
            item.Quantity = dto.Quantity;

            await _repo.UpdateAsync(item);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var item = await _repo.GetByIdAsync(id);
            if (item == null)
                throw new Exception("PalletItem not found");

            await _repo.DeleteAsync(id);
            await _context.SaveChangesAsync();
        }

        private static PalletItemDto MapToDto(PalletItem pi) => new PalletItemDto
        {
            Id = pi.Id,
            PalletId = pi.PalletId,
            PalletCode = pi.Pallet?.PalletCode,
            ProductId = pi.ProductId,
            ProductName = pi.Product?.Name,
            Quantity = pi.Quantity
        };
    }
}