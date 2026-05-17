using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.DTOs.Audit;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class AuditLogService : IAuditLogService
    {
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly AppDbContext _context;

        public AuditLogService(IAuditLogRepository auditLogRepository, AppDbContext context)
        {
            _auditLogRepository = auditLogRepository;
            _context = context;
        }

        public async Task<AuditLogResponseDto> LogAction(AuditLogCreateDto dto)
        {
            var log = new AuditLog
            {
                UserId = dto.UserId,
                Action = dto.Action,
                Entity = dto.Entity,
                EntityId = dto.EntityId,
                OldValue = dto.OldValue,
                NewValue = dto.NewValue,
                IpAddress = dto.IpAddress
            };

            await _auditLogRepository.AddAsync(log);
            await _context.SaveChangesAsync();

            return Map(log);
        }

        public async Task<List<AuditLogResponseDto>> GetLogsByEntity(string entity, int entityId)
        {
            var logs = await _auditLogRepository.GetLogsByEntityAsync(entity, entityId);
            return logs.Select(Map).ToList();
        }

        public async Task<List<AuditLogResponseDto>> GetLogsByUser(string userId)
        {
            var logs = await _auditLogRepository.GetLogsByUserAsync(userId);
            return logs.Select(Map).ToList();
        }

        public async Task<List<AuditLogResponseDto>> GetAllLogs()
        {
            var logs = await _auditLogRepository.GetAllLogsAsync();
            return logs.Select(Map).ToList();
        }

        private static AuditLogResponseDto Map(AuditLog l) => new AuditLogResponseDto
        {
            Id = l.Id,
            UserId = l.UserId,
            Action = l.Action,
            Entity = l.Entity,
            EntityId = l.EntityId,
            OldValue = l.OldValue,
            NewValue = l.NewValue,
            IpAddress = l.IpAddress,
            CreatedAt = l.CreatedAt
        };
    }
}