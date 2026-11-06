using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.DTOs.Tenant
{
    public class UpdateTenantDto
    {
        public string Name { get; set; } = string.Empty;
        public string? ContactEmail { get; set; }

        [MaxLength(30)]
        [RegularExpression(@"^\+?[0-9 ()\-]{6,30}$",
        ErrorMessage = "Phone number should be typed.")]
        public string? ContactPhone { get; set; }
    }
}