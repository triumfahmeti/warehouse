using Warehouse.DTOs.Product;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _repository;
        private readonly AppDbContext _context;

        public ProductService(IProductRepository repository, AppDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        public async Task<List<ProductDto>> GetAllAsync()
        {
            var products = await _repository.GetAllAsync();
            return products.Select(p => ToDto(p)).ToList();
        }

        public async Task<ProductDto?> GetByIdAsync(int id)
        {
            var product = await _repository.GetByIdAsync(id);
            return product == null ? null : ToDto(product);
        }

        public async Task<ProductDto?> GetBySKUAsync(string sku)
        {
            var product = await _repository.GetBySKU(sku);
            return product == null ? null : ToDto(product);
        }

        public async Task<List<ProductDto>> GetByTypeAsync(string type)
        {
            var products = await _repository.GetByType(type);
            return products.Select(p => ToDto(p)).ToList();
        }

        public async Task<ProductDto> CreateAsync(CreateEditProductDto dto)
        {
            var existing = await _repository.GetBySKU(dto.SKU);
            if (existing != null)
                throw new InvalidOperationException($"Product with SKU '{dto.SKU}' already exists");

            var product = new Product
            {
                Name = dto.Name,
                Description = dto.Description,
                SKU = dto.SKU,
                Length = dto.Length,
                Width = dto.Width,
                Height = dto.Height,
                Weight = dto.Weight,
                Type = dto.Type
            };

            await _repository.AddAsync(product);
            await _context.SaveChangesAsync();
            return ToDto(product);
        }

        public async Task UpdateAsync(int id, CreateEditProductDto dto)
        {
            var product = await _repository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("Product not found");

            var existing = await _repository.GetBySKU(dto.SKU);
            if (existing != null && existing.Id != id)
                throw new InvalidOperationException($"Product with SKU '{dto.SKU}' already exists");

            product.Name = dto.Name;
            product.Description = dto.Description;
            product.SKU = dto.SKU;
            product.Length = dto.Length;
            product.Width = dto.Width;
            product.Height = dto.Height;
            product.Weight = dto.Weight;
            product.Type = dto.Type;

            await _repository.UpdateAsync(product);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var product = await _repository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("Product not found");

            await _repository.DeleteAsync(id);
            await _context.SaveChangesAsync();
        }

        private static ProductDto ToDto(Product p) => new()
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            SKU = p.SKU,
            Length = p.Length,
            Width = p.Width,
            Height = p.Height,
            Weight = p.Weight,
            Type = p.Type
        };
    }
}