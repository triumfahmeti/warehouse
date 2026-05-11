namespace Warehouse.DTOs.PurchaseOrder
{
    public class CreatePurchaseOrderDto
    {
        public int SupplierId { get; set; }
        public List<CreatePurchaseOrderItemDto> Items { get; set; }
    }
}
