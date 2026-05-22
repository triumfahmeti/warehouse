using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.Raft;
using Warehouse.Services.Interfaces;

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
        public async Task<IActionResult> GetAll()
        {
            var rafts = await _service.GetAllAsync();
            return Ok(rafts);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var raft = await _service.GetByIdAsync(id);
            if (raft == null) return NotFound();
            return Ok(raft);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateEditRaftDto dto)
        {
            var created = await _service.AddAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CreateEditRaftDto dto)
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
