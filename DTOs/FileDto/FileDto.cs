namespace Warehouse.DTOs.FileDto
{
    public class FileDto
    {
        public int Id { get; set; }
        public string Entity { get; set; } = null!;
        public int EntityId { get; set; }
        public string FileName { get; set; } = null!;
        public string FilePath { get; set; } = null!;
        public long FileSize { get; set; }
        public string UploadedBy { get; set; } = null!;
        public string UserName { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
    }
}