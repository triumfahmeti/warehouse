namespace Warehouse.DTOs.SettingDto
{
    public class SettingDto
    {
        public int Id { get; set; }
        public string Key { get; set; } = null!;
        public string Value { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime UpdatedAt { get; set; }
    }
}