using Warehouse.DTOs.ShipmentDto;

namespace Warehouse.Services.Interfaces
{
    public interface IShipmentService
    {
        Task<List<ShipmentDto>> GetAllAsync();
        Task<ShipmentDto?> GetByIdAsync(int id);
        Task<ShipmentDto> CreateAsync(CreateEditShipmentDto dto);
        Task UpdateAsync(int id, CreateEditShipmentDto dto);
        Task MarkAsShippedAsync(int id);
        Task MarkAsDeliveredAsync(int id);
        Task CancelAsync(int id);
    }
}