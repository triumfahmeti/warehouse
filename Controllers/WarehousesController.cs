using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.WarehouseDto;
using Warehouse.Services.Interfaces;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;

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
        [HasPermission(Permissions.Warehouses.View)]
        public async Task<IActionResult> GetAll()
        {
            var warehouses = await _service.GetAllAsync();
            return Ok(warehouses);
        }

        [HttpGet("{id}")]
        [HasPermission(Permissions.Warehouses.View)]
        public async Task<IActionResult> GetById(int id)
        {
            var warehouse = await _service.GetByIdAsync(id);
            if (warehouse == null) return NotFound();
            return Ok(warehouse);
        }

        [HttpPost]
        [HasPermission(Permissions.Warehouses.Create)]
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
        [HasPermission(Permissions.Warehouses.Edit)]
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
        [HasPermission(Permissions.Warehouses.Delete)]
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
