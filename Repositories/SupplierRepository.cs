using Warehouse.Services.Interfaces;
using Warehouse.Models;
using Warehouse.Interfaces;

namespace Warehouse.Repositories
{
    public class SupplierRepository : GenericRepository<Supplier>, ISupplierRepository
    {
        public SupplierRepository(AppDbContext context) : base(context)
        {
        }
    }
}