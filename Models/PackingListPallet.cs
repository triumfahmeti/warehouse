using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Models
{
    public class PackingListPallet : ITenantEntity
    {
        public int Id { get; set; }
        public int PackingListId { get; set; }
        public PackingList PackingList { get; set; }
        public int PalletId { get; set; }
        public Pallet Pallet { get; set; }
        public int TenantId { get; set; }
    }
}