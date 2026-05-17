namespace Warehouse.DTOs.Raft
{
    public class CreateEditRaftDto
    {
        public string RaftNumber { get; set; }
        public int WarehouseId { get; set; }
        public int MaxCapacity { get; set; }
    }
}
 