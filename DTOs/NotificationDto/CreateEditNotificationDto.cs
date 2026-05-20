namespace Warehouse.DTOs.NotificationDto
{
    public class CreateEditNotificationDto
    {
        public string UserId { get; set; } = null!;
        public string Type { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
    }
}