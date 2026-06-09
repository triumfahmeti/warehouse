using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Warehouse.DTOs.NotificationDto;
using Warehouse.Models;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly IMongoCollection<Notification> _notifications;

        public NotificationService(IMongoDatabase database, IOptions<MongoDbSettings> mongoSettings)
        {
            _notifications = database.GetCollection<Notification>(
                mongoSettings.Value.NotificationsCollectionName);
        }

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
            .Find(_ => true)
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
            .Find(n => n.UserId == userId)
            .SortByDescending(n => n.CreatedAt)
            .ToListAsync();
        return list.Select(n => ToDto(n)).ToList();
    }
    catch
    {
        return new List<NotificationDto>();
    }
}


        public async Task<NotificationDto?> GetByIdAsync(string id)
        {
            var notification = await _notifications
                .Find(n => n.Id == id)
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
        
        public async Task UpdateAsync(string id, CreateEditNotificationDto dto)
        {
            var update = Builders<Notification>.Update
                .Set(n => n.UserId, dto.UserId)
                .Set(n => n.Type, dto.Type)
                .Set(n => n.Title, dto.Title)
                .Set(n => n.Message, dto.Message);

            await _notifications.UpdateOneAsync(n => n.Id == id, update);
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

        public async Task MarkAsReadAsync(string id)
{
    try
    {
        var update = Builders<Notification>.Update.Set(n => n.IsRead, true);
        await _notifications.UpdateOneAsync(n => n.Id == id, update);
    }
    catch { }
}

public async Task DeleteAsync(string id)
{
    try
    {
        await _notifications.DeleteOneAsync(n => n.Id == id);
    }
    catch { }
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