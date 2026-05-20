namespace Warehouse.DTOs.NotificationDto
{
    public class NotificationDto
    {
        public string Id { get; set; } = null!;
        public string UserId { get; set; } = null!;
        public string Type { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}