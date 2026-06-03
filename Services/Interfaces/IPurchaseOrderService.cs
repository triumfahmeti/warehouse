using Warehouse.DTOs.PurchaseOrder;

namespace Warehouse.Services.Interfaces
{
    public interface IPurchaseOrderService
    {
        Task<List<PurchaseOrderDto>> GetAllAsync();
        Task<PurchaseOrderDto?> GetByIdAsync(int purchaseOrderId);
        Task<int> CreatePurchaseOrder(int supplierId, DateTime? expectedDeliveryDate, List<CreatePurchaseOrderItemDto> items);
        Task ReceivePurchaseOrder(int purchaseOrderId, List<ReceivePurchaseOrderItemDto> items);
        Task CancelPurchaseOrder(int purchaseOrderId);
        Task ClosePurchaseOrder(int purchaseOrderId);
        Task AddReceivedStock(int purchaseOrderId, List<ReceivePurchaseOrderItemDto> items);
    }
}
