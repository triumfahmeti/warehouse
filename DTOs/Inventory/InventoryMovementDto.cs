using System;

namespace Warehouse.DTOs.Inventory
{
    public class InventoryMovementDto
    {
        public int InventoryId { get; set; }
        public int ProductId { get; set; }
        public int RaftId { get; set; }
        public string Action { get; set; } = string.Empty;
        public int? QuantityDelta { get; set; }
        public int QuantityOnHand { get; set; }
        public int ReservedQuantity { get; set; }
        public string? OldValue { get; set; }
        public string? NewValue { get; set; }
        public DateTime OccurredAt { get; set; }
    }
}
