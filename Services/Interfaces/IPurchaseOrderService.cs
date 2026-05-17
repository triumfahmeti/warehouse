using Warehouse.DTOs.PurchaseOrder;

namespace Warehouse.Services.Interfaces
{
    public interface IPurchaseOrderService
    {
        Task<int> CreatePurchaseOrder(int supplierId, List<CreatePurchaseOrderItemDto> items);
        Task ApprovePurchaseOrder(int purchaseOrderId);
        Task ReceivePurchaseOrder(int purchaseOrderId, List<ReceivePurchaseOrderItemDto> items);
        Task CancelPurchaseOrder(int purchaseOrderId);
        Task ClosePurchaseOrder(int purchaseOrderId);
        Task AddReceivedStock(int purchaseOrderId, List<ReceivePurchaseOrderItemDto> items);
    }
}
