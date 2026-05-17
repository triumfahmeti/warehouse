using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FilesController : ControllerBase
    {
        private readonly IFileService _fileService;

        public FilesController(IFileService fileService)
        {
            _fileService = fileService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> Upload(
            IFormFile file,
            [FromQuery] string entity,
            [FromQuery] int entityId,
            [FromQuery] string uploadedBy)
        {
            var uploaded = await _fileService.UploadFile(file, entity, entityId, uploadedBy);
            return Ok(uploaded);
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> Download(int id)
        {
            var result = await _fileService.DownloadFile(id);
            if (result == null) return NotFound();
            return File(result.Value.data, result.Value.contentType, result.Value.fileName);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var files = await _fileService.GetAllFiles();
            return Ok(files);
        }

        [HttpGet("entity")]
        public async Task<IActionResult> GetByEntity([FromQuery] string entity, [FromQuery] int entityId)
        {
            var files = await _fileService.GetFilesByEntity(entity, entityId);
            return Ok(files);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _fileService.DeleteFile(id);
            return ok ? NoContent() : NotFound();
        }
    }
}