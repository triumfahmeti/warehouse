using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class AuditLogRepository : GenericRepository<AuditLog>, IAuditLogRepository
    {
        private readonly AppDbContext _context;

        public AuditLogRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<List<AuditLog>> GetLogsByEntityAsync(string entity, int entityId)
        {
            return await _context.AuditLogs
                .Where(l => l.Entity == entity && l.EntityId == entityId)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<AuditLog>> GetLogsByUserAsync(string userId)
        {
            return await _context.AuditLogs
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<AuditLog>> GetAllLogsAsync()
        {
            return await _context.AuditLogs
                .OrderByDescending(l => l.CreatedAt)
                .ToListAsync();
        }
    }
}