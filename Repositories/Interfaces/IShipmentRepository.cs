using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Repositories.Interfaces
{
    public interface IShipmentRepository : IGenericRepository<Shipment>
    {
        Task<Shipment?> GetWithDetails(int id);
        Task<List<Shipment>> GetAllWithDetails();
        Task<Shipment?> GetByPackingList(int packingListId);
    }
}