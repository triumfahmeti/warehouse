using Microsoft.EntityFrameworkCore;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;

namespace Warehouse.Repositories.Implementations
{
    public class ClientRepository : IClientRepository
    {
        private readonly AppDbContext _context;

        public ClientRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Client?> GetByIdAsync(int id)
        {
            return await _context.Clients.FindAsync(id);
        }

        public async Task<Client?> GetClientByUserIdAsync(string userId)
        {
            return await _context.Clients
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        public async Task<List<SalesOrder>> GetOrdersByUserIdAsync(string userId)
        {
            return await _context.SalesOrders
                .AsNoTracking()
                .Include(o => o.SalesOrderItems)
                .Where(o => o.Client.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Client?> GetWithOrdersAsync(int id)
        {
            return await _context.Clients
                .Include(c => c.SalesOrders)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task AddAsync(Client client)
        {
            await _context.Clients.AddAsync(client);
        }

        public Task UpdateAsync(Client client)
        {
            _context.Clients.Update(client);
            return Task.CompletedTask;
        }
    }
}
