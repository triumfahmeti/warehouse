namespace Warehouse.DTOs.SalesOrder
{
    public class SalesOrderDto
    {
        public int Id { get; set; }
        public int ClientId { get; set; }
        public string? ClientName { get; set; }
        public DateTime OrderDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public bool IsPriced { get; set; }   // te gjitha items kane cmim
        public List<SalesOrderItemDto> Items { get; set; } = new();
    }

    public class SalesOrderItemDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
    }
}
