

using Microsoft.AspNetCore.Mvc;
using Warehouse.Enums;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExportImportController : ControllerBase
    {
        private readonly IExportImportService _service;

        public ExportImportController(IExportImportService service)
        {
            _service = service;
        }

        // ════════════════════════════════════════════════════════════════════
        //  EXPORT ENDPOINTS
        //  GET /api/exportimport/export/{entity}?format=csv|excel|json
        // ════════════════════════════════════════════════════════════════════

        [HttpGet("export/products")]
        public async Task<IActionResult> ExportProducts([FromQuery] string format = "csv")
        {
            var (content, fileName, contentType) = await _service.ExportProductsAsync(format);
            return File(content, contentType, fileName);
        }

        [HttpGet("export/suppliers")]
        public async Task<IActionResult> ExportSuppliers([FromQuery] string format = "csv")
        {
            var (content, fileName, contentType) = await _service.ExportSuppliersAsync(format);
            return File(content, contentType, fileName);
        }

        [HttpGet("export/clients")]
        public async Task<IActionResult> ExportClients([FromQuery] string format = "csv")
        {
            var (content, fileName, contentType) = await _service.ExportClientsAsync(format);
            return File(content, contentType, fileName);
        }

        [HttpGet("export/purchaseorders")]
        public async Task<IActionResult> ExportPurchaseOrders(
            [FromQuery] string format = "csv",
            [FromQuery] DateTime? from = null,
            [FromQuery] DateTime? to = null)
        {
            var (content, fileName, contentType) = await _service.ExportPurchaseOrdersAsync(format, from, to);
            return File(content, contentType, fileName);
        }

        [HttpGet("export/inventory")]
        public async Task<IActionResult> ExportInventory(
            [FromQuery] string format = "csv",
            [FromQuery] int? warehouseId = null)
        {
            var (content, fileName, contentType) = await _service.ExportInventoryAsync(format, warehouseId);
            return File(content, contentType, fileName);
        }

        [HttpGet("export/shipments")]
        public async Task<IActionResult> ExportShipments(
            [FromQuery] string format = "csv",
            [FromQuery] ShipmentStatus? status = null)
        {
            var (content, fileName, contentType) = await _service.ExportShipmentsAsync(format, status);
            return File(content, contentType, fileName);
        }

        [HttpGet("export/packinglists")]
        public async Task<IActionResult> ExportPackingLists([FromQuery] string format = "csv")
        {
            var (content, fileName, contentType) = await _service.ExportPackingListsAsync(format);
            return File(content, contentType, fileName);
        }

        // ════════════════════════════════════════════════════════════════════
        //  IMPORT ENDPOINTS
        //  POST /api/exportimport/import/{entity}
        //  Body: multipart/form-data  →  field name: "file"
        // ════════════════════════════════════════════════════════════════════

        [HttpPost("import/products")]
        public async Task<IActionResult> ImportProducts(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Skedari është i zbrazët ose nuk u dërgua.");

            if (!IsAllowedExtension(file.FileName))
                return BadRequest("Formati i skedarit nuk mbështetet. Përdor: .csv, .xlsx, .json");

            var result = await _service.ImportProductsAsync(file);
            return Ok(result);
        }

        [HttpPost("import/suppliers")]
        public async Task<IActionResult> ImportSuppliers(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Skedari është i zbrazët ose nuk u dërgua.");

            if (!IsAllowedExtension(file.FileName))
                return BadRequest("Formati i skedarit nuk mbështetet. Përdor: .csv, .xlsx, .json");

            var result = await _service.ImportSuppliersAsync(file);
            return Ok(result);
        }

        [HttpPost("import/clients")]
        public async Task<IActionResult> ImportClients(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Skedari është i zbrazët ose nuk u dërgua.");

            if (!IsAllowedExtension(file.FileName))
                return BadRequest("Formati i skedarit nuk mbështetet. Përdor: .csv, .xlsx, .json");

            var result = await _service.ImportClientsAsync(file);
            return Ok(result);
        }

        [HttpPost("import/inventory")]
        public async Task<IActionResult> ImportInventory(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Skedari është i zbrazët ose nuk u dërgua.");

            if (!IsAllowedExtension(file.FileName))
                return BadRequest("Formati i skedarit nuk mbështetet. Përdor: .csv, .xlsx, .json");

            var result = await _service.ImportInventoryAsync(file);
            return Ok(result);
        }

        // ════════════════════════════════════════════════════════════════════
        //  HELPER
        // ════════════════════════════════════════════════════════════════════

        private static bool IsAllowedExtension(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLower();
            return ext is ".csv" or ".xlsx" or ".xls" or ".json";
        }
    }
}




