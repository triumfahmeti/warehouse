using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.SalesOrder;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalesOrderController : ControllerBase
    {
        private readonly ISalesOrderService _service;

        public SalesOrderController(ISalesOrderService service)
        {
            _service = service;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _service.GetById(id);
            return order == null ? NotFound() : Ok(order);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
        {
            var id = await _service.CreateOrder(request.ClientId, request.Items);
            return CreatedAtAction(nameof(GetById), new { id }, id);
        }

        [HttpPatch("{id}/set-prices")]
        public async Task<IActionResult> SetPrices(int id, [FromBody] List<SetPriceDto> items)
        {
            await _service.SetPrices(id, items);
            return NoContent();
        }

        [HttpPatch("{id}/confirm")]
        public async Task<IActionResult> Confirm(int id)
        {
            await _service.ConfirmOrder(id);
            return NoContent();
        }
    }

    public record CreateOrderRequest(int ClientId, List<CreateOrderItemDto> Items);
}