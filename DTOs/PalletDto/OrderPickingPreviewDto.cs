namespace Warehouse.DTOs.Pallet
{
    public class OrderPickingPreviewDto
    {
        public int OrderId { get; set; }
        public string ClientName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public List<PickingItemPreviewDto> Items { get; set; } = new();
    }

    public class PickingItemPreviewDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public List<RaftLocationDto> Locations { get; set; } = new();
    }

    public class RaftLocationDto
    {
        public int RaftId { get; set; }
        public string RaftNumber { get; set; } = string.Empty;
        public string WarehouseName { get; set; } = string.Empty;
        public int ReservedQuantity { get; set; }
    }
}
