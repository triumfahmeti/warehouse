using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.NotificationDto;
using Warehouse.Services.Interfaces;
using System.Security.Claims;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _service;

        public NotificationController(INotificationService service)
        {
            _service = service;
        }

        private string? CurrentUserId => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        [HttpGet]
        [HasPermission(Permissions.Notifications.View)]
        public async Task<IActionResult> GetAll()
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var list = await _service.GetByUserIdAsync(userId);
            return Ok(list);
        }

        // Njoftimi eshte personal: leja Notifications.* lejon veprimin, por vetem mbi
        // njoftimet e vet perdoruesit. Per nje njoftim te huaj kthehet 404 (jo 403),
        // qe te mos zbulohet nese ai ID ekziston.
        [HttpGet("{id}")]
        [HasPermission(Permissions.Notifications.View)]
        public async Task<IActionResult> GetById(string id)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var notification = await _service.GetByIdAsync(id, userId);
            return notification == null ? NotFound() : Ok(notification);
        }

        [HttpPost]
        [HasPermission(Permissions.Notifications.Create)]
        public async Task<IActionResult> Create([FromBody] CreateEditNotificationDto dto)
        {
            var notification = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = notification.Id }, notification);
        }

        [HttpPut("{id}")]
        [HasPermission(Permissions.Notifications.Edit)]
        public async Task<IActionResult> Update(string id, [FromBody] CreateEditNotificationDto dto)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            return await _service.UpdateAsync(id, userId, dto) ? NoContent() : NotFound();
        }

        // Markimi si i lexuar është vetëshërbim — mjafton leja View (njoftimi i vet user-it).
        [HttpPatch("{id}/read")]
        [HasPermission(Permissions.Notifications.View)]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            return await _service.MarkAsReadAsync(id, userId) ? NoContent() : NotFound();
        }

        [HttpDelete("{id}")]
        [HasPermission(Permissions.Notifications.Delete)]
        public async Task<IActionResult> Delete(string id)
        {
            var userId = CurrentUserId;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            return await _service.DeleteAsync(id, userId) ? NoContent() : NotFound();
        }
    }
}