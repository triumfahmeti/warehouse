namespace Warehouse.DTOs.UserManagement
{
    public class UserDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<string> Roles { get; set; } = new();
        public DateTime? LastLoginAt { get; set; }

        // Plotesohen vetem per user-at me rol Client (nga rekordi Client i lidhur).
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
    }
}
