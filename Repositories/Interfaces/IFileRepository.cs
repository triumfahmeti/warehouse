using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;


namespace Warehouse.Repositories.Interfaces
{
    public interface IFileRepository : IGenericRepository<Warehouse.Models.File>
    {
        Task<Warehouse.Models.File?> GetWithDetails(int id);
        Task<List<Warehouse.Models.File>> GetAllWithDetails();
    }
}