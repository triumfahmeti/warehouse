using Warehouse.DTOs.Pallet;

using System.Threading.Tasks;
using Warehouse.DTOs.Pallet;

namespace Warehouse.Services.Interfaces
{
    public interface IPalletService
    {
        Task<IEnumerable<PalletDto>> GetAllAsync();
        Task<PalletDto?> GetByIdAsync(int id);
        Task<PalletDto?> GetByPalletCodeAsync(string palletCode);
        Task<PalletDto> AddAsync(CreateEditPalletDto dto);
        Task UpdateAsync(int id, CreateEditPalletDto dto);
        Task DeleteAsync(int id);
        Task<int> CreatePalletFromOrder(CreatePalletDto dto);
    }
}
 
