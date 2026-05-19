using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.Notification;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly AppDbContext _context;

        public NotificationService(INotificationRepository notificationRepository, AppDbContext context)
        {
            _notificationRepository = notificationRepository;
            _context = context;
        }

        public async Task<NotificationResponseDto> CreateNotification(NotificationCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.UserId))
                throw new InvalidOperationException("UserId is required");

            if (string.IsNullOrWhiteSpace(dto.Title))
                throw new InvalidOperationException("Title is required");

            var notification = new Notification
            {
                UserId = dto.UserId,
                Type = dto.Type,
                Title = dto.Title,
                Message = dto.Message,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.AddAsync(notification);
            await _context.SaveChangesAsync();

            return Map(notification);
        }

        public async Task<bool> MarkAsRead(int id)
        {
            var notification = await _notificationRepository.GetNotificationById(id);
            if (notification == null)
                return false;

            notification.IsRead = true;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<NotificationResponseDto>> GetUserNotifications(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
                throw new InvalidOperationException("UserId is required");

            var notifications = await _notificationRepository.GetNotificationsByUser(userId);
            return notifications.Select(Map).ToList();
        }

        private static NotificationResponseDto Map(Notification n) => new NotificationResponseDto
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