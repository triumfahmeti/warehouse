namespace Warehouse.DTOs.FileDto
{
    public class CreateEditFileDto
    {
        public string Entity { get; set; } = null!;
        public int EntityId { get; set; }
        public string FileName { get; set; } = null!;
        public string FilePath { get; set; } = null!;
        public long FileSize { get; set; }
        public string UploadedBy { get; set; } = null!;
    }
}