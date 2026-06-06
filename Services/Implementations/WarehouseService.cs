using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.WarehouseDto;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class WarehouseService : IWarehouseService
    {
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly AppDbContext _context;
        private readonly IRealtimeNotifier _realtime;

        public WarehouseService(IWarehouseRepository warehouseRepository, AppDbContext context, IRealtimeNotifier realtime)
        {
            _warehouseRepository = warehouseRepository;
            _context = context;
            _realtime = realtime;
        }

        public async Task<IEnumerable<WarehouseDto>> GetAllAsync()
        {
            // Llogaritja behet ne DB: per cdo depo, shuma e MaxCapacity te rafteve
            // dhe shuma e QuantityOnHand te inventarit ne ato rafte.
            var warehouses = await _context.Warehouses
                .Select(w => new WarehouseDto
                {
                    Id = w.Id,
                    Name = w.Name,
                    Location = w.Location,
                    Phone = w.Phone,
                    Email = w.Email,
                    RaftCount = w.Rafts.Count,
                    MaxCapacity = w.Rafts.Sum(r => (int?)r.MaxCapacity) ?? 0,
                    UsedCapacity = w.Rafts
                        .SelectMany(r => r.Inventories)
                        .Sum(i => (int?)i.QuantityOnHand) ?? 0
                })
                .ToListAsync();

            // Perqindja llogaritet ne memorie (Math.Round/Min nuk perkthehen ne SQL).
            foreach (var w in warehouses)
            {
                w.Utilization = w.MaxCapacity > 0
                    ? (int)Math.Round(Math.Min(100d, (double)w.UsedCapacity / w.MaxCapacity * 100d))
                    : 0;
            }

            return warehouses;
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
            await _realtime.ResourceChangedAsync("warehouses");
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
            await _realtime.ResourceChangedAsync("warehouses");
        }

        public async Task DeleteAsync(int id)
        {
            var warehouse = await _warehouseRepository.GetByIdAsync(id);
            if (warehouse == null)
                throw new Exception("Warehouse not found");

            await _warehouseRepository.DeleteAsync(id);
            await _context.SaveChangesAsync();
            await _realtime.ResourceChangedAsync("warehouses");
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
