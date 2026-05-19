using System.Collections.Generic;
<<<<<<< HEAD
using System.Linq;
using System.Threading.Tasks;
=======
>>>>>>> a5e04a6a14f250ef8a18993aa85ff04180b746b3
using Warehouse.Enums;

namespace Warehouse.Models
{
    public class PackingList : BaseEntity
    {
        public int Id { get; set; }
        public string PackingListNumber { get; set; }
        public int WarehouseId { get; set; }
        public Warehouse Warehouse { get; set; }
        public int SalesOrderId { get; set; }
        public SalesOrder SalesOrder { get; set; }
        public string? Notes { get; set; }
<<<<<<< HEAD
        public PackingListStatus Status { get; set; } = PackingListStatus.Draft;
        public ICollection<PackingListPallet> Pallets { get; set; }
=======
        public PackingListStatus PackingListStatus { get; set; }
        public ICollection<PackingListPallet> Pallets { get; set; } = new List<PackingListPallet>();
>>>>>>> a5e04a6a14f250ef8a18993aa85ff04180b746b3

    }
}