using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Models
{
    public class Shipment : BaseEntity
    {
        public int Id { get; set; }
        public string ShipmentNumber { get; set; }
        public int WarehouseId { get; set; }
        public Warehouse Warehouse { get; set; }
        public int PackingListId { get; set; }
        public PackingList PackingList { get; set; }

        public string ShipmentStatus { get; set; } // Consider using an enum for ShipmentStatus for better type safety
        public string? Notes { get; set; }




    }
}