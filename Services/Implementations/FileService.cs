using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.File;
using Warehouse.Models;
using Warehouse.Repositories.Interfaces;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class FileService : IFileService
    {
        private readonly IFileRepository _fileRepository;
        private readonly AppDbContext _context;
        private readonly string _uploadPath;

        public FileService(IFileRepository fileRepository, AppDbContext context, IWebHostEnvironment env)
        {
            _fileRepository = fileRepository;
            _context = context;
            _uploadPath = Path.Combine(env.ContentRootPath, "Uploads");

            if (!Directory.Exists(_uploadPath))
                Directory.CreateDirectory(_uploadPath);
        }

        private void AddFileLog(File file, string action, string oldValue, string newValue)
        {
            _context.AuditLogs.Add(new AuditLog
            {
                Action = action,
                Entity = "File",
                EntityId = file.Id,
                OldValue = oldValue,
                NewValue = newValue
            });
        }

        public async Task<FileResponseDto> UploadFile(IFormFile file, string entity, int entityId, string uploadedBy)
        {
            if (file == null || file.Length == 0)
                throw new InvalidOperationException("File is empty");

            using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

            try
            {
                var uniqueName = $"{Guid.NewGuid()}_{file.FileName}";
                var fullPath = Path.Combine(_uploadPath, uniqueName);

                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var fileEntity = new File
                {
                    Entity = entity,
                    EntityId = entityId,
                    FileName = file.FileName,
                    FilePath = fullPath,
                    FileSize = file.Length,
                    UploadedBy = uploadedBy,
                    CreatedAt = DateTime.UtcNow
                };

                await _fileRepository.AddAsync(fileEntity);
                await _context.SaveChangesAsync();

                AddFileLog(fileEntity, "UploadFile", null, $"FileName:{fileEntity.FileName};Size:{fileEntity.FileSize}");

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Map(fileEntity);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<(byte[] data, string contentType, string fileName)?> DownloadFile(int id)
        {
            var file = await _context.Files.FirstOrDefaultAsync(f => f.Id == id);
            if (file == null || !System.IO.File.Exists(file.FilePath))
                return null;

            var data = await System.IO.File.ReadAllBytesAsync(file.FilePath);
            var contentType = GetContentType(file.FileName);

            return (data, contentType, file.FileName);
        }

        public async Task<List<FileResponseDto>> GetAllFiles()
        {
            var files = await _fileRepository.GetAllFilesAsync();
            return files.Select(Map).ToList();
        }

        public async Task<List<FileResponseDto>> GetFilesByEntity(string entity, int entityId)
        {
            var files = await _fileRepository.GetFilesByEntity(entity, entityId);
            return files.Select(Map).ToList();
        }

        public async Task<bool> DeleteFile(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.Serializable);

            try
            {
                var file = await _context.Files.FirstOrDefaultAsync(f => f.Id == id);
                if (file == null)
                    return false;

                var oldValue = $"FileName:{file.FileName};Size:{file.FileSize}";

                if (System.IO.File.Exists(file.FilePath))
                    System.IO.File.Delete(file.FilePath);

                _context.Files.Remove(file);
                await _context.SaveChangesAsync();

                AddFileLog(file, "DeleteFile", oldValue, null);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private static FileResponseDto Map(File f) => new FileResponseDto
        {
            Id = f.Id,
            Entity = f.Entity,
            EntityId = f.EntityId,
            FileName = f.FileName,
            FilePath = f.FilePath,
            FileSize = f.FileSize,
            UploadedBy = f.UploadedBy,
            CreatedAt = f.CreatedAt
        };

        private static string GetContentType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".pdf" => "application/pdf",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".txt" => "text/plain",
                _ => "application/octet-stream"
            };
        }
    }
}