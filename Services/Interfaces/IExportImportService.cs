using Warehouse.DTOs.ExportImport;
using Warehouse.Enums;

namespace Warehouse.Services.Interfaces
{
    public interface IExportImportService
    {
        // ── EXPORT ──────────────────────────────────────────────────────────
        Task<(byte[] Content, string FileName, string ContentType)> ExportProductsAsync(string format);
        Task<(byte[] Content, string FileName, string ContentType)> ExportSuppliersAsync(string format);
        Task<(byte[] Content, string FileName, string ContentType)> ExportClientsAsync(string format);
        Task<(byte[] Content, string FileName, string ContentType)> ExportPurchaseOrdersAsync(string format, DateTime? from = null, DateTime? to = null);
        Task<(byte[] Content, string FileName, string ContentType)> ExportInventoryAsync(string format, int? warehouseId = null);
        Task<(byte[] Content, string FileName, string ContentType)> ExportShipmentsAsync(string format, ShipmentStatus? status = null);
        Task<(byte[] Content, string FileName, string ContentType)> ExportPackingListsAsync(string format);

        // ── IMPORT ──────────────────────────────────────────────────────────
        Task<ImportResultDto> ImportProductsAsync(IFormFile file);
        Task<ImportResultDto> ImportSuppliersAsync(IFormFile file);
        Task<ImportResultDto> ImportClientsAsync(IFormFile file);
        Task<ImportResultDto> ImportInventoryAsync(IFormFile file);
    }
}