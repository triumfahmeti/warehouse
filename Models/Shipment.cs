<<<<<<< HEAD
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.Enums;

=======
using Warehouse.Enums;
>>>>>>> a5e04a6a14f250ef8a18993aa85ff04180b746b3

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

<<<<<<< HEAD
        public ShipmentStatus Status { get; set; } = ShipmentStatus.Draft;
        //  public DateTime? ShippedAt { get; set; }
        // public DateTime? DeliveredAt { get; set; }
=======
        public ShipmentStatus ShipmentStatus { get; set; }
>>>>>>> a5e04a6a14f250ef8a18993aa85ff04180b746b3
        public string? Notes { get; set; }




    }
}