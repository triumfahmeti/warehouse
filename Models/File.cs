using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Models
{
    public class File
    {
        public int Id { get; set; }

        public string Entity { get; set; }
        public int EntityId { get; set; }

        public string FileName { get; set; }
        public string FilePath { get; set; }
        public long FileSize { get; set; }

        public string UploadedBy { get; set; }
        public ApplicationUser User { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}