

namespace Warehouse.DTOs.ExportImport
{
    public class ImportResultDto
    {
        public int TotalRows { get; set; }
        public int SuccessCount { get; set; }
        public int SkippedCount { get; set; }
        public List<ImportErrorDto> Errors { get; set; } = new();
    }

    public class ImportErrorDto
    {
        public int Row { get; set; }
        public string Field { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}


