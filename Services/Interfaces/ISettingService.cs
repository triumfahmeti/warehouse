using Warehouse.DTOs.SettingDto;

namespace Warehouse.Services.Interfaces
{
    public interface ISettingService
    {
        Task<List<SettingDto>> GetAllAsync();
        Task<SettingDto?> GetByIdAsync(int id);
        Task<SettingDto> CreateAsync(CreateEditSettingDto dto);
        Task UpdateAsync(int id, CreateEditSettingDto dto);
        Task DeleteAsync(int id);
    }
}