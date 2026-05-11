using Warehouse.Enums;

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

        public ShipmentStatus ShipmentStatus { get; set; }
        public string? Notes { get; set; }




    }
}