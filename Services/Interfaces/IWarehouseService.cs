using Warehouse.DTOs.WarehouseDto;

namespace Warehouse.Services.Interfaces
{
    public interface IWarehouseService
    {
        Task<IEnumerable<WarehouseDto>> GetAllAsync();
        Task<WarehouseDto?> GetByIdAsync(int id);
        Task<WarehouseDto> AddAsync(CreateEditWarehouseDto dto);
        Task UpdateAsync(int id, CreateEditWarehouseDto dto);
        Task DeleteAsync(int id);
    }
}
