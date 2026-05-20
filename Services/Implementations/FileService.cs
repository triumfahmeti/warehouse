using Warehouse.DTOs.FileDto;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class FileService : IFileService
    {
        private readonly IFileRepository _fileRepository;
        private readonly AppDbContext _context;

        public FileService(
            IFileRepository fileRepository,
            AppDbContext context)
        {
            _fileRepository = fileRepository;
            _context = context;
        }

        public async Task<List<FileDto>> GetAllAsync()
        {
            var list = await _fileRepository.GetAllWithDetails();
            return list.Select(f => ToDto(f)).ToList();
        }

        public async Task<FileDto?> GetByIdAsync(int id)
        {
            var file = await _fileRepository.GetWithDetails(id);
            return file == null ? null : ToDto(file);
        }

        public async Task<FileDto> CreateAsync(CreateEditFileDto dto)
        {
            var file = new Warehouse.Models.File
            {
                Entity = dto.Entity,
                EntityId = dto.EntityId,
                FileName = dto.FileName,
                FilePath = dto.FilePath,
                FileSize = dto.FileSize,
                UploadedBy = dto.UploadedBy
            };

            await _fileRepository.AddAsync(file);
            await _context.SaveChangesAsync();

            return ToDto(file);
        }

        public async Task UpdateAsync(int id, CreateEditFileDto dto)
        {
            var file = await _fileRepository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("File not found");

            file.Entity = dto.Entity;
            file.EntityId = dto.EntityId;
            file.FileName = dto.FileName;
            file.FilePath = dto.FilePath;
            file.FileSize = dto.FileSize;
            file.UploadedBy = dto.UploadedBy;

            await _fileRepository.UpdateAsync(file);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var file = await _fileRepository.GetByIdAsync(id)
                ?? throw new InvalidOperationException("File not found");

            await _fileRepository.DeleteAsync(id);
            await _context.SaveChangesAsync();
        }

        private static FileDto ToDto(Warehouse.Models.File f) => new()
        {
            Id = f.Id,
            Entity = f.Entity,
            EntityId = f.EntityId,
            FileName = f.FileName,
            FilePath = f.FilePath,
            FileSize = f.FileSize,
            UploadedBy = f.UploadedBy,
            UserName = f.User?.UserName ?? "",
            CreatedAt = f.CreatedAt
        };
    }
}