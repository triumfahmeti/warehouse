using Warehouse.DTOs.PackingListDto;
using Warehouse.Models;

namespace Warehouse.Services.Interfaces
{
    public interface IPackingListService
    {
        Task<List<PackingList>> GetAllAsync();
        Task<PackingList?> GetByIdAsync(int id);
        Task<PackingList> CreateAsync(CreateEditPackingListDto dto);
        Task UpdateAsync(int id, CreateEditPackingListDto dto);
        Task MarkAsReadyAsync(int id);
        Task CancelAsync(int id);
    }
}