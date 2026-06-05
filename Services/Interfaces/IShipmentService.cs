using Warehouse.DTOs.ShipmentDto;


namespace Warehouse.Services.Interfaces
{
    public interface IShipmentService
    {
        Task<List<ShipmentDto>> GetAllAsync();
        Task<ShipmentDto?> GetByIdAsync(int id);
        Task<int> CreateShipment(CreateEditShipmentDto dto);
        Task MarkShipmentReady(int shipmentId);
        Task Ship(int shipmentId);
        Task Deliver(int shipmentId);
        Task CancelAsync(int id);
        Task<List<ShipmentDto>> GetByUserAsync(string userId);

    }
}