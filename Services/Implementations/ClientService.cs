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
    }
}
