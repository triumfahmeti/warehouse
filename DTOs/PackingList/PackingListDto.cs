namespace Warehouse.DTOs.PackingList
{
    public class PackingListDto
    {
        public int Id { get; set; }
        public string PackingListNumber { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? Notes { get; set; }
        public int SalesOrderId { get; set; }
        public int WarehouseId { get; set; }
        public string WarehouseName { get; set; } = null!;
    }

   
}
