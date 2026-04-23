using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Models
{
    public class Pallet : BaseEntity
    {
        public int Id { get; set; }
        public string PalletCode { get; set; }
        public int RaftId { get; set; }
        public Raft Raft { get; set; }
        public string PackingType { get; set; } // Consider using an enum for PackingType for better type safety

        public ICollection<PalletItem> Items { get; set; }
    }
}