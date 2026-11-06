using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.Enums;

namespace Warehouse.Models
{
    public class StockMovement : BaseEntity, ITenantEntity
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; } = null!;
        public int RaftId { get; set; }
        public Raft Raft { get; set; } = null!;

        public int TenantId { get; set; }
        public int QuantityOnHand { get; set; }
        public StockMovementType MovementType { get; set; }

    }
}