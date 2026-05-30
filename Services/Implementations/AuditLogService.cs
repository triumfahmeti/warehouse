using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.AuditLogDto;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class AuditLogService : IAuditLogService
    {
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly AppDbContext _context;

        public AuditLogService(
            IAuditLogRepository auditLogRepository,
            AppDbContext context)
        {
            _auditLogRepository = auditLogRepository;
            _context = context;
        }

        public async Task<List<AuditLogDto>> GetAllAsync()
        {
            var list = await _auditLogRepository.GetAllWithDetails();
            return list.Select(a => ToDto(a)).ToList();
        }

        public async Task<AuditLogDto?> GetByIdAsync(int id)
        {
            var auditLog = await _auditLogRepository.GetWithDetails(id);
            return auditLog == null ? null : ToDto(auditLog);
        }

        public async Task<AuditLogDto> CreateAsync(CreateEditAuditLogDto dto)
        {
            var auditLog = new AuditLog
            {
                UserId = dto.UserId,
                Action = dto.Action,
                Entity = dto.Entity,
                EntityId = dto.EntityId,
                OldValue = dto.OldValue,
                NewValue = dto.NewValue,
                IpAddress = dto.IpAddress
            };

            await _auditLogRepository.AddAsync(auditLog);
            await _context.SaveChangesAsync();

            return ToDto(auditLog);
        }

        public async Task UpdateAsync(int id, CreateEditAuditLogDto dto)
        {
            var auditLog = await _auditLogRepository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("AuditLog not found");

            auditLog.UserId = dto.UserId;
            auditLog.Action = dto.Action;
            auditLog.Entity = dto.Entity;
            auditLog.EntityId = dto.EntityId;
            auditLog.OldValue = dto.OldValue;
            auditLog.NewValue = dto.NewValue;
            auditLog.IpAddress = dto.IpAddress;

            await _auditLogRepository.UpdateAsync(auditLog);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var auditLog = await _auditLogRepository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("AuditLog not found");

            await _auditLogRepository.DeleteAsync(auditLog.Id);
            await _context.SaveChangesAsync();
        }

        public async Task<List<AuditLogDto>> GetFilteredAsync(string? userId, DateTime? fromDate, DateTime? toDate, string? action, string? entity)
        {
            var query = _context.AuditLogs.Include(a => a.User).AsQueryable();

            if (!string.IsNullOrEmpty(userId))
                query = query.Where(a => a.UserId == userId);

            if (fromDate.HasValue)
                query = query.Where(a => a.CreatedAt >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(a => a.CreatedAt < toDate.Value.AddDays(1));

            if (!string.IsNullOrEmpty(action))
                query = query.Where(a => a.Action.Contains(action));

            if (!string.IsNullOrEmpty(entity))
                query = query.Where(a => a.Entity.Contains(entity));

            var logs = await query.OrderByDescending(a => a.CreatedAt).Take(200).ToListAsync();
            return logs.Select(a => ToDto(a)).ToList();
        }

        private static AuditLogDto ToDto(AuditLog a) => new()
        {
            Id = a.Id,
            UserId = a.UserId,
            UserName = a.User?.Name ?? a.User?.UserName ?? "",
            Action = a.Action,
            Entity = a.Entity,
            EntityId = a.EntityId,
            OldValue = a.OldValue,
            NewValue = a.NewValue,
            IpAddress = a.IpAddress,
            CreatedAt = a.CreatedAt
        };
    }
}