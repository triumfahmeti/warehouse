using System.Collections.Generic;
using System.Threading.Tasks;
using Warehouse.Models;

namespace Warehouse.Repositories.Interfaces
{
    public interface IAuditLogRepository : IGenericRepository<AuditLog>
    {
        Task<List<AuditLog>> GetLogsByEntityAsync(string entity, int entityId);
        Task<List<AuditLog>> GetLogsByUserAsync(string userId);
        Task<List<AuditLog>> GetAllLogsAsync();
    }
}