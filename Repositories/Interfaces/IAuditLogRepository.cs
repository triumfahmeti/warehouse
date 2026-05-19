using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;
namespace Warehouse.Repositories.Interfaces
{
    public interface IAuditLogRepository : IGenericRepository<AuditLog>
    {
        Task<AuditLog?> GetWithDetails(int id);
        Task<List<AuditLog>> GetAllWithDetails();
    }
}