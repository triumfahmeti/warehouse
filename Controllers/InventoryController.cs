using Microsoft.AspNetCore.Mvc;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryService _service;

        public InventoryController(IInventoryService service)
        {
            _service = service;
        }

        [HttpPost("add-stock")]
        public async Task<IActionResult> AddStock([FromBody] AddStockRequest request)
        {
            await _service.AddStock(request.ProductId, request.RaftId, request.Quantity);
            return NoContent();
        }

        [HttpPost("remove-stock")]
        public async Task<IActionResult> RemoveStock([FromBody] RemoveStockRequest request)
        {
            await _service.RemoveStock(request.ProductId, request.RaftId, request.Quantity);
            return NoContent();
        }

        [HttpGet("available/{productId}")]
        public async Task<IActionResult> GetAvailableStock(int productId)
        {
            var stock = await _service.GetAvailableStock(productId);
            return Ok(stock);
        }

        [HttpPatch("reserve/{salesOrderId}")]
        public async Task<IActionResult> ReserveStock(int salesOrderId)
        {
            await _service.ReserveStock(salesOrderId);
            return NoContent();
        }

        [HttpPost("transfer")]
        public async Task<IActionResult> TransferStock([FromBody] TransferStockRequest request)
        {
            await _service.TransferStock(request.ProductId, request.FromRaftId, request.ToRaftId, request.Quantity);
            return NoContent();
        }

        [HttpPost("adjust")]
        public async Task<IActionResult> AdjustStock([FromBody] AdjustStockRequest request)
        {
            await _service.AdjustStock(request.ProductId, request.RaftId, request.QuantityDelta, request.Reason);
            return NoContent();
        }

        [HttpPost("cycle-count")]
        public async Task<IActionResult> CycleCount([FromBody] CycleCountRequest request)
        {
            await _service.CycleCount(request.ProductId, request.RaftId, request.CountedQuantity);
            return NoContent();
        }

        [HttpPatch("release/{salesOrderId}")]
        public async Task<IActionResult> ReleaseReservedStock(int salesOrderId)
        {
            await _service.ReleaseReservedStock(salesOrderId);
            return NoContent();
        }

        [HttpGet("movements/{productId}")]
        public async Task<IActionResult> GetMovements(int productId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var movements = await _service.GetInventoryMovements(productId, from, to);
            return Ok(movements);
        }
    }

    public record AddStockRequest(int ProductId, int RaftId, int Quantity);
    public record RemoveStockRequest(int ProductId, int RaftId, int Quantity);
    public record TransferStockRequest(int ProductId, int FromRaftId, int ToRaftId, int Quantity);
    public record AdjustStockRequest(int ProductId, int RaftId, int QuantityDelta, string Reason);
    public record CycleCountRequest(int ProductId, int RaftId, int CountedQuantity);
}