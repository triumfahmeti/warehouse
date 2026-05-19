using Warehouse.DTOs.AuditLogDto;

namespace Warehouse.Services.Interfaces
{
    public interface IAuditLogService
    {
        Task<List<AuditLogDto>> GetAllAsync();
        Task<AuditLogDto?> GetByIdAsync(int id);
        Task<AuditLogDto> CreateAsync(CreateEditAuditLogDto dto);
        Task UpdateAsync(int id, CreateEditAuditLogDto dto);
        Task DeleteAsync(int id);
    }
}