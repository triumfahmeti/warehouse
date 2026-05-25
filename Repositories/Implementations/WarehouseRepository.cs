using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class WarehouseRepository : GenericRepository<Warehouse.Models.Warehouse>, IWarehouseRepository
    {
        public WarehouseRepository(AppDbContext context) : base(context)
        {
        }
    }
}
