using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.PurchaseOrder;
using Warehouse.Services.Interfaces;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;

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

        [HttpGet]
        [HasPermission(Permissions.PurchaseOrders.View)]
        public async Task<IActionResult> GetAll()
        {
            var orders = await _service.GetAllAsync();
            return Ok(orders);
        }

        [HttpGet("{id}")]
        [HasPermission(Permissions.PurchaseOrders.View)]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _service.GetByIdAsync(id);
            return order == null ? NotFound() : Ok(order);
        }

        [HttpPost]
        [HasPermission(Permissions.PurchaseOrders.Create)]
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

        // POST /api/purchaseorder/{id}/receive-line
        [HttpPost("{id:int}/receive-line")]
        [HasPermission(Permissions.Inventory.AddStock)] // i njëjti permission si te Inventory.AddStock
        public async Task<IActionResult> ReceiveLine(int id, [FromBody] ReceivePurchaseOrderItemDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                await _service.ReceiveLineAsync(id, dto);
                return Ok(new { message = "Linja u pranua." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }



        [HttpPost("{id}/cancel")]
        [HasPermission(Permissions.PurchaseOrders.Cancel)]
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
        [HasPermission(Permissions.PurchaseOrders.Close)]
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
