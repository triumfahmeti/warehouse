using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.WarehouseDto;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WarehousesController : ControllerBase
    {
        private readonly IWarehouseService _service;

        public WarehousesController(IWarehouseService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var warehouses = await _service.GetAllAsync();
            return Ok(warehouses);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var warehouse = await _service.GetByIdAsync(id);
            if (warehouse == null) return NotFound();
            return Ok(warehouse);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateEditWarehouseDto dto)
        {
            try
            {
                var created = await _service.AddAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CreateEditWarehouseDto dto)
        {
            try
            {
                await _service.UpdateAsync(id, dto);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                await _service.DeleteAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
