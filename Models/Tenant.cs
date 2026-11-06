using System;

namespace Warehouse.Models
{
    public class Tenant
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        // Identifikues i lexueshem, i perdorur ne URL/raportime. Unik globalisht.
        public string Slug { get; set; } = string.Empty;

        public string? ContactEmail { get; set; }
        public string? ContactPhone { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
