namespace Warehouse.DTOs.PurchaseOrder
{
    public class ReceivePurchaseOrderItemDto
    {
        public int PurchaseOrderItemId { get; set; }
        public int RaftId { get; set; }
        public int QuantityReceived { get; set; }
    }
}
