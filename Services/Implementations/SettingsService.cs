using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.DTOs.Setting;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class SettingsService : ISettingsService
    {
        private readonly ISettingsRepository _settingsRepository;

        public SettingsService(ISettingsRepository settingsRepository)
        {
            _settingsRepository = settingsRepository;
        }

        public async Task<SettingResponseDto?> GetSetting(string key)
        {
            var setting = await _settingsRepository.GetByKeyAsync(key);
            return setting == null ? null : Map(setting);
        }

        public async Task<SettingResponseDto?> UpdateSetting(string key, SettingUpdateDto dto)
        {
            var updated = await _settingsRepository.UpdateByKeyAsync(key, dto.Value, dto.Description);
            return updated == null ? null : Map(updated);
        }

        public async Task<List<SettingResponseDto>> GetAllSettings()
        {
            var list = await _settingsRepository.GetAllSettingsAsync();
            return list.Select(Map).ToList();
        }

        private static SettingResponseDto Map(Setting s) => new SettingResponseDto
        {
            Id = s.Id,
            Key = s.Key,
            Value = s.Value,
            Description = s.Description,
            UpdatedAt = s.UpdatedAt
        };
    }
}