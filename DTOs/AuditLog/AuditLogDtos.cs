using System;

namespace Warehouse.DTOs.Audit
{
    public class AuditLogCreateDto
    {
        public string UserId { get; set; }
        public string Action { get; set; }
        public string Entity { get; set; }
        public int? EntityId { get; set; }
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        public string IpAddress { get; set; }
    }

    public class AuditLogResponseDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Action { get; set; }
        public string Entity { get; set; }
        public int? EntityId { get; set; }
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        public string IpAddress { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}