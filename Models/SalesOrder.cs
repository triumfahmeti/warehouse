using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.Enums;

namespace Warehouse.Models
{
    public class SalesOrder
    {
        public int Id { get; set; }
        public int ClientId { get; set; }
        public Client Client { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public SalesOrderStatus Status { get; set; } // New, Processing, Completed, Cancelled
        public ICollection<SalesOrderItem> SalesOrderItems { get; set; }
    }
}