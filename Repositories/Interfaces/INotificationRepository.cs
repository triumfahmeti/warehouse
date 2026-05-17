using System.Collections.Generic;
using System.Threading.Tasks;
using Warehouse.Models;

namespace Warehouse.Repositories.Interfaces
{
    public interface INotificationRepository : IGenericRepository<Notification>
    {
        Task<bool> MarkAsReadAsync(int id);
        Task<List<Notification>> GetByUserAsync(string userId);
    }
}