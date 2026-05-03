using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Models
{
    public class PackingList : BaseEntity
    {
        public int Id { get; set; }
        public string PackingListNumber { get; set; }
        public int WarehouseId { get; set; }
        public Warehouse Warehouse { get; set; }
        public int SalesOrderId { get; set; }
        public SalesOrder SalesOrder { get; set; }
        public string? Notes { get; set; }
        public string PackingListStatus { get; set; } // Consider using an enum for PackingListStatus for better type safety
        public ICollection<PackingListPallet> Pallets { get; set; }

    }
}