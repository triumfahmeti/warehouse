using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class ShipmentRepository : GenericRepository<Shipment>, IShipmentRepository
    {
        private readonly AppDbContext _context;

        public ShipmentRepository(AppDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<Shipment?> GetWithDetails(int id)
        {
            return await _context.Shipments
                .Include(s => s.PackingList)
                    .ThenInclude(pl => pl.SalesOrder)
                .Include(s => s.PackingList)
                    .ThenInclude(pl => pl.Pallets)
                        .ThenInclude(p => p.Pallet)
                .Include(s => s.Warehouse)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<List<Shipment>> GetAllWithDetails()
        {
            return await _context.Shipments
                .Include(s => s.PackingList)
                    .ThenInclude(pl => pl.SalesOrder)
                        .ThenInclude(so => so.Client)  // ← shto
                .Include(s => s.Warehouse)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<Shipment?> GetByPackingList(int packingListId)
        {
            return await _context.Shipments
                .Include(s => s.PackingList)
                .FirstOrDefaultAsync(s => s.PackingListId == packingListId);
        }
    }
}