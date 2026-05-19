namespace Warehouse.DTOs.AuditLogDto
{
    public class CreateEditAuditLogDto
    {
        public string UserId { get; set; } = null!;
        public string Action { get; set; } = null!;
        public string Entity { get; set; } = null!;
        public int? EntityId { get; set; }
        public string OldValue { get; set; } = null!;
        public string NewValue { get; set; } = null!;
        public string IpAddress { get; set; } = null!;
    }
}