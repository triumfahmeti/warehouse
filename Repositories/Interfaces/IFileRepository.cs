using System.Collections.Generic;
using System.Threading.Tasks;
using FileModel = Warehouse.Models.File;

namespace Warehouse.Repositories.Interfaces
{
    public interface IFileRepository : IGenericRepository<FileModel>
    {
        Task<List<FileModel>> GetAllFilesAsync();
        Task<List<FileModel>> GetFilesByEntityAsync(string entity, int entityId);
    }
}