using System;

namespace Warehouse.DTOs.File
{
    public class FileResponseDto
    {
        public int Id { get; set; }
        public string Entity { get; set; }
        public int EntityId { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public long FileSize { get; set; }
        public string UploadedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}