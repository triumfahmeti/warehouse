using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Models
{
    public class Setting : ITenantEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }

        public string Key { get; set; }
        public string Value { get; set; }

        public string? Description { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}