namespace Warehouse.DTOs.WarehouseDto
{
    public class WarehouseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Location { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Email { get; set; }
    }
}
