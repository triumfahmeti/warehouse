using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Models
{
    public class Inventory : BaseEntity
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; }
        public int RaftId { get; set; }
        public Raft Raft { get; set; }
        public int ReservedQuantity { get; set; }
        public int QuantityOnHand { get; set; }
        public int AvailableQuantity => QuantityOnHand - ReservedQuantity;
        public DateTime LastUpdated
        { get; set; } = DateTime.UtcNow;
    }
}