namespace Warehouse.DTOs.Product
{

    public class CreateEditProductDto
    {
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string SKU { get; set; } = null!;
        public decimal Length { get; set; }
        public decimal Width { get; set; }
        public decimal Height { get; set; }
        public decimal Weight { get; set; }
        public string Type { get; set; } = null!;
    }
}