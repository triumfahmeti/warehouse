using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.PackingList;
using Warehouse.Enums;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PackingListController : ControllerBase
    {
        private readonly IPackingListService _service;

        public PackingListController(IPackingListService service)
        {
            _service = service;
        }

        private static PackingListDto ToDto(Warehouse.Models.PackingList pl) => new()
        {
            Id = pl.Id,
            PackingListNumber = pl.PackingListNumber,
            Status = pl.Status.ToString(),
            Notes = pl.Notes,
            SalesOrderId = pl.SalesOrderId,
            WarehouseId = pl.WarehouseId,
            WarehouseName = pl.Warehouse?.Name ?? "",
            CreatedAt = pl.CreatedAt ,
            ClientName = pl.SalesOrder?.Client?.FullName ?? ""  // ← shto

        };

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _service.GetAllAsync();
            return Ok(list.Select(pl => ToDto(pl)));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var pl = await _service.GetByIdAsync(id);
            return pl == null ? NotFound() : Ok(ToDto(pl));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEditPackingListDto dto)
        {
            var pl = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = pl.Id }, ToDto(pl));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateEditPackingListDto dto)
        {
            await _service.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpPatch("{id}/ready")]
        public async Task<IActionResult> MarkReady(int id)
        {
            await _service.MarkAsReadyAsync(id);
            return NoContent();
        }

        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            await _service.CancelAsync(id);
            return NoContent();
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailable()
        {
            var list = await _service.GetAvailableAsync();
            return Ok(list.Select(pl => ToDto(pl)));
        }
    }
}