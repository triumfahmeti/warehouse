using ClosedXML.Excel;
using CsvHelper;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using Warehouse.DTOs.Reports;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class ReportService : IReportService
    {
        private readonly AppDbContext _context;

        public ReportService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<InventoryReportDto>> GetInventoryReport(ReportFilterDto filter)
        {
            var query = _context.Inventories
                .Include(i => i.Product)
                .Include(i => i.Raft)
                    .ThenInclude(r => r.Warehouse)
                .AsQueryable();

            if (filter.WarehouseId.HasValue)
                query = query.Where(i => i.Raft.WarehouseId == filter.WarehouseId);

            if (filter.From.HasValue)
                query = query.Where(i => i.LastUpdated >= filter.From);

            if (filter.To.HasValue)
                query = query.Where(i => i.LastUpdated <= filter.To);

            return await query.Select(i => new InventoryReportDto
            {
                ProductId = i.ProductId,
                ProductName = i.Product.Name,
                SKU = i.Product.SKU,
                TotalQuantity = i.QuantityOnHand,
                ReservedQuantity = i.ReservedQuantity,
                AvailableQuantity = i.QuantityOnHand - i.ReservedQuantity,
                RaftName = i.Raft.RaftNumber,
                WarehouseName = i.Raft.Warehouse.Name
            }).ToListAsync();
        }

        public async Task<List<SalesOrderReportDto>> GetSalesOrderReport(ReportFilterDto filter)
        {
            var query = _context.SalesOrders
                .Include(o => o.Client)
                .Include(o => o.SalesOrderItems)
                .AsQueryable();

            if (filter.From.HasValue)
                query = query.Where(o => o.CreatedAt >= filter.From);

            if (filter.To.HasValue)
                query = query.Where(o => o.CreatedAt <= filter.To);

            if (!string.IsNullOrEmpty(filter.Status))
                query = query.Where(o => o.Status.ToString() == filter.Status);

            return await query.Select(o => new SalesOrderReportDto
            {
                OrderId = o.Id,
                ClientName = o.Client.FullName,
                Status = o.Status.ToString(),
                TotalAmount = o.SalesOrderItems
                    .Where(i => i.UnitPrice.HasValue)
                    .Sum(i => i.Quantity * i.UnitPrice!.Value),
                TotalItems = o.SalesOrderItems.Sum(i => i.Quantity),
                CreatedAt = o.CreatedAt
            }).ToListAsync();
        }

        public async Task<List<ShipmentReportDto>> GetShipmentReport(ReportFilterDto filter)
        {
            var query = _context.Shipments
                .Include(s => s.Warehouse)
                .Include(s => s.PackingList)
                .AsQueryable();

            if (filter.From.HasValue)
                query = query.Where(s => s.CreatedAt >= filter.From);

            if (filter.To.HasValue)
                query = query.Where(s => s.CreatedAt <= filter.To);

            if (!string.IsNullOrEmpty(filter.Status))
                query = query.Where(s => s.Status.ToString() == filter.Status);

            if (filter.WarehouseId.HasValue)
                query = query.Where(s => s.WarehouseId == filter.WarehouseId);

            return await query.Select(s => new ShipmentReportDto
            {
                ShipmentId = s.Id,
                ShipmentNumber = s.ShipmentNumber,
                Status = s.Status.ToString(),
                WarehouseName = s.Warehouse.Name,
                PackingListNumber = s.PackingList.PackingListNumber,
                CreatedAt = s.CreatedAt
            }).ToListAsync();
        }

        public Task<byte[]> ExportToExcel<T>(List<T> data, string sheetName)
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add(sheetName);

            var properties = typeof(T).GetProperties();

            // Headers
            for (int i = 0; i < properties.Length; i++)
            {
                var cell = worksheet.Cell(1, i + 1);
                cell.Value = properties[i].Name;
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.LightBlue;
            }

            // Data
            for (int row = 0; row < data.Count; row++)
            {
                for (int col = 0; col < properties.Length; col++)
                {
                    var value = properties[col].GetValue(data[row]);
                    worksheet.Cell(row + 2, col + 1).Value = value?.ToString() ?? "";
                }
            }

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return Task.FromResult(stream.ToArray());
        }

        public Task<byte[]> ExportToCsv<T>(List<T> data)
        {
            using var stream = new MemoryStream();
            using var writer = new StreamWriter(stream);
            using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);
            csv.WriteRecords(data);
            writer.Flush();
            return Task.FromResult(stream.ToArray());
        }
    }
}