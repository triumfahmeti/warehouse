using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.ShipmentDto;
using Warehouse.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;

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
        [HasPermission(Permissions.Shipments.View)]
        public async Task<IActionResult> GetAll()
        {
            var list = await _service.GetAllAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        [HasPermission(Permissions.Shipments.View)]
        public async Task<IActionResult> GetById(int id)
        {
            var shipment = await _service.GetByIdAsync(id);
            return shipment == null ? NotFound() : Ok(shipment);
        }

        [HttpPost]
        [HasPermission(Permissions.Shipments.Create)]
        public async Task<IActionResult> Create([FromBody] CreateEditShipmentDto dto)
        {
            var id = await _service.CreateShipment(dto);
            return CreatedAtAction(nameof(GetById), new { id }, id);
        }

        [HttpPatch("{id}/ready")]
        [HasPermission(Permissions.Shipments.MarkReady)]
        public async Task<IActionResult> MarkReady(int id)
        {
            await _service.MarkShipmentReady(id);
            return NoContent();
        }

        [HttpPatch("{id}/ship")]
        [HasPermission(Permissions.Shipments.Ship)]
        public async Task<IActionResult> Ship(int id)
        {
            await _service.Ship(id);
            return NoContent();
        }

        [HttpPatch("{id}/deliver")]
        [HasPermission(Permissions.Shipments.Deliver)]
        public async Task<IActionResult> Deliver(int id)
        {
            await _service.Deliver(id);
            return NoContent();
        }

        [HttpPatch("{id}/cancel")]
        [HasPermission(Permissions.Shipments.Cancel)]
        public async Task<IActionResult> Cancel(int id)
        {
            await _service.CancelAsync(id);
            return NoContent();
        }

        [HttpGet("mine")]
        [HasPermission(Permissions.Shipments.ViewOwn)]
        public async Task<IActionResult> GetMine()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var list = await _service.GetByUserAsync(userId);
            return Ok(list);
        }
    }
}