using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Models
{
    public class Raft : BaseEntity
    {
        public int Id { get; set; }
        public string RaftNumber { get; set; }
        public int WarehouseId { get; set; }
        public Warehouse Warehouse { get; set; }
        public int MaxCapacity { get; set; }
        public ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();
        public ICollection<Pallet> Pallets { get; set; } = new List<Pallet>();
    }
}