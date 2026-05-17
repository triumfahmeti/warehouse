namespace Warehouse.DTOs.PalletItem
{
    public class PalletItemDto
    {
        public int Id { get; set; }
        public int PalletId { get; set; }
        public string? PalletCode { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }
    }
}