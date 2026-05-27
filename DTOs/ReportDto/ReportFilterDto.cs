namespace Warehouse.DTOs.Reports
{
    public class ReportFilterDto
    {
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
        public string? Status { get; set; }
        public int? WarehouseId { get; set; }
        public string Format { get; set; } = "json"; // json, csv, excel
    }

    public class InventoryReportDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = null!;
        public string SKU { get; set; } = null!;
        public int TotalQuantity { get; set; }
        public int ReservedQuantity { get; set; }
        public int AvailableQuantity { get; set; }
        public string RaftName { get; set; } = null!;
        public string WarehouseName { get; set; } = null!;
    }

    public class SalesOrderReportDto
    {
        public int OrderId { get; set; }
        public string ClientName { get; set; } = null!;
        public string Status { get; set; } = null!;
        public decimal TotalAmount { get; set; }
        public int TotalItems { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ShipmentReportDto
    {
        public int ShipmentId { get; set; }
        public string ShipmentNumber { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string WarehouseName { get; set; } = null!;
        public string PackingListNumber { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }
}