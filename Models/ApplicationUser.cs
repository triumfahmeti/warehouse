using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace Warehouse.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string Name { get; set; }

        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string? CreatedById { get; set; }
        public Client? Client { get; set; }
        public ApplicationUser CreatedByUser { get; set; }
        public ICollection<RefreshToken> RefreshTokens { get; set; }
        public ICollection<AuditLog> AuditLogs { get; set; }
        public ICollection<Notification> Notifications { get; set; }

    }
}