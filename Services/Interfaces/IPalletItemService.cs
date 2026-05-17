using Warehouse.DTOs.PalletItem;

namespace Warehouse.Services.Interfaces
{
    public interface IPalletItemService
    {
        Task<IEnumerable<PalletItemDto>> GetAllAsync();
        Task<PalletItemDto?> GetByIdAsync(int id);
        Task<PalletItemDto> AddAsync(CreateEditPalletItemDto dto);
        Task UpdateAsync(int id, CreateEditPalletItemDto dto);
        Task DeleteAsync(int id);
    }
}