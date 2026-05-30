using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.DTOs.Client
{
    public class MyStatsDto
    {
        public int TotalOrders { get; set; }
        public int ActiveOrders { get; set; }
        public int InTransit { get; set; }
        public decimal TotalSpent { get; set; }
        public Dictionary<string, int> StatusDistribution { get; set; } = new();
    }
}