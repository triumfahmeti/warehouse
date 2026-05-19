using System.Collections.Generic;

namespace Warehouse.DTOs.PackingList
{
    public class CreatePackingListDto
    {
        public int WarehouseId { get; set; }
        public int SalesOrderId { get; set; }
        public List<int> PalletIds { get; set; } = new List<int>();
    }
}
