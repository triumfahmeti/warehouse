using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Models
{
    public class AuditLog
    {
        public int Id { get; set; }

        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

        public string Action { get; set; }
        public string Entity { get; set; }
        public int? EntityId { get; set; }

        public string OldValue { get; set; }
        public string NewValue { get; set; }

        public string IpAddress { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}