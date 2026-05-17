using System.Collections.Generic;
using System.Threading.Tasks;
using Warehouse.DTOs.Audit;

namespace Warehouse.Services.Interfaces
{
    public interface IAuditLogService
    {
        Task<AuditLogResponseDto> LogAction(AuditLogCreateDto dto);
        Task<List<AuditLogResponseDto>> GetLogsByEntity(string entity, int entityId);
        Task<List<AuditLogResponseDto>> GetLogsByUser(string userId);
        Task<List<AuditLogResponseDto>> GetAllLogs();
    }
}