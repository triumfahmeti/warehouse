namespace Warehouse.DTOs.SettingDto
{
    public class CreateEditSettingDto
    {
        public string Key { get; set; } = null!;
        public string Value { get; set; } = null!;
        public string Description { get; set; } = null!;
    }
}