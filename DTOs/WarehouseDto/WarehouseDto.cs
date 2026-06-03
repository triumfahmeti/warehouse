namespace Warehouse.DTOs.WarehouseDto
{
    public class WarehouseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Location { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Email { get; set; }

        // Statistika te llogaritura nga raftet/inventari i depos.
        public int RaftCount { get; set; }
        public int MaxCapacity { get; set; }   // shuma e MaxCapacity te te gjitha rafteve
        public int UsedCapacity { get; set; }  // shuma e QuantityOnHand te inventarit ne ato rafte
        public int Utilization { get; set; }   // perqindje 0-100 (UsedCapacity / MaxCapacity)
    }
}
