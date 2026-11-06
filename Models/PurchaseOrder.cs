using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Warehouse.Enums;

namespace Warehouse.Models
{
    public class PurchaseOrder : BaseEntity, ITenantEntity
    {
        public int Id { get; set; }
        public int SupplierId { get; set; }
        public Supplier Supplier { get; set; }
        public int TenantId { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public DateTime? ExpectedDeliveryDate { get; set; }
        public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Pending;

        public ICollection<PurchaseOrderItem> Items { get; set; }

        // Vendoset çdo herë që pranohet një linjë. Ky ndryshim e bën porosinë
        // "të modifikuar", prandaj RowVersion kontrollon konkurrencën.
        public DateTime? LastReceivedAt { get; set; }

        [Timestamp]
        public byte[] RowVersion { get; set; } = null!;


        public bool CanCancel =>
            Status == PurchaseOrderStatus.Pending ||
            Status == PurchaseOrderStatus.Approved;

        public void Cancel()
        {
            if (!CanCancel)
                throw new InvalidOperationException(
                    $"Porosia me status '{Status}' nuk mund të anulohet.");

            Status = PurchaseOrderStatus.Cancelled;
        }
    }
}