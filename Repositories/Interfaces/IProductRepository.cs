using Warehouse.Models;
using Warehouse.Services.Interfaces;

namespace Warehouse.Repositories.Interfaces
{
    public interface IProductRepository : IGenericRepository<Product>
    {
        Task<Product?> GetBySKU(string sku);
        Task<List<Product>> GetByType(string type);
        Task<Product?> GetByBarcodeAsync(string barcode);
        Task<bool> BarcodeExistsAsync(string barcode, int? excludeId = null);
    }
}