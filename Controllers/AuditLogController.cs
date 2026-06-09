using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.AuditLogDto;
using Warehouse.Services.Interfaces;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditLogController : ControllerBase
    {
        private readonly IAuditLogService _service;

        public AuditLogController(IAuditLogService service)
        {
            _service = service;
        }

        [HttpGet]
        [HasPermission(Permissions.AuditLogs.View)]
        public async Task<IActionResult> GetAll()
        {
            var list = await _service.GetAllAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        [HasPermission(Permissions.AuditLogs.View)]
        public async Task<IActionResult> GetById(int id)
        {
            var auditLog = await _service.GetByIdAsync(id);
            return auditLog == null ? NotFound() : Ok(auditLog);
        }

        [HttpPost]
        [HasPermission(Permissions.AuditLogs.Create)]
        public async Task<IActionResult> Create([FromBody] CreateEditAuditLogDto dto)
        {
            var auditLog = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = auditLog.Id }, auditLog);
        }

        [HttpPut("{id}")]
        [HasPermission(Permissions.AuditLogs.Edit)]
        public async Task<IActionResult> Update(int id, [FromBody] CreateEditAuditLogDto dto)
        {
            await _service.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [HasPermission(Permissions.AuditLogs.Delete)]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }

        [HttpGet("filter")]
        [HasPermission(Permissions.AuditLogs.View)]
        public async Task<IActionResult> Filter(
            [FromQuery] string? userId,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate,
            [FromQuery] string? action,
            [FromQuery] string? entity)
        {
            var list = await _service.GetFilteredAsync(userId, fromDate, toDate, action, entity);
            return Ok(list);
        }
    }
}