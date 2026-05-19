using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.DTOs.Notification;

namespace Warehouse.Services.Interfaces
{
    public interface INotificationService
    {
        Task<NotificationResponseDto> CreateNotification(NotificationCreateDto dto);
        Task<bool> MarkAsRead(int id);
        Task<List<NotificationResponseDto>> GetUserNotifications(string userId);
    }
}