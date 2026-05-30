namespace Warehouse.DTOs.Admin
{
    public class AdminDashboardStatsDto
    {
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int InactiveUsers { get; set; }
        public int TotalOrders { get; set; }
        public int TotalShipments { get; set; }
        public int TotalAuditLogs { get; set; }
        public List<RecentLoginDto> RecentLogins { get; set; } = new();
        public List<CriticalActionDto> CriticalActions { get; set; } = new();
    }

    public class RecentLoginDto
    {
        public string UserId { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public DateTime LoginAt { get; set; }
    }

    public class CriticalActionDto
    {
        public int Id { get; set; }
        public string UserName { get; set; } = null!;
        public string Action { get; set; } = null!;
        public string Entity { get; set; } = null!;
        public int? EntityId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
