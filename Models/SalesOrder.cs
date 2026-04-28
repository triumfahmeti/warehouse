using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Models
{
    public class SalesOrder
    {
        public int Id { get; set; }
        public int ClientId { get; set; }
        public Client Client { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public string status { get; set; } // New, Processing, Completed, Cancelled
        public ICollection<SalesOrderItem> SalesOrderItems { get; set; }
    }
}