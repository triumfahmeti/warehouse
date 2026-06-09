using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Models
{
    public class PalletItem
    {
        public int Id { get; set; }
        public int PalletId { get; set; }
        public Pallet Pallet { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; }
        public int Quantity { get; set; }

        // Rafti nga u mor fizikisht ky rresht gjatë pick-ut (nullable: rreshtat e
        // vjetër para këtij ndryshimi nuk e kanë). Vendoset nga inv.RaftId në pick.
        public int? RaftId { get; set; }
        public Raft? Raft { get; set; }
    }
}