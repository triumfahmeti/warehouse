using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.Enums;

namespace Warehouse.DTOs.Client
{
    public class MyOrderDto
    {
        public int Id { get; set; }
        public string Number { get; set; } = string.Empty;
        public SalesOrderStatus Status { get; set; } = SalesOrderStatus.New;
        public decimal TotalAmount { get; set; }
        public int LineItemsCount { get; set; }    // lloje produktesh
        public int TotalQuantity { get; set; }
        public DateTime OrderDate { get; set; }
    }
}