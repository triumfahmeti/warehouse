using Warehouse.DTOs.SupplierDto;
using Warehouse.Repositories.Interfaces;

using Warehouse.Models;
using Warehouse.Services.Interfaces;



namespace Warehouse.Services.Implementations
{
    public class SupplierService : ISupplierService
    {
        private readonly ISupplierRepository _repo;
        private readonly AppDbContext _context;
        private readonly IRealtimeNotifier _realtime;

        public SupplierService(ISupplierRepository repo, AppDbContext context, IRealtimeNotifier realtime)
        {
            _repo = repo;
            _context = context;
            _realtime = realtime;
        }

        public async Task<IEnumerable<SupplierDto>> GetAllAsync()
        {
            var suppliers = await _repo.GetAllAsync();
            return suppliers.Select(MapToDto);
        }

        public async Task<SupplierDto?> GetByIdAsync(int id)
        {
            var supplier = await _repo.GetByIdAsync(id);
            return supplier == null ? null : MapToDto(supplier);
        }

        public async Task<SupplierDto> AddAsync(CreateEditSupplierDto dto)
        {
            var supplier = new Supplier
            {
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                ContactPerson = dto.ContactPerson,
                Address = dto.Address,
                City = dto.City,
                Country = dto.Country
            };

            await _repo.AddAsync(supplier);
            await _context.SaveChangesAsync();
            await _realtime.ResourceChangedAsync("suppliers");
            return MapToDto(supplier);
        }

        public async Task UpdateAsync(int id, CreateEditSupplierDto dto)
        {
            var supplier = await _repo.GetByIdAsync(id);
            if (supplier == null)
                throw new Exception("Supplier not found");

            supplier.Name = dto.Name;
            supplier.Email = dto.Email;
            supplier.Phone = dto.Phone;
            supplier.ContactPerson = dto.ContactPerson;
            supplier.Address = dto.Address;
            supplier.City = dto.City;
            supplier.Country = dto.Country;

            await _repo.UpdateAsync(supplier);
            await _context.SaveChangesAsync();
            await _realtime.ResourceChangedAsync("suppliers");
        }

        public async Task DeleteAsync(int id)
        {
            var supplier = await _repo.GetByIdAsync(id);
            if (supplier == null)
                throw new Exception("Supplier not found");

            await _repo.DeleteAsync(id);
            await _context.SaveChangesAsync();
            await _realtime.ResourceChangedAsync("suppliers");
        }

        private static SupplierDto MapToDto(Supplier s) => new SupplierDto
        {
            Id = s.Id,
            Name = s.Name,
            Email = s.Email,
            Phone = s.Phone,
            ContactPerson = s.ContactPerson,
            Address = s.Address,
            City = s.City,
            Country = s.Country
        };
    }
}