using Warehouse.DTOs.FileDto;

namespace Warehouse.Services.Interfaces
{
    public interface IFileService
    {
        Task<List<FileDto>> GetAllAsync();
        Task<FileDto?> GetByIdAsync(int id);
        Task<FileDto> CreateAsync(CreateEditFileDto dto);
        Task UpdateAsync(int id, CreateEditFileDto dto);
        Task DeleteAsync(int id);
    }
}