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

        public async Task<RaftDto> AddAsync(CreateEditRaftDto dto)
        {
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

        private static RaftDto MapToDto(Raft r) => new RaftDto
        {
            Id = r.Id,
            RaftNumber = r.RaftNumber,
            WarehouseId = r.WarehouseId,
            WarehouseName = r.Warehouse?.Name,
            MaxCapacity = r.MaxCapacity
        };
    }
}