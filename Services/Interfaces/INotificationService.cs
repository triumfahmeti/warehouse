using Warehouse.DTOs.NotificationDto;

namespace Warehouse.Services.Interfaces
{
    public interface INotificationService
    {
        Task<List<NotificationDto>> GetAllAsync();
        Task<List<NotificationDto>> GetByUserIdAsync(string userId);
        // ownerId nuk eshte opsional: njoftimi eshte personal, prandaj filtri i
        // pronesise aplikohet brenda vete query-t te Mongo-s. Keshtu nuk ka si te
        // harrohet nga thirresi dhe s'ka hapesire per TOCTOU.
        Task<NotificationDto?> GetByIdAsync(string id, string ownerId);
        Task<NotificationDto> CreateAsync(CreateEditNotificationDto dto);
        // Kthejne false nese asgje nuk u perputh (nuk ekziston, tenant tjeter, ose
        // pronar tjeter) — thirresi s'duhet t'i dalloje keto raste.
        Task<bool> UpdateAsync(string id, string ownerId, CreateEditNotificationDto dto);
        Task<bool> MarkAsReadAsync(string id, string ownerId);
        Task<bool> DeleteAsync(string id, string ownerId);
    }
}