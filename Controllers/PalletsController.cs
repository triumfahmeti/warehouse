using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.Pallet;
using Warehouse.Services.Interfaces;
using Warehouse.Authorization;
using Warehouse.Authorization.Constants;


namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PalletsController : ControllerBase
    {
        private readonly IPalletService _service;

        public PalletsController(IPalletService service)
        {
            _service = service;
        }

        [HttpGet]
        [HasPermission(Permissions.Pallets.View)]
        public async Task<IActionResult> GetAll()
        {
            var pallets = await _service.GetAllAsync();
            return Ok(pallets);
        }

        [HttpGet("{id}")]
        [HasPermission(Permissions.Pallets.View)]
        public async Task<IActionResult> GetById(int id)
        {
            var pallet = await _service.GetByIdAsync(id);
            if (pallet == null) return NotFound();
            return Ok(pallet);
        }

        [HttpGet("code/{palletCode}")]
        [HasPermission(Permissions.Pallets.View)]
        public async Task<IActionResult> GetByPalletCode(string palletCode)
        {
            var pallet = await _service.GetByPalletCodeAsync(palletCode);
            if (pallet == null) return NotFound();
            return Ok(pallet);
        }

        [HttpPost]
        [HasPermission(Permissions.Pallets.Create)]
        public async Task<IActionResult> Create(CreateEditPalletDto dto)
        {
            var created = await _service.AddAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpGet("order-preview/{salesOrderId}")]
        [HasPermission(Permissions.Pallets.View)]
        public async Task<IActionResult> GetOrderPickingPreview(int salesOrderId)
        {
            var preview = await _service.GetOrderPickingPreviewAsync(salesOrderId);
            if (preview == null) return NotFound();
            return Ok(preview);
        }

        [HttpPut("{id}")]
        [HasPermission(Permissions.Pallets.Edit)]
        public async Task<IActionResult> Update(int id, CreateEditPalletDto dto)
        {
            await _service.UpdateAsync(id, dto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [HasPermission(Permissions.Pallets.Delete)]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }

        [HttpPost("from-order")]
        [HasPermission(Permissions.Pallets.CreateFromOrder)]
        public async Task<IActionResult> CreateFromOrder(CreatePalletDto dto)
        {
            try
            {
                var palletId = await _service.CreatePalletFromOrder(dto);
                return CreatedAtAction(nameof(GetById), new { id = palletId }, new { id = palletId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("from-order-split")]
        [HasPermission(Permissions.Pallets.CreateFromOrder)]
        public async Task<IActionResult> CreateFromOrderSplit([FromBody] CreatePalletSplitDto dto)
        {
            try
            {
                var palletIds = await _service.CreatePalletsFromOrderSplit(dto);
                return Ok(new { palletIds });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("by-order/{salesOrderId}")]
        [HasPermission(Permissions.Pallets.View)]
        public async Task<IActionResult> GetBySalesOrder(int salesOrderId)
        {
            var pallets = await _service.GetAllAsync();
            return Ok(pallets.Where(p => p.SalesOrderId == salesOrderId));
        }
    }
}
