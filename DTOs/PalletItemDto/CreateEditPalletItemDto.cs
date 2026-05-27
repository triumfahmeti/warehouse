namespace Warehouse.DTOs.PalletItem
{
    public class CreateEditPalletItemDto
    {
        public int PalletId { get; set; }
        public int ProductId { get; set; }
        public int Quantity { get; set; }

    }
}