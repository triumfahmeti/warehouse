using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.DTOs.ShipmentDto
{
    public class CreateEditShipmentDto
    {
       public int PackingListId { get; set; }
        public int WarehouseId { get; set; }
        public string? Notes { get; set; }
        
          }
}