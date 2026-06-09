using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.Raft;
using Warehouse.Services.Interfaces;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RaftsController : ControllerBase
    {
        private readonly IRaftService _service;

        public RaftsController(IRaftService service)
        {
            _service = service;
        }

        [HttpGet]
        [HasPermission(Permissions.Rafts.View)]
        public async Task<IActionResult> GetAll()
        {
            var rafts = await _service.GetAllAsync();
            return Ok(rafts);
        }

        [HttpGet("{id}")]
        [HasPermission(Permissions.Rafts.View)]
        public async Task<IActionResult> GetById(int id)
        {
            var raft = await _service.GetByIdAsync(id);
            if (raft == null) return NotFound();
            return Ok(raft);
        }

        [HttpGet("warehouse/{warehouseId}")]
        [HasPermission(Permissions.Rafts.View)]
        public async Task<IActionResult> GetByWarehouseId(int warehouseId)
        {
            var rafts = await _service.GetByWarehouseIdAsync(warehouseId);
            return Ok(rafts);
        }

        [HttpGet("number/{raftNumber}")]
        [HasPermission(Permissions.Rafts.View)]
        public async Task<IActionResult> GetByRaftNumber(string raftNumber)
        {
            var raft = await _service.GetByRaftNumberAsync(raftNumber);
            if (raft == null) return NotFound();
            return Ok(raft);
        }

        [HttpPost]
        [HasPermission(Permissions.Rafts.Create)]
        public async Task<IActionResult> Create(CreateEditRaftDto dto)
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
        [HasPermission(Permissions.Rafts.Edit)]
        public async Task<IActionResult> Update(int id, CreateEditRaftDto dto)
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
        [HasPermission(Permissions.Rafts.Delete)]
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
