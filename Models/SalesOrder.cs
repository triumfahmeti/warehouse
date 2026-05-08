using System;
<<<<<<< HEAD

namespace Warehouse.Models
{
    public class SalesOrder : BaseEntity
    {
        public int Id { get; set; }
        public int ClientId { get; set; }
        public Client Client { get; set; } = null!;
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Pending";
        public decimal TotalAmount { get; set; }
    }
}
=======
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
>>>>>>> origin/main
