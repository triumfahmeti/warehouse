using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class SupplierRepository : GenericRepository<Supplier>, ISupplierRepository
    {
        public SupplierRepository(AppDbContext context) : base(context)
        {
        }
    }
}