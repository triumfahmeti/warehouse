using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.PurchaseOrder;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly IPurchaseOrderService _service;

        public PurchaseOrdersController(IPurchaseOrderService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Request body is required");
            }

            var id = await _service.CreatePurchaseOrder(dto.SupplierId, dto.Items);
            return Ok(new { id });
        }

        [HttpPost("{id}/approve")]
        public async Task<IActionResult> Approve(int id)
        {
            await _service.ApprovePurchaseOrder(id);
            return NoContent();
        }

        [HttpPost("{id}/receive")]
        public async Task<IActionResult> Receive(int id, [FromBody] ReceivePurchaseOrderDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Request body is required");
            }

            await _service.ReceivePurchaseOrder(id, dto.Items);
            return NoContent();
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> Cancel(int id)
        {
            await _service.CancelPurchaseOrder(id);
            return NoContent();
        }

        [HttpPost("{id}/close")]
        public async Task<IActionResult> Close(int id)
        {
            await _service.ClosePurchaseOrder(id);
            return NoContent();
        }

        [HttpPost("{id}/add-received-stock")]
        public async Task<IActionResult> AddReceivedStock(int id, [FromBody] ReceivePurchaseOrderDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Request body is required");
            }

            await _service.AddReceivedStock(id, dto.Items);
            return NoContent();
        }
    }
}
