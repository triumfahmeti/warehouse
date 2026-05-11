using System;
using System.Collections.Generic;
using Warehouse.Enums;

namespace Warehouse.Models
{
    public class PurchaseOrder : BaseEntity
    {
        public int Id { get; set; }
        public int SupplierId { get; set; }
        public Supplier Supplier { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpectedDeliveryDate { get; set; }
        public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Pending;

        public ICollection<PurchaseOrderItem> Items { get; set; }
    }
}