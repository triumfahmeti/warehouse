using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Services.Interfaces
{
    public interface IInventoryService
    {
        Task AddStock(int productId, int raftId, int quantity);
        Task RemoveStock(int productId, int raftId, int quantity);
        Task<int> GetAvailableStock(int productId);
    }
}