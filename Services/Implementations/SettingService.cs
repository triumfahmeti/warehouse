using Warehouse.DTOs.SettingDto;
using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class SettingService : ISettingService
    {
        private readonly ISettingRepository _settingRepository;
        private readonly AppDbContext _context;

        public SettingService(
            ISettingRepository settingRepository,
            AppDbContext context)
        {
            _settingRepository = settingRepository;
            _context = context;
        }

        public async Task<List<SettingDto>> GetAllAsync()
        {
            var list = await _settingRepository.GetAllWithDetails();
            return list.Select(s => ToDto(s)).ToList();
        }

        public async Task<SettingDto?> GetByIdAsync(int id)
        {
            var setting = await _settingRepository.GetWithDetails(id);
            return setting == null ? null : ToDto(setting);
        }

        public async Task<SettingDto> CreateAsync(CreateEditSettingDto dto)
        {
            var setting = new Setting
            {
                Key = dto.Key,
                Value = dto.Value,
                Description = dto.Description
            };

            await _settingRepository.AddAsync(setting);
            await _context.SaveChangesAsync();

            return ToDto(setting);
        }

        public async Task UpdateAsync(int id, CreateEditSettingDto dto)
        {
            var setting = await _settingRepository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("Setting not found");

            setting.Key = dto.Key;
            setting.Value = dto.Value;
            setting.Description = dto.Description;
            setting.UpdatedAt = DateTime.UtcNow;

            await _settingRepository.UpdateAsync(setting);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var setting = await _settingRepository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("Setting not found");

            await _settingRepository.DeleteAsync(id);
            await _context.SaveChangesAsync();
        }

        private static SettingDto ToDto(Setting s) => new()
        {
            Id = s.Id,
            Key = s.Key,
            Value = s.Value,
            Description = s.Description,
            UpdatedAt = s.UpdatedAt
        };
    }
}