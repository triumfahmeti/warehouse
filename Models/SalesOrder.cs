
using System;
using System.Collections.Generic;
using Warehouse.Enums;

namespace Warehouse.Models
{
    public class SalesOrder : BaseEntity, ITenantEntity
    {
        public int Id { get; set; }
        public int ClientId { get; set; }
        public Client Client { get; set; } = null!;
        public int TenantId { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public SalesOrderStatus Status { get; set; }
        public decimal TotalAmount { get; set; }
        public ICollection<SalesOrderItem> SalesOrderItems { get; set; } = new List<SalesOrderItem>();
    }
}
