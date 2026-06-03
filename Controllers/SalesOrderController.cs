using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.SalesOrder;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SalesOrderController : ControllerBase
    {
        private readonly ISalesOrderService _service;

        public SalesOrderController(ISalesOrderService service)
        {
            _service = service;
        }

        // Manager/Admin: te gjitha porosite (per t'i cmuar).
        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _service.GetAllAsync());
        }

        // Client: vetem porosite e veta.
        [HttpGet("mine")]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> GetMine()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                return Ok(await _service.GetOrdersForUserAsync(userId));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _service.GetDtoByIdAsync(id);
            return order == null ? NotFound() : Ok(order);
        }

        // Porosine e krijon vetem Clienti; clientId merret nga JWT.
        [HttpPost]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                var id = await _service.CreateOrderForUser(userId, request.Items);
                return Ok(new { id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Cmimet i cakton vetem Manager/Admin.
        [HttpPatch("{id}/set-prices")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> SetPrices(int id, [FromBody] List<SetPriceDto> items)
        {
            try
            {
                await _service.SetPrices(id, items);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Konfirmimin e ben vetem Clienti, dhe vetem per porosine e vet.
        [HttpPatch("{id}/confirm")]
        [Authorize(Roles = "Client")]
        public async Task<IActionResult> Confirm(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            try
            {
                await _service.ConfirmOrderForUser(userId, id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Anulim: Manager/Admin anulon cilendo; Client vetem te veten.
        [HttpPatch("{id}/cancel")]
        [Authorize(Roles = "Admin,Manager,Client")]
        public async Task<IActionResult> Cancel(int id)
        {
            var roles = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();
            try
            {
                if (roles.Contains("Admin") || roles.Contains("Manager"))
                {
                    await _service.CancelOrder(id);
                }
                else
                {
                    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    if (string.IsNullOrEmpty(userId)) return Unauthorized();
                    await _service.CancelOrderForUser(userId, id);
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public record CreateOrderRequest(List<CreateOrderItemDto> Items);
}
