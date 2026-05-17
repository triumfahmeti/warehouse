using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.Audit;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditLogsController : ControllerBase
    {
        private readonly IAuditLogService _auditLogService;

        public AuditLogsController(IAuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var logs = await _auditLogService.GetAllLogs();
            return Ok(logs);
        }

        [HttpGet("entity")]
        public async Task<IActionResult> GetByEntity([FromQuery] string entity, [FromQuery] int entityId)
        {
            var logs = await _auditLogService.GetLogsByEntity(entity, entityId);
            return Ok(logs);
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetByUser(string userId)
        {
            var logs = await _auditLogService.GetLogsByUser(userId);
            return Ok(logs);
        }

        [HttpPost]
        public async Task<IActionResult> LogAction([FromBody] AuditLogCreateDto dto)
        {
            var created = await _auditLogService.LogAction(dto);
            return Ok(created);
        }
    }
}