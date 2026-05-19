using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.PackingList;
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

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _service.GetAllAsync();
            return Ok(list.Select(pl => pl.ToDto()));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var pl = await _service.GetByIdAsync(id);
            return pl == null ? NotFound() : Ok(pl.ToDto());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEditPackingListDto dto)
        {
            var pl = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = pl.Id }, pl.ToDto());
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
    }
}