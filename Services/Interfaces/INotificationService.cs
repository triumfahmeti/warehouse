using Warehouse.DTOs.NotificationDto;

namespace Warehouse.Services.Interfaces
{
    public interface INotificationService
    {
        Task<List<NotificationDto>> GetAllAsync();
        Task<List<NotificationDto>> GetByUserIdAsync(string userId);
        Task<NotificationDto?> GetByIdAsync(string id);
        Task<NotificationDto> CreateAsync(CreateEditNotificationDto dto);
        Task UpdateAsync(string id, CreateEditNotificationDto dto);
        Task MarkAsReadAsync(string id);
        Task DeleteAsync(string id);
    }
}