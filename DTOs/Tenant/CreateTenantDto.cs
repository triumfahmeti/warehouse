using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.DTOs.Tenant
{
    public class CreateTenantDto
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? ContactEmail { get; set; }

        [MaxLength(30)]
        [RegularExpression(@"^\+?[0-9 ()\-]{6,30}$",
       ErrorMessage = "Numri i telefonit përmban karaktere të pavlefshme.")]
        public string? ContactPhone { get; set; }

        // Admin-i i pare i kompanise, krijohet bashke me te.
        public string AdminName { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
        public string AdminPassword { get; set; } = string.Empty;
    }
}