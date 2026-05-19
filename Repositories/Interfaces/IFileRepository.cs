using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.Models;

namespace Warehouse.Repositories.Interfaces
{
    public interface IFileRepository : IGenericRepository<File>
    {
        Task<List<File>> GetFilesByEntity(string entity, int entityId);
        Task<List<File>> GetAllFilesAsync();
    }
}