namespace Warehouse.DTOs.Tenant
{
    // Statistika te nivelit te platformes, vetem per SuperAdmin-in. Mblidhen me
    // IgnoreQueryFilters(), prandaj endpoint-i qe i kthen eshte i mbyllur me rol + leje.
    public class PlatformStatsDto
    {
        public int TotalTenants { get; set; }
        public int ActiveTenants { get; set; }
        public int SuspendedTenants { get; set; }
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int TotalProducts { get; set; }
        public int TotalSalesOrders { get; set; }
        public int TotalShipments { get; set; }
        public List<TenantUsageDto> Tenants { get; set; } = new();
    }

    public class TenantUsageDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int Users { get; set; }
        public int ActiveUsers { get; set; }
        public int Products { get; set; }
        public int SalesOrders { get; set; }
        public int Shipments { get; set; }
        // Null per nje tenant te sapokrijuar qe s'ka ende asnje audit log.
        public DateTime? LastActivityAt { get; set; }
    }
}
