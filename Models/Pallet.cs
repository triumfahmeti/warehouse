using System.Collections.Generic;
using Warehouse.Enums;

namespace Warehouse.Models
{
    public class Pallet : BaseEntity
    {
        public int Id { get; set; }
        public int SalesOrderId { get; set; }
        public SalesOrder SalesOrder { get; set; }
        public string PalletCode { get; set; }
        public PackagingType PackingType { get; set; }
        public ICollection<PalletItem> Items { get; set; } = new List<PalletItem>();
    }
}