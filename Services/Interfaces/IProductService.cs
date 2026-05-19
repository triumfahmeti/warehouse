using Warehouse.DTOs.Product;
using Warehouse.Models;

namespace Warehouse.Services.Interfaces
{
    public interface IProductService
    {
        Task<List<ProductDto>> GetAllAsync();
        Task<ProductDto?> GetByIdAsync(int id);
        Task<ProductDto?> GetBySKUAsync(string sku);
        Task<List<ProductDto>> GetByTypeAsync(string type);
        Task<ProductDto> CreateAsync(CreateEditProductDto dto);
        Task UpdateAsync(int id, CreateEditProductDto dto);
        Task DeleteAsync(int id);
    }
}