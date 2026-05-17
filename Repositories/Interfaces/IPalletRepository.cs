using Warehouse.Models;
using Warehouse.Services.Interfaces;

namespace Warehouse.Repositories.Interfaces
{
    public interface IPalletRepository : IGenericRepository<Pallet>
    {
        Task<Pallet?> GetWithItems(int id);
        Task<List<Pallet>> GetAllWithItems();
        Task<Pallet?> GetByPalletCode(string palletCode);
    }
}