using Warehouse.DTOs.Pallet;
using System.Threading.Tasks;


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
        Task<OrderPickingPreviewDto?> GetOrderPickingPreviewAsync(int salesOrderId);
        Task<int> CreatePalletFromOrder(CreatePalletDto dto);
        Task<List<int>> CreatePalletsFromOrderSplit(CreatePalletSplitDto dto);
    }
}
 
