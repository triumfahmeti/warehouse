using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Warehouse.Repositories.Interfaces;
using FileModel = Warehouse.Models.File;

namespace Warehouse.Repositories.Implementations
{
    public class FileRepository : GenericRepository<FileModel>, IFileRepository
    {
        private readonly AppDbContext _context;

        public FileRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<List<FileModel>> GetAllFilesAsync()
        {
            return await _context.Files
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<FileModel>> GetFilesByEntityAsync(string entity, int entityId)
        {
            return await _context.Files
                .Where(f => f.Entity == entity && f.EntityId == entityId)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }
    }
}