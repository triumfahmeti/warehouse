<<<<<<< HEAD
using System.Collections.Generic;
=======
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
>>>>>>> origin/main

namespace Warehouse.Models
{
    public class Client : BaseEntity
    {
        public int Id { get; set; }
<<<<<<< HEAD
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }

        public ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
    }
}
=======
        public string Name { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }
        public ICollection<SalesOrder> SalesOrders { get; set; }
    }
}
>>>>>>> origin/main
