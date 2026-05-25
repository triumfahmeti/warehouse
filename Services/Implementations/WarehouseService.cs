using Warehouse.DTOs.WarehouseDto;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class WarehouseService : IWarehouseService
    {
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly AppDbContext _context;

        public WarehouseService(IWarehouseRepository warehouseRepository, AppDbContext context)
        {
            _warehouseRepository = warehouseRepository;
            _context = context;
        }

        public async Task<IEnumerable<WarehouseDto>> GetAllAsync()
        {
            var warehouses = await _warehouseRepository.GetAllAsync();
            return warehouses.Select(MapToDto);
        }

        public async Task<WarehouseDto?> GetByIdAsync(int id)
        {
            var warehouse = await _warehouseRepository.GetByIdAsync(id);
            return warehouse == null ? null : MapToDto(warehouse);
        }

        public async Task<WarehouseDto> AddAsync(CreateEditWarehouseDto dto)
        {
            ValidateDto(dto);

            var warehouse = new Warehouse.Models.Warehouse
            {
                Name = dto.Name.Trim(),
                Location = dto.Location.Trim(),
                Phone = dto.Phone?.Trim(),
                Email = dto.Email?.Trim()
            };

            await _warehouseRepository.AddAsync(warehouse);
            await _context.SaveChangesAsync();
            return MapToDto(warehouse);
        }

        public async Task UpdateAsync(int id, CreateEditWarehouseDto dto)
        {
            ValidateDto(dto);

            var warehouse = await _warehouseRepository.GetByIdAsync(id);
            if (warehouse == null)
                throw new Exception("Warehouse not found");

            warehouse.Name = dto.Name.Trim();
            warehouse.Location = dto.Location.Trim();
            warehouse.Phone = dto.Phone?.Trim();
            warehouse.Email = dto.Email?.Trim();

            await _warehouseRepository.UpdateAsync(warehouse);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var warehouse = await _warehouseRepository.GetByIdAsync(id);
            if (warehouse == null)
                throw new Exception("Warehouse not found");

            await _warehouseRepository.DeleteAsync(id);
            await _context.SaveChangesAsync();
        }

        private static void ValidateDto(CreateEditWarehouseDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new Exception("Name is required");

            if (string.IsNullOrWhiteSpace(dto.Location))
                throw new Exception("Location is required");
        }

        private static WarehouseDto MapToDto(Warehouse.Models.Warehouse w) => new WarehouseDto
        {
            Id = w.Id,
            Name = w.Name,
            Location = w.Location,
            Phone = w.Phone,
            Email = w.Email
        };
    }
}
