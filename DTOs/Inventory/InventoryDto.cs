namespace Warehouse.DTOs.Inventory
{
    public class InventoryDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? Sku { get; set; }
        public int RaftId { get; set; }
        public string? RaftNumber { get; set; }
        public string? WarehouseName { get; set; }
        public int QuantityOnHand { get; set; }
        public int ReservedQuantity { get; set; }
        public int AvailableQuantity { get; set; }
    }
}
