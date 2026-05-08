using Warehouse.Services.Interfaces;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Repositories.Implementations;

namespace Warehouse.Repositories
{
    public class SupplierRepository : GenericRepository<Supplier>, ISupplierRepository
    {
        public SupplierRepository(AppDbContext context) : base(context)
        {
        }
    }
}