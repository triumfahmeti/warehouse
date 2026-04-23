using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Models
{
    public class Supplier : BaseEntity
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? ContactPerson { get; set; }

        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }


    }
}