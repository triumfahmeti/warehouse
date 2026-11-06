using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Warehouse.DTOs.NotificationDto;
using Warehouse.Models;
using Warehouse.Services.Interfaces;
using Warehouse.Services.Tenancy;

namespace Warehouse.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly IMongoCollection<Notification> _notifications;
        private readonly ITenantProvider _tenantProvider;

        public NotificationService(IMongoDatabase database, IOptions<MongoDbSettings> mongoSettings, ITenantProvider tenantProvider)
        {
            _notifications = database.GetCollection<Notification>(
                mongoSettings.Value.NotificationsCollectionName);
            _tenantProvider = tenantProvider;
        }
        private int TenantId => _tenantProvider.TenantId ?? 0;

        // public async Task<List<NotificationDto>> GetAllAsync()
        // {
        //     var list = await _notifications
        //         .Find(_ => true)
        //         .SortByDescending(n => n.CreatedAt)
        //         .ToListAsync();

        //     return list.Select(n => ToDto(n)).ToList();
        // }

        public async Task<List<NotificationDto>> GetAllAsync()
        {
            try
            {
                var list = await _notifications
                    .Find(n => n.TenantId == TenantId)
                    .SortByDescending(n => n.CreatedAt)
                    .ToListAsync();
                return list.Select(n => ToDto(n)).ToList();
            }
            catch
            {
                return new List<NotificationDto>();
            }
        }


        // public async Task<List<NotificationDto>> GetByUserIdAsync(string userId)
        // {
        //     var list = await _notifications
        //         .Find(n => n.UserId == userId)
        //         .SortByDescending(n => n.CreatedAt)
        //         .ToListAsync();

        //     return list.Select(n => ToDto(n)).ToList();
        // }
        public async Task<List<NotificationDto>> GetByUserIdAsync(string userId)
        {
            try
            {
                var list = await _notifications
                    .Find(n => n.TenantId == TenantId && n.UserId == userId)
                    .SortByDescending(n => n.CreatedAt)
                    .ToListAsync();
                return list.Select(n => ToDto(n)).ToList();
            }
            catch
            {
                return new List<NotificationDto>();
            }
        }


        public async Task<NotificationDto?> GetByIdAsync(string id, string ownerId)
        {
            var notification = await _notifications
                .Find(n => n.Id == id && n.TenantId == TenantId && n.UserId == ownerId)
                .FirstOrDefaultAsync();

            return notification == null ? null : ToDto(notification);
        }

        // public async Task<NotificationDto> CreateAsync(CreateEditNotificationDto dto)
        // {
        //     var notification = new Notification
        //     {
        //         UserId = dto.UserId,
        //         Type = dto.Type,
        //         Title = dto.Title,
        //         Message = dto.Message,
        //         IsRead = false,
        //         CreatedAt = DateTime.UtcNow
        //     };

        //     await _notifications.InsertOneAsync(notification);
        //     return ToDto(notification);
        // }

        //         public async Task<NotificationDto> CreateAsync(CreateEditNotificationDto dto)
        // {
        //     try
        //     {
        //         var notification = new Notification
        //         {
        //             UserId = dto.UserId,
        //             Type = dto.Type,
        //             Title = dto.Title,
        //             Message = dto.Message,
        //             IsRead = false,
        //             CreatedAt = DateTime.UtcNow
        //         };
        //         await _notifications.InsertOneAsync(notification);
        //         return ToDto(notification);
        //     }
        //     catch
        //     {
        //         return new NotificationDto { Title = dto.Title, Message = dto.Message };
        //     }
        // }
        public async Task<NotificationDto> CreateAsync(CreateEditNotificationDto dto)
        {
            try
            {
                var notification = new Notification
                {
                    TenantId = TenantId,
                    UserId = dto.UserId,
                    Type = dto.Type,
                    Title = dto.Title,
                    Message = dto.Message,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                await _notifications.InsertOneAsync(notification);
                return ToDto(notification);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MongoDB error: {ex.Message}");
                // ← shto UserId këtu
                return new NotificationDto
                {
                    Id = Guid.NewGuid().ToString(),
                    UserId = dto.UserId,      // ← kritike
                    Type = dto.Type,
                    Title = dto.Title,
                    Message = dto.Message,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
            }
        }

        public async Task<bool> UpdateAsync(string id, string ownerId, CreateEditNotificationDto dto)
        {
            // UserId NUK perditesohet me: po te lejohej, pronari do mund t'ia kalonte
            // njoftimin dikujt tjeter dhe filtri i pronesise do anashkalohej.
            var update = Builders<Notification>.Update
                .Set(n => n.Type, dto.Type)
                .Set(n => n.Title, dto.Title)
                .Set(n => n.Message, dto.Message);

            var result = await _notifications.UpdateOneAsync(
                n => n.Id == id && n.TenantId == TenantId && n.UserId == ownerId, update);

            return result.MatchedCount > 0;
        }

        // public async Task MarkAsReadAsync(string id)
        // {
        //     var update = Builders<Notification>.Update
        //         .Set(n => n.IsRead, true);

        //     await _notifications.UpdateOneAsync(n => n.Id == id, update);
        // }

        // public async Task DeleteAsync(string id)
        // {
        //     await _notifications.DeleteOneAsync(n => n.Id == id);
        // }

        public async Task<bool> MarkAsReadAsync(string id, string ownerId)
        {
            try
            {
                var update = Builders<Notification>.Update.Set(n => n.IsRead, true);
                var result = await _notifications.UpdateOneAsync(
                    n => n.Id == id && n.TenantId == TenantId && n.UserId == ownerId, update);

                return result.MatchedCount > 0;
            }
            catch { return false; }
        }

        public async Task<bool> DeleteAsync(string id, string ownerId)
        {
            try
            {
                var result = await _notifications.DeleteOneAsync(
                    n => n.Id == id && n.TenantId == TenantId && n.UserId == ownerId);

                return result.DeletedCount > 0;
            }
            catch { return false; }
        }

        private static NotificationDto ToDto(Notification n) => new()
        {
            Id = n.Id,
            UserId = n.UserId,
            Type = n.Type,
            Title = n.Title,
            Message = n.Message,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt
        };
    }
}