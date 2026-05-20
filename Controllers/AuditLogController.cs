using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.AuditLogDto;
using Warehouse.Services.Interfaces;

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
        public async Task<IActionResult> GetAll()
        {
            var list = await _service.GetAllAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var auditLog = await _service.GetByIdAsync(id);
            return auditLog == null ? NotFound() : Ok(auditLog);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEditAuditLogDto dto)
        {
            var auditLog = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = auditLog.Id }, auditLog);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateEditAuditLogDto dto)
        {
            await _service.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}