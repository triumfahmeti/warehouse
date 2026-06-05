using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.DTOs.ShipmentDto
{
    public class ShipmentDto
    {
        public int Id { get; set; }
        public string ShipmentNumber { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? Notes { get; set; }
        public int WarehouseId { get; set; }
        public string WarehouseName { get; set; } = null!;
        public int PackingListId { get; set; }
        public string PackingListNumber { get; set; } = null!;
                public DateTime CreatedAt { get; set; }  // ← shto këtë

    }

}