using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.PalletItem;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PalletItemsController : ControllerBase
    {
        private readonly IPalletItemService _service;

        public PalletItemsController(IPalletItemService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _service.GetAllAsync();
            return Ok(items);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var item = await _service.GetByIdAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpGet("pallet/{palletId}")]
        public async Task<IActionResult> GetByPalletId(int palletId)
        {
            var items = await _service.GetByPalletIdAsync(palletId);
            return Ok(items);
        }

        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetByProductId(int productId)
        {
            var items = await _service.GetByProductIdAsync(productId);
            return Ok(items);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateEditPalletItemDto dto)
        {
            var created = await _service.AddAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CreateEditPalletItemDto dto)
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
