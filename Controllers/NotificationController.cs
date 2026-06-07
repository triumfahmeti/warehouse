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

        [HttpGet]
        [HasPermission(Permissions.Notifications.View)]
        public async Task<IActionResult> GetAll()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var list = await _service.GetByUserIdAsync(userId);
            return Ok(list);
        }

        [HttpGet("{id}")]
        [HasPermission(Permissions.Notifications.View)]
        public async Task<IActionResult> GetById(string id)
        {
            var notification = await _service.GetByIdAsync(id);
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
            await _service.UpdateAsync(id, dto);
            return NoContent();
        }

        // Markimi si i lexuar është vetëshërbim — mjafton leja View (njoftimi i vet user-it).
        [HttpPatch("{id}/read")]
        [HasPermission(Permissions.Notifications.View)]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            await _service.MarkAsReadAsync(id);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [HasPermission(Permissions.Notifications.Delete)]
        public async Task<IActionResult> Delete(string id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}