using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.Client;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientsController : ControllerBase
    {
        private readonly IClientService _clientService;

        public ClientsController(IClientService clientService)
        {
            _clientService = clientService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var clients = await _clientService.GetAllAsync();
            return Ok(clients);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UpsertClientDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var id = await _clientService.CreateClient(dto.FullName, dto.Email, dto.PhoneNumber, dto.Address);
            return CreatedAtAction(nameof(GetOrders), new { id }, new { id });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpsertClientDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            await _clientService.UpdateClient(id, dto.FullName, dto.Email, dto.PhoneNumber, dto.Address);
            return NoContent();
        }

        [HttpGet("{id:int}/orders")]
        public async Task<IActionResult> GetOrders(int id)
        {
            var orders = await _clientService.GetClientOrders(id);
            return Ok(orders);
        }

        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var orders = await _clientService.GetMyOrdersAsync(userId);
                return Ok(orders);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        // GET /api/client-portal/my-stats
        [HttpGet("my-stats")]
        public async Task<IActionResult> GetMyStats()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                var stats = await _clientService.GetMyStatsAsync(userId);
                return Ok(stats);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}
