using Warehouse.Models;

namespace Warehouse.Services.Interfaces
{
    public interface IShipmentService
    {
        Task<List<Shipment>> GetAllAsync();
        Task<Shipment?> GetByIdAsync(int id);
        Task<Shipment> CreateAsync(int packingListId, int warehouseId, string? notes);
        Task MarkAsShippedAsync(int id);
        Task MarkAsDeliveredAsync(int id);
        Task CancelAsync(int id);
    }
}