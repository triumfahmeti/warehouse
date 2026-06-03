namespace Warehouse.DTOs.Client
{
    public class ClientListDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public int OrdersCount { get; set; }
    }
}
