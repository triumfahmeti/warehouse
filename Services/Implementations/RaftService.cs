using Warehouse.DTOs.Raft;
using Warehouse.Repositories.Interfaces;

using Warehouse.Models;
using Warehouse.Services.Interfaces;



namespace Warehouse.Services.Implementations
{
    public class RaftService : IRaftService
    {
        private readonly IRaftRepository _repo;
        private readonly AppDbContext _context;

        public RaftService(IRaftRepository repo, AppDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        public async Task<IEnumerable<RaftDto>> GetAllAsync()
        {
            var rafts = await _repo.GetAllWithDetails();
            return rafts.Select(MapToDto);
        }

        public async Task<RaftDto?> GetByIdAsync(int id)
        {
            var raft = await _repo.GetWithDetails(id);
            return raft == null ? null : MapToDto(raft);
        }

        public async Task<IEnumerable<RaftDto>> GetByWarehouseIdAsync(int warehouseId)
        {
            var rafts = await _repo.GetByWarehouseId(warehouseId);
            return rafts.Select(MapToDto);
        }

        public async Task<RaftDto?> GetByRaftNumberAsync(string raftNumber)
        {
            var raft = await _repo.GetByRaftNumber(raftNumber);
            return raft == null ? null : MapToDto(raft);
        }

        public async Task<RaftDto> AddAsync(CreateEditRaftDto dto)
        {
            await ValidateDtoAsync(dto);

            var raft = new Raft
            {
                RaftNumber = dto.RaftNumber,
                WarehouseId = dto.WarehouseId,
                MaxCapacity = dto.MaxCapacity
            };

            await _repo.AddAsync(raft);
            await _context.SaveChangesAsync();
            return MapToDto(raft);
        }

        public async Task UpdateAsync(int id, CreateEditRaftDto dto)
        {
            await ValidateDtoAsync(dto);

            var raft = await _repo.GetByIdAsync(id);
            if (raft == null)
                throw new Exception("Raft not found");

            raft.RaftNumber = dto.RaftNumber;
            raft.WarehouseId = dto.WarehouseId;
            raft.MaxCapacity = dto.MaxCapacity;

            await _repo.UpdateAsync(raft);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var raft = await _repo.GetByIdAsync(id);
            if (raft == null)
                throw new Exception("Raft not found");

            await _repo.DeleteAsync(id);
            await _context.SaveChangesAsync();
        }

        private async Task ValidateDtoAsync(CreateEditRaftDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RaftNumber))
                throw new Exception("Raft number is required");

            if (dto.MaxCapacity <= 0)
                throw new Exception("Max capacity must be greater than zero");

            var warehouse = await _context.Warehouses.FindAsync(dto.WarehouseId);
            if (warehouse == null)
                throw new Exception("Warehouse not found");
        }

        private static RaftDto MapToDto(Raft r) => new RaftDto
        {
            Id = r.Id,
            RaftNumber = r.RaftNumber,
            WarehouseId = r.WarehouseId,
            WarehouseName = r.Warehouse?.Name,
            MaxCapacity = r.MaxCapacity,
            // Inventories perfshihet ne GetAllWithDetails/GetWithDetails; ndryshe mbetet liste boshe -> 0.
            UsedCapacity = r.Inventories?.Sum(i => i.QuantityOnHand) ?? 0
        };
    }
}