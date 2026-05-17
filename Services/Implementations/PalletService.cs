using Warehouse.DTOs.Pallet;
using Warehouse.Repositories.Interfaces;

using Warehouse.Models;
using Warehouse.Services.Interfaces;



namespace Warehouse.Services.Implementations
{
    public class PalletService : IPalletService
    {
        private readonly IPalletRepository _repo;
        private readonly AppDbContext _context;

        public PalletService(IPalletRepository repo, AppDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        public async Task<IEnumerable<PalletDto>> GetAllAsync()
        {
            var pallets = await _repo.GetAllWithItems();
            return pallets.Select(MapToDto);
        }

        public async Task<PalletDto?> GetByIdAsync(int id)
        {
            var pallet = await _repo.GetWithItems(id);
            return pallet == null ? null : MapToDto(pallet);
        }

        public async Task<PalletDto> AddAsync(CreateEditPalletDto dto)
        {
            var pallet = new Pallet
            {
                PalletCode = dto.PalletCode,
                PackingType = dto.PackingType
            };

            await _repo.AddAsync(pallet);
            await _context.SaveChangesAsync();
            return MapToDto(pallet);
        }

        public async Task UpdateAsync(int id, CreateEditPalletDto dto)
        {
            var pallet = await _repo.GetByIdAsync(id);
            if (pallet == null)
                throw new Exception("Pallet not found");

            pallet.PalletCode = dto.PalletCode;
            pallet.PackingType = dto.PackingType;

            await _repo.UpdateAsync(pallet);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var pallet = await _repo.GetByIdAsync(id);
            if (pallet == null)
                throw new Exception("Pallet not found");

            await _repo.DeleteAsync(id);
            await _context.SaveChangesAsync();
        }

        private static PalletDto MapToDto(Pallet p) => new PalletDto
        {
            Id = p.Id,
            PalletCode = p.PalletCode,
            PackingType = p.PackingType
        };
    }
}