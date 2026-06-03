using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.PurchaseOrder;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Manager,Worker")]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly IPurchaseOrderService _service;

        public PurchaseOrdersController(IPurchaseOrderService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var orders = await _service.GetAllAsync();
            return Ok(orders);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _service.GetByIdAsync(id);
            return order == null ? NotFound() : Ok(order);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is required" });

            try
            {
                var id = await _service.CreatePurchaseOrder(dto.SupplierId, dto.ExpectedDeliveryDate, dto.Items);
                return Ok(new { id });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/receive")]
        [Authorize(Roles = "Admin,Manager,Worker")]
        public async Task<IActionResult> Receive(int id, [FromBody] ReceivePurchaseOrderDto dto)
        {
            if (dto == null)
                return BadRequest(new { message = "Request body is required" });

            try
            {
                await _service.ReceivePurchaseOrder(id, dto.Items);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/cancel")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Cancel(int id)
        {
            try
            {
                await _service.CancelPurchaseOrder(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/close")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> Close(int id)
        {
            try
            {
                await _service.ClosePurchaseOrder(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
