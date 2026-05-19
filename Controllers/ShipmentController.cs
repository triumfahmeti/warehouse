using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.ShipmentDto;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShipmentController : ControllerBase
    {
        private readonly IShipmentService _service;

        public ShipmentController(IShipmentService service)
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
            var shipment = await _service.GetByIdAsync(id);
            return shipment == null ? NotFound() : Ok(shipment);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEditShipmentDto dto)
        {
            var shipment = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = shipment.Id }, shipment);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateEditShipmentDto dto)
        {
            await _service.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpPatch("{id}/ship")]
        public async Task<IActionResult> MarkShipped(int id)
        {
            await _service.MarkAsShippedAsync(id);
            return NoContent();
        }

        [HttpPatch("{id}/deliver")]
        public async Task<IActionResult> MarkDelivered(int id)
        {
            await _service.MarkAsDeliveredAsync(id);
            return NoContent();
        }

        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            await _service.CancelAsync(id);
            return NoContent();
        }
    }
}