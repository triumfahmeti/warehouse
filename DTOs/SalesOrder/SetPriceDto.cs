using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.DTOs.SalesOrder
{
    public class SetPriceDto
    {
        public int SalesOrderItemId { get; set; }
        public decimal UnitPrice { get; set; }
    }
}