using Warehouse.DTOs.Reports;

namespace Warehouse.Services.Interfaces
{
    public interface IReportService
    {
        Task<List<InventoryReportDto>> GetInventoryReport(ReportFilterDto filter);
        Task<List<SalesOrderReportDto>> GetSalesOrderReport(ReportFilterDto filter);
        Task<List<ShipmentReportDto>> GetShipmentReport(ReportFilterDto filter);
        Task<byte[]> ExportToExcel<T>(List<T> data, string sheetName);
        Task<byte[]> ExportToCsv<T>(List<T> data);
    }
}