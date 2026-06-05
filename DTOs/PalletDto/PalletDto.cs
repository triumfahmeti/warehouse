using Warehouse.DTOs.PalletItem;

namespace Warehouse.DTOs.Pallet
{
    public class PalletDto
    {
        public int Id { get; set; }
        public string PalletCode { get; set; }
        public string? PackingType { get; set; }
        public int SalesOrderId { get; set; }
        public List<PalletItemDto> Items { get; set; } = new();
        public int TotalQuantity => Items.Sum(i => i.Quantity);
    }
}
 