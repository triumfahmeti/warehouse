using System.Collections.Generic;
using System.Threading.Tasks;
using Warehouse.DTOs.Setting;

namespace Warehouse.Services.Interfaces
{
    public interface ISettingsService
    {
        Task<SettingResponseDto?> GetSetting(string key);
        Task<SettingResponseDto?> UpdateSetting(string key, SettingUpdateDto dto);
        Task<List<SettingResponseDto>> GetAllSettings();
    }
}