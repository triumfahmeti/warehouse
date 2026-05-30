namespace Warehouse.DTOs.UserManagement
{
    public class UpdateUserDto
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? PhoneNumber { get; set; }
    }
}
