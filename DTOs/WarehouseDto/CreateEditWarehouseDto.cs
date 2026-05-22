namespace Warehouse.DTOs.WarehouseDto
{
    public class CreateEditWarehouseDto
    {
        public string Name { get; set; } = null!;
        public string Location { get; set; } = null!;
        public string? Phone { get; set; }
        public string? Email { get; set; }
    }
}
