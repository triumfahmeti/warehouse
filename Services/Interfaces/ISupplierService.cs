using Warehouse.DTOs.SupplierDto;

namespace Warehouse.Services.Interfaces
{
    public interface ISupplierService
    {
        Task<IEnumerable<SupplierDto>> GetAllAsync();
        Task<SupplierDto?> GetByIdAsync(int id);
        Task<SupplierDto> AddAsync(CreateEditSupplierDto dto);
        Task UpdateAsync(int id, CreateEditSupplierDto dto);
        Task DeleteAsync(int id);
    }
}