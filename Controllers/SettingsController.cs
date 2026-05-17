using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Warehouse.DTOs.Setting;
using Warehouse.Services.Interfaces;

namespace Warehouse.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly ISettingsService _settingsService;

        public SettingsController(ISettingsService settingsService)
        {
            _settingsService = settingsService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllSettings()
        {
            var list = await _settingsService.GetAllSettings();
            return Ok(list);
        }

        [HttpGet("{key}")]
        public async Task<IActionResult> GetSetting(string key)
        {
            var setting = await _settingsService.GetSetting(key);
            return setting == null ? NotFound() : Ok(setting);
        }

        [HttpPut("{key}")]
        public async Task<IActionResult> UpdateSetting(string key, [FromBody] SettingUpdateDto dto)
        {
            var updated = await _settingsService.UpdateSetting(key, dto);
            return updated == null ? NotFound() : Ok(updated);
        }
    }
}