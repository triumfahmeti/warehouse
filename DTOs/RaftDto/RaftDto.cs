namespace Warehouse.DTOs.Raft
{
    public class RaftDto
    {
        public int Id { get; set; }
        public string RaftNumber { get; set; }
        public int WarehouseId { get; set; }
        public string? WarehouseName { get; set; }
        public int MaxCapacity { get; set; }
        public int UsedCapacity { get; set; } // shuma e QuantityOnHand te inventarit ne kete raft (numri i artikujve)
    }
}
 