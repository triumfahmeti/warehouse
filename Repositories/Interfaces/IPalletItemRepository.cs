using Warehouse.Models;
using Warehouse.Services.Interfaces;

namespace Warehouse.Repositories.Interfaces
{
    public interface IPalletItemRepository : IGenericRepository<PalletItem>
    {
        Task<PalletItem?> GetWithDetails(int id);
        Task<List<PalletItem>> GetByPalletId(int palletId);
        Task<List<PalletItem>> GetByProductId(int productId);
    }
}