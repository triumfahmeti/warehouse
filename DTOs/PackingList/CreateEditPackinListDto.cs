namespace Warehouse.DTOs.PackingListDto
{
    public class CreateEditPackingListDto
    {
        public string PackingListNumber { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? Notes { get; set; }
        public int SalesOrderId { get; set; }
        public int WarehouseId { get; set; }
        public string WarehouseName { get; set; } = null!;
    }

   
}
