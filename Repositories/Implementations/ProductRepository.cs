using Microsoft.EntityFrameworkCore;
using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class ProductRepository : GenericRepository<Product>, IProductRepository
    {
        private readonly AppDbContext _context;

        public ProductRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Product?> GetBySKU(string sku)
        {
            return await _context.Products
                .FirstOrDefaultAsync(p => p.SKU == sku);
        }

        public async Task<List<Product>> GetByType(string type)
        {
            if (!Enum.TryParse<ProductType>(type, ignoreCase: true, out var parsed))
                return new List<Product>();

            return await _context.Products
                .Where(p => p.Type == parsed)
                .ToListAsync();
        }
    }
}