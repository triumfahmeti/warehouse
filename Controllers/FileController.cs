using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.FileDto;
using Warehouse.Services.Interfaces;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FileController : ControllerBase
    {
        private readonly IFileService _service;

        public FileController(IFileService service)
        {
            _service = service;
        }

        [HttpGet]
        [HasPermission(Permissions.Files.View)]
        public async Task<IActionResult> GetAll()
        {
            var list = await _service.GetAllAsync();
            return Ok(list);
        }

        [HttpGet("{id}")]
        [HasPermission(Permissions.Files.View)]
        public async Task<IActionResult> GetById(int id)
        {
            var file = await _service.GetByIdAsync(id);
            return file == null ? NotFound() : Ok(file);
        }

        [HttpPost]
        [HasPermission(Permissions.Files.Create)]
        public async Task<IActionResult> Create([FromBody] CreateEditFileDto dto)
        {
            var file = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = file.Id }, file);
        }

        [HttpPut("{id}")]
        [HasPermission(Permissions.Files.Edit)]
        public async Task<IActionResult> Update(int id, [FromBody] CreateEditFileDto dto)
        {
            await _service.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [HasPermission(Permissions.Files.Delete)]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}