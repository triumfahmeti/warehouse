using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.Client;
using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class ClientService : IClientService
    {
        private readonly IClientRepository _clientRepository;
        private readonly AppDbContext _context;

        public ClientService(IClientRepository clientRepository, AppDbContext context)
        {
            _clientRepository = clientRepository;
            _context = context;
        }

        public async Task<List<ClientListDto>> GetAllAsync()
        {
            return await _context.Clients
                .AsNoTracking()
                .OrderBy(c => c.FullName)
                .Select(c => new ClientListDto
                {
                    Id = c.Id,
                    FullName = c.FullName,
                    Email = c.Email,
                    PhoneNumber = c.PhoneNumber,
                    Address = c.Address,
                    OrdersCount = c.SalesOrders.Count
                })
                .ToListAsync();
        }

        public async Task<int> CreateClient(string fullName, string email, string? phoneNumber, string? address)
        {
            var client = new Client
            {
                FullName = fullName,
                Email = email,
                PhoneNumber = phoneNumber,
                Address = address
            };

            await _clientRepository.AddAsync(client);
            await _context.SaveChangesAsync();

            return client.Id;
        }

        public async Task UpdateClient(int id, string fullName, string email, string? phoneNumber, string? address)
        {
            var client = await _clientRepository.GetByIdAsync(id);

            if (client is null)
                throw new Exception("Client not found");

            client.FullName = fullName;
            client.Email = email;
            client.PhoneNumber = phoneNumber;
            client.Address = address;

            await _clientRepository.UpdateAsync(client);
            await _context.SaveChangesAsync();
        }

        public async Task<List<SalesOrder>> GetClientOrders(int clientId)
        {
            var client = await _clientRepository.GetWithOrdersAsync(clientId);

            if (client is null)
                throw new Exception("Client not found");

            return client.SalesOrders
                .OrderByDescending(o => o.CreatedAt)
                .ToList();
        }

        public async Task<List<MyOrderDto>> GetMyOrdersAsync(string userId)
        {
            // Verifikim që ekziston profili Client për këtë user
            var client = await _clientRepository.GetClientByUserIdAsync(userId);
            if (client == null)
                throw new InvalidOperationException("Client profile not found for this user.");

            var orders = await _clientRepository.GetOrdersByUserIdAsync(userId);

            return orders.Select(o => new MyOrderDto
            {
                Id = o.Id,
                Number = $"SO-{o.OrderDate.Year}-{o.Id:D4}",
                Status = o.Status,
                TotalAmount = o.TotalAmount,
                LineItemsCount = o.SalesOrderItems?.Count ?? 0,
                TotalQuantity = o.SalesOrderItems?.Sum(i => i.Quantity) ?? 0,
                OrderDate = o.OrderDate
            }).ToList();
        }

        public async Task<MyStatsDto> GetMyStatsAsync(string userId)
        {
            var client = await _clientRepository.GetClientByUserIdAsync(userId);
            if (client == null)
                throw new InvalidOperationException("Client profile not found for this user.");

            var orders = await _clientRepository.GetOrdersByUserIdAsync(userId);

            // Përshtate sipas vlerave të enum-it tënd SalesOrderStatus
            var activeStatuses = new[]
            {
                SalesOrderStatus.New,
                SalesOrderStatus.Confirmed,
                SalesOrderStatus.Processing
    };

            var distribution = orders
                .GroupBy(o => o.Status.ToString())   // enum → string për dictionary
                .ToDictionary(g => g.Key, g => g.Count());

            return new MyStatsDto
            {
                TotalOrders = orders.Count,
                ActiveOrders = orders.Count(o => activeStatuses.Contains(o.Status)),
                InTransit = 0,
                TotalSpent = orders.Sum(o => o.TotalAmount),  // TotalAmount, jo Total
                StatusDistribution = distribution
            };
        }
    }
}
