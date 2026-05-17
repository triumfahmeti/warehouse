using Warehouse.DTOs.Raft;
 
namespace Warehouse.Services.Interfaces
{
    public interface IRaftService
    {
        Task<IEnumerable<RaftDto>> GetAllAsync();
        Task<RaftDto?> GetByIdAsync(int id);
        Task<RaftDto> AddAsync(CreateEditRaftDto dto);
        Task UpdateAsync(int id, CreateEditRaftDto dto);
        Task DeleteAsync(int id);
    }
}