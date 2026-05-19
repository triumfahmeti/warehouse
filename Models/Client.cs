using System.Collections.Generic;

namespace Warehouse.Models
{
    public class Client : BaseEntity
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }

        public ICollection<SalesOrder> SalesOrders { get; set; } = new List<SalesOrder>();
    }
}
