using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.DTOs.Product
{
    public class ProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string SKU { get; set; } = null!;
        public decimal Length { get; set; }
        public decimal Width { get; set; }
        public decimal Height { get; set; }
        public decimal Weight { get; set; }
        public string Type { get; set; } = null!;
        public int Stock { get; set; }   // sasia e disponueshme (QuantityOnHand − Reserved) ne te gjitha raftet
    }
}