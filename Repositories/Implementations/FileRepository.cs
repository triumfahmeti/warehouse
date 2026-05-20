using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class FileRepository : GenericRepository<Warehouse.Models.File>, IFileRepository
    {
        private readonly AppDbContext _context;

        public FileRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Warehouse.Models.File?> GetWithDetails(int id)
        {
            return await _context.Files
                .Include(f => f.User)
                .FirstOrDefaultAsync(f => f.Id == id);
        }

        public async Task<List<Warehouse.Models.File>> GetAllWithDetails()
        {
            return await _context.Files
                .Include(f => f.User)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();
        }
    }
}