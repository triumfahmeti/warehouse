using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Warehouse.DTOs.File;

namespace Warehouse.Services.Interfaces
{
    public interface IFileService
    {
        Task<FileResponseDto> UploadFile(IFormFile file, string entity, int entityId, string uploadedBy);
        Task<(byte[] data, string contentType, string fileName)?> DownloadFile(int id);
        Task<List<FileResponseDto>> GetAllFiles();
        Task<List<FileResponseDto>> GetFilesByEntity(string entity, int entityId);
        Task<bool> DeleteFile(int id);
    }
}