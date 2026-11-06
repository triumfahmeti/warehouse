namespace Warehouse.Models
{
    // Shenon entitetet qe i perkasin nje tenanti te vetem. AppDbContext u shton
    // automatikisht global query filter, indeks dhe FK, dhe ua cakton TenantId-in
    // gjate ruajtjes. Shih AppDbContext.OnModelCreating dhe ApplyTenantId.
    public interface ITenantEntity
    {
        int TenantId { get; set; }
    }
}
