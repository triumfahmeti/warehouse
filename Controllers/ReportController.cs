using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.Reports;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _service;

        public ReportController(IReportService service)
        {
            _service = service;
        }

        [HttpPost("inventory")]
        public async Task<IActionResult> InventoryReport([FromBody] ReportFilterDto filter)
        {
            var data = await _service.GetInventoryReport(filter);

            if (filter.Format == "excel")
            {
                var bytes = await _service.ExportToExcel(data, "Inventory Report");
                return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "inventory.xlsx");
            }

            if (filter.Format == "csv")
            {
                var bytes = await _service.ExportToCsv(data);
                return File(bytes, "text/csv", "inventory.csv");
            }

            return Ok(data);
        }

        [HttpPost("sales-orders")]
        public async Task<IActionResult> SalesOrderReport([FromBody] ReportFilterDto filter)
        {
            var data = await _service.GetSalesOrderReport(filter);

            if (filter.Format == "excel")
            {
                var bytes = await _service.ExportToExcel(data, "Sales Orders Report");
                return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "sales-orders.xlsx");
            }

            if (filter.Format == "csv")
            {
                var bytes = await _service.ExportToCsv(data);
                return File(bytes, "text/csv", "sales-orders.csv");
            }

            return Ok(data);
        }

        [HttpPost("shipments")]
        public async Task<IActionResult> ShipmentReport([FromBody] ReportFilterDto filter)
        {
            var data = await _service.GetShipmentReport(filter);

            if (filter.Format == "excel")
            {
                var bytes = await _service.ExportToExcel(data, "Shipments Report");
                return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "shipments.xlsx");
            }

            if (filter.Format == "csv")
            {
                var bytes = await _service.ExportToCsv(data);
                return File(bytes, "text/csv", "shipments.csv");
            }

            return Ok(data);
        }
    }
}