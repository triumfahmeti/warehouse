using Warehouse.Models;

namespace Warehouse.Services.Interfaces
{
    public interface IPackingListService
    {
        Task<List<PackingList>> GetAllAsync();
        Task<PackingList?> GetByIdAsync(int id);
        Task<PackingList> CreateAsync(int salesOrderId, int warehouseId, List<int> palletIds, string? notes);
        Task MarkAsReadyAsync(int id);
        Task CancelAsync(int id);
    }
}