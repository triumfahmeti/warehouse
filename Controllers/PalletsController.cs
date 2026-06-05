using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.Pallet;
using Warehouse.Services.Interfaces;


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
        public async Task<IActionResult> GetAll()
        {
            var pallets = await _service.GetAllAsync();
            return Ok(pallets);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var pallet = await _service.GetByIdAsync(id);
            if (pallet == null) return NotFound();
            return Ok(pallet);
        }

        [HttpGet("code/{palletCode}")]
        public async Task<IActionResult> GetByPalletCode(string palletCode)
        {
            var pallet = await _service.GetByPalletCodeAsync(palletCode);
            if (pallet == null) return NotFound();
            return Ok(pallet);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateEditPalletDto dto)
        {
            var created = await _service.AddAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPost("from-order")]
        public async Task<IActionResult> CreateFromOrder(CreatePalletDto dto)
        {
            var palletId = await _service.CreatePalletFromOrder(dto);
            return CreatedAtAction(nameof(GetById), new { id = palletId }, new { id = palletId });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, CreateEditPalletDto dto)
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

        [HttpPost("from-order-split")]
        public async Task<IActionResult> CreateFromOrderSplit([FromBody] CreatePalletSplitDto dto)
        {
            var palletIds = await _service.CreatePalletsFromOrderSplit(dto);
            return Ok(new { palletIds });
        }

        [HttpGet("by-order/{salesOrderId}")]
        public async Task<IActionResult> GetBySalesOrder(int salesOrderId)
        {
            var pallets = await _service.GetAllAsync();
            return Ok(pallets.Where(p => p.SalesOrderId == salesOrderId));
        }
    }
}
