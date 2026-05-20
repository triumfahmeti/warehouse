using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.SettingDto;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingController : ControllerBase
    {
        private readonly ISettingService _service;

        public SettingController(ISettingService service)
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
            var setting = await _service.GetByIdAsync(id);
            return setting == null ? NotFound() : Ok(setting);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEditSettingDto dto)
        {
            var setting = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = setting.Id }, setting);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateEditSettingDto dto)
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