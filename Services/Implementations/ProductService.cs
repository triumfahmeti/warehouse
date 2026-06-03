using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.Product;
using Warehouse.Enums;
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

            // Stoku fizik i lire per produkt (QuantityOnHand − Reserved, neper rafte).
            var stockMap = await _context.Inventories
                .GroupBy(i => i.ProductId)
                .Select(g => new { ProductId = g.Key, Available = g.Sum(i => i.QuantityOnHand - i.ReservedQuantity) })
                .ToDictionaryAsync(x => x.ProductId, x => x.Available);

            // Demanda e porosive ende te pakonfirmuara (status New) — kane "zene" stok pa rezervuar.
            var pendingMap = await _context.SalesOrderItems
                .Where(soi => soi.SalesOrder.Status == SalesOrderStatus.New)
                .GroupBy(soi => soi.ProductId)
                .Select(g => new { ProductId = g.Key, Demand = g.Sum(x => x.Quantity) })
                .ToDictionaryAsync(x => x.ProductId, x => x.Demand);

            return products.Select(p =>
            {
                var dto = ToDto(p);
                var physical = stockMap.TryGetValue(p.Id, out var s) ? s : 0;
                var pending = pendingMap.TryGetValue(p.Id, out var d) ? d : 0;
                dto.Stock = physical;
                dto.AvailableToOrder = Math.Max(0, physical - pending);
                return dto;
            }).ToList();
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
                Type = ParseType(dto.Type)
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
            product.Type = ParseType(dto.Type);

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
            Type = p.Type.ToString()
        };

        // Parsim i sigurt string -> ProductType me mesazh te qarte per vlera te pavlefshme.
        private static ProductType ParseType(string type)
        {
            if (!Enum.TryParse<ProductType>(type, ignoreCase: true, out var parsed) || !Enum.IsDefined(parsed))
                throw new InvalidOperationException(
                    $"Invalid product type '{type}'. Allowed: {string.Join(", ", Enum.GetNames<ProductType>())}");
            return parsed;
        }
    }
}