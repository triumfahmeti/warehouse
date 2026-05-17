using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.Notification;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] NotificationCreateDto dto)
        {
            var created = await _notificationService.CreateNotification(dto);
            return Ok(created);
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var ok = await _notificationService.MarkAsRead(id);
            return ok ? NoContent() : NotFound();
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserNotifications(string userId)
        {
            var list = await _notificationService.GetUserNotifications(userId);
            return Ok(list);
        }
    }
}