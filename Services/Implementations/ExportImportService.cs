using System.Globalization;
using System.Text;
using System.Text.Json;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Warehouse.DTOs.ExportImport;
using Warehouse.Enums;
using Warehouse.Models;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    public class ExportImportService : IExportImportService
    {
        private readonly AppDbContext _context;

        public ExportImportService(AppDbContext context)
        {
            _context = context;
        }

        // ════════════════════════════════════════════════════════════════════
        //  EXPORT — PRODUCTS
        // ════════════════════════════════════════════════════════════════════

        public async Task<(byte[] Content, string FileName, string ContentType)> ExportProductsAsync(string format)
        {
            var products = await _context.Products.AsNoTracking().ToListAsync();

            var rows = products.Select(p => new Dictionary<string, object?>
            {
                ["Id"]          = p.Id,
                ["Name"]        = p.Name,
                ["SKU"]         = p.SKU,
                ["Description"] = p.Description,
                ["Type"]        = p.Type,
                ["Length"]      = p.Length,
                ["Width"]       = p.Width,
                ["Height"]      = p.Height,
                ["Weight"]      = p.Weight,
            }).ToList();

            return BuildExport(rows, "Products", format);
        }

        // ════════════════════════════════════════════════════════════════════
        //  EXPORT — SUPPLIERS
        // ════════════════════════════════════════════════════════════════════

        public async Task<(byte[] Content, string FileName, string ContentType)> ExportSuppliersAsync(string format)
        {
            var suppliers = await _context.Suppliers.AsNoTracking().ToListAsync();

            var rows = suppliers.Select(s => new Dictionary<string, object?>
            {
                ["Id"]            = s.Id,
                ["Name"]          = s.Name,
                ["ContactPerson"] = s.ContactPerson,
                ["Email"]         = s.Email,
                ["Phone"]         = s.Phone,
                ["Address"]       = s.Address,
                ["City"]          = s.City,
                ["Country"]       = s.Country,
                ["CreatedAt"]     = s.CreatedAt.ToString("yyyy-MM-dd HH:mm")
            }).ToList();

            return BuildExport(rows, "Suppliers", format);
        }

        // ════════════════════════════════════════════════════════════════════
        //  EXPORT — CLIENTS
        // ════════════════════════════════════════════════════════════════════

        public async Task<(byte[] Content, string FileName, string ContentType)> ExportClientsAsync(string format)
        {
            var clients = await _context.Clients.AsNoTracking().ToListAsync();

            var rows = clients.Select(c => new Dictionary<string, object?>
            {
                ["Id"]          = c.Id,
                ["FullName"]    = c.FullName,
                ["Email"]       = c.Email,
                ["PhoneNumber"] = c.PhoneNumber,
                ["Address"]     = c.Address,
                ["CreatedAt"]   = c.CreatedAt.ToString("yyyy-MM-dd HH:mm")
            }).ToList();

            return BuildExport(rows, "Clients", format);
        }

        // ════════════════════════════════════════════════════════════════════
        //  EXPORT — PURCHASE ORDERS
        // ════════════════════════════════════════════════════════════════════

        public async Task<(byte[] Content, string FileName, string ContentType)> ExportPurchaseOrdersAsync(
            string format, DateTime? from = null, DateTime? to = null)
        {
            var query = _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.Items)
                .AsNoTracking();

            if (from.HasValue) query = query.Where(po => po.OrderDate >= from.Value);
            if (to.HasValue)   query = query.Where(po => po.OrderDate <= to.Value);

            var orders = await query.OrderByDescending(po => po.OrderDate).ToListAsync();

            // Flat: one row per order item
            var rows = orders.SelectMany(po => po.Items.Select(item => new Dictionary<string, object?>
            {
                ["OrderId"]              = po.Id,
                ["SupplierName"]         = po.Supplier?.Name,
                ["OrderDate"]            = po.OrderDate.ToString("yyyy-MM-dd"),
                ["ExpectedDeliveryDate"] = po.ExpectedDeliveryDate?.ToString("yyyy-MM-dd"),
                ["Status"]               = po.Status.ToString(),
                ["ItemId"]               = item.Id,
                ["ProductId"]            = item.ProductId,
                ["Quantity"]             = item.Quantity,
                ["UnitPrice"]            = item.UnitPrice,
                ["TotalPrice"]           = item.Quantity * item.UnitPrice,
            })).ToList();

            return BuildExport(rows, "PurchaseOrders", format);
        }

        // ════════════════════════════════════════════════════════════════════
        //  EXPORT — INVENTORY
        // ════════════════════════════════════════════════════════════════════

        public async Task<(byte[] Content, string FileName, string ContentType)> ExportInventoryAsync(
            string format, int? warehouseId = null)
        {
            var query = _context.Inventories
                .Include(i => i.Product)
                .Include(i => i.Raft)
                    .ThenInclude(r => r.Warehouse)
                .AsNoTracking();

            if (warehouseId.HasValue)
                query = query.Where(i => i.Raft.WarehouseId == warehouseId.Value);

            var inventories = await query.ToListAsync();

            var rows = inventories.Select(i => new Dictionary<string, object?>
            {
                ["InventoryId"]       = i.Id,
                ["ProductId"]         = i.ProductId,
                ["ProductName"]       = i.Product?.Name,
                ["SKU"]               = i.Product?.SKU,
                ["RaftId"]            = i.RaftId,
                ["RaftNumber"]        = i.Raft?.RaftNumber,
                ["WarehouseName"]     = i.Raft?.Warehouse?.Name,
                ["QuantityOnHand"]    = i.QuantityOnHand,
                ["ReservedQuantity"]  = i.ReservedQuantity,
                ["AvailableQuantity"] = i.AvailableQuantity,
                ["LastUpdated"]       = i.LastUpdated.ToString("yyyy-MM-dd HH:mm")
            }).ToList();

            return BuildExport(rows, "Inventory", format);
        }

        // ════════════════════════════════════════════════════════════════════
        //  EXPORT — SHIPMENTS
        // ════════════════════════════════════════════════════════════════════

        public async Task<(byte[] Content, string FileName, string ContentType)> ExportShipmentsAsync(
            string format, ShipmentStatus? status = null)
        {
            var query = _context.Shipments
                .Include(s => s.Warehouse)
                .Include(s => s.PackingList)
                .AsNoTracking();

            if (status.HasValue)
                query = query.Where(s => s.Status == status.Value);

            var shipments = await query.OrderByDescending(s => s.CreatedAt).ToListAsync();

            var rows = shipments.Select(s => new Dictionary<string, object?>
            {
                ["Id"]                = s.Id,
                ["ShipmentNumber"]    = s.ShipmentNumber,
                ["Status"]            = s.Status.ToString(),
                ["WarehouseName"]     = s.Warehouse?.Name,
                ["PackingListNumber"] = s.PackingList?.PackingListNumber,
                ["Notes"]             = s.Notes,
                ["CreatedAt"]         = s.CreatedAt.ToString("yyyy-MM-dd HH:mm")
            }).ToList();

            return BuildExport(rows, "Shipments", format);
        }

        // ════════════════════════════════════════════════════════════════════
        //  EXPORT — PACKING LISTS
        // ════════════════════════════════════════════════════════════════════

        public async Task<(byte[] Content, string FileName, string ContentType)> ExportPackingListsAsync(string format)
        {
            var lists = await _context.PackingLists
                .Include(pl => pl.SalesOrder)
                .Include(pl => pl.Warehouse)
                .Include(pl => pl.Pallets)
                .AsNoTracking()
                .OrderByDescending(pl => pl.CreatedAt)
                .ToListAsync();

            var rows = lists.Select(pl => new Dictionary<string, object?>
            {
                ["Id"]                = pl.Id,
                ["PackingListNumber"] = pl.PackingListNumber,
                ["Status"]            = pl.Status.ToString(),
                ["WarehouseName"]     = pl.Warehouse?.Name,
                ["SalesOrderId"]      = pl.SalesOrderId,
                ["PalletCount"]       = pl.Pallets?.Count ?? 0,
                ["Notes"]             = pl.Notes,
                ["CreatedAt"]         = pl.CreatedAt.ToString("yyyy-MM-dd HH:mm")
            }).ToList();

            return BuildExport(rows, "PackingLists", format);
        }

        // ════════════════════════════════════════════════════════════════════
        //  IMPORT — PRODUCTS
        // ════════════════════════════════════════════════════════════════════

        public async Task<ImportResultDto> ImportProductsAsync(IFormFile file)
        {
            var rows = await ParseFileAsync(file);
            var result = new ImportResultDto { TotalRows = rows.Count };

            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                int rowNum = i + 2;

                if (!GetString(row, "Name", out var name))
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "Name", Message = "Name është i detyrueshëm." });
                    result.SkippedCount++;
                    continue;
                }

                if (!GetString(row, "SKU", out var sku))
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "SKU", Message = "SKU është i detyrueshëm." });
                    result.SkippedCount++;
                    continue;
                }

                if (await _context.Products.AnyAsync(p => p.SKU == sku))
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "SKU", Message = $"SKU '{sku}' ekziston tashmë." });
                    result.SkippedCount++;
                    continue;
                }

                await _context.Products.AddAsync(new Product
                {
                    Name        = name!,
                    SKU         = sku!,
                    Description = GetStringOrNull(row, "Description"),
                    Type        = GetStringOrNull(row, "Type"),
                    Length      = GetDecimal(row, "Length"),
                    Width       = GetDecimal(row, "Width"),
                    Height      = GetDecimal(row, "Height"),
                    Weight      = GetDecimal(row, "Weight")
                });

                result.SuccessCount++;
            }

            await _context.SaveChangesAsync();
            return result;
        }

        // ════════════════════════════════════════════════════════════════════
        //  IMPORT — SUPPLIERS
        // ════════════════════════════════════════════════════════════════════

        public async Task<ImportResultDto> ImportSuppliersAsync(IFormFile file)
        {
            var rows = await ParseFileAsync(file);
            var result = new ImportResultDto { TotalRows = rows.Count };

            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                int rowNum = i + 2;

                if (!GetString(row, "Name", out var name))
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "Name", Message = "Name është i detyrueshëm." });
                    result.SkippedCount++;
                    continue;
                }

                if (await _context.Suppliers.AnyAsync(s => s.Name == name))
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "Name", Message = $"Furnitori '{name}' ekziston tashmë." });
                    result.SkippedCount++;
                    continue;
                }

                await _context.Suppliers.AddAsync(new Supplier
                {
                    Name          = name!,
                    ContactPerson = GetStringOrNull(row, "ContactPerson"),
                    Email         = GetStringOrNull(row, "Email"),
                    Phone         = GetStringOrNull(row, "Phone"),
                    Address       = GetStringOrNull(row, "Address"),
                    City          = GetStringOrNull(row, "City"),
                    Country       = GetStringOrNull(row, "Country")
                });

                result.SuccessCount++;
            }

            await _context.SaveChangesAsync();
            return result;
        }

        // ════════════════════════════════════════════════════════════════════
        //  IMPORT — CLIENTS
        // ════════════════════════════════════════════════════════════════════

        public async Task<ImportResultDto> ImportClientsAsync(IFormFile file)
        {
            var rows = await ParseFileAsync(file);
            var result = new ImportResultDto { TotalRows = rows.Count };

            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                int rowNum = i + 2;

                if (!GetString(row, "FullName", out var fullName))
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "FullName", Message = "FullName është i detyrueshëm." });
                    result.SkippedCount++;
                    continue;
                }

                if (!GetString(row, "Email", out var email))
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "Email", Message = "Email është i detyrueshëm." });
                    result.SkippedCount++;
                    continue;
                }

                if (await _context.Clients.AnyAsync(c => c.Email == email))
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "Email", Message = $"Klienti me email '{email}' ekziston tashmë." });
                    result.SkippedCount++;
                    continue;
                }

                await _context.Clients.AddAsync(new Client
                {
                    FullName    = fullName!,
                    Email       = email!,
                    PhoneNumber = GetStringOrNull(row, "PhoneNumber"),
                    Address     = GetStringOrNull(row, "Address")
                });

                result.SuccessCount++;
            }

            await _context.SaveChangesAsync();
            return result;
        }

        // ════════════════════════════════════════════════════════════════════
        //  IMPORT — INVENTORY
        // ════════════════════════════════════════════════════════════════════

        public async Task<ImportResultDto> ImportInventoryAsync(IFormFile file)
        {
            var rows = await ParseFileAsync(file);
            var result = new ImportResultDto { TotalRows = rows.Count };

            for (int i = 0; i < rows.Count; i++)
            {
                var row = rows[i];
                int rowNum = i + 2;

                if (!GetInt(row, "ProductId", out int productId))
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "ProductId", Message = "ProductId duhet të jetë numër i vlefshëm." });
                    result.SkippedCount++;
                    continue;
                }

                if (!GetInt(row, "RaftId", out int raftId))
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "RaftId", Message = "RaftId duhet të jetë numër i vlefshëm." });
                    result.SkippedCount++;
                    continue;
                }

                if (!GetInt(row, "QuantityOnHand", out int qty) || qty < 0)
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "QuantityOnHand", Message = "QuantityOnHand duhet të jetë numër ≥ 0." });
                    result.SkippedCount++;
                    continue;
                }

                var productExists = await _context.Products.AnyAsync(p => p.Id == productId);
                var raftExists    = await _context.Rafts.AnyAsync(r => r.Id == raftId);

                if (!productExists)
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "ProductId", Message = $"Produkti me Id={productId} nuk u gjet." });
                    result.SkippedCount++;
                    continue;
                }

                if (!raftExists)
                {
                    result.Errors.Add(new ImportErrorDto { Row = rowNum, Field = "RaftId", Message = $"Rafti me Id={raftId} nuk u gjet." });
                    result.SkippedCount++;
                    continue;
                }

                // Nëse kombinimi ProductId+RaftId ekziston → update, përndryshe → insert
                var existing = await _context.Inventories
                    .FirstOrDefaultAsync(inv => inv.ProductId == productId && inv.RaftId == raftId);

                if (existing != null)
                {
                    existing.QuantityOnHand = qty;
                    existing.LastUpdated    = DateTime.UtcNow;
                }
                else
                {
                    await _context.Inventories.AddAsync(new Inventory
                    {
                        ProductId        = productId,
                        RaftId           = raftId,
                        QuantityOnHand   = qty,
                        ReservedQuantity = 0,
                        LastUpdated      = DateTime.UtcNow
                    });
                }

                result.SuccessCount++;
            }

            await _context.SaveChangesAsync();
            return result;
        }

        // ════════════════════════════════════════════════════════════════════
        //  PRIVATE — BUILDER  (CSV / Excel / JSON)
        // ════════════════════════════════════════════════════════════════════

        private static (byte[] Content, string FileName, string ContentType) BuildExport(
            List<Dictionary<string, object?>> rows, string entityName, string format)
        {
            var stamp = DateTime.Now.ToString("yyyyMMdd_HHmm");
            return format.ToLower() switch
            {
                "excel" => BuildExcel(rows, entityName, $"{entityName}_{stamp}.xlsx"),
                "json"  => BuildJson(rows,  entityName, $"{entityName}_{stamp}.json"),
                _       => BuildCsv(rows,   entityName, $"{entityName}_{stamp}.csv")
            };
        }

        // ── CSV ─────────────────────────────────────────────────────────────

        private static (byte[] Content, string FileName, string ContentType) BuildCsv(
            List<Dictionary<string, object?>> rows, string _, string fileName)
        {
            if (rows.Count == 0)
                return (Encoding.UTF8.GetBytes(""), fileName, "text/csv");

            var sb      = new StringBuilder();
            var headers = rows[0].Keys.ToList();
            sb.AppendLine(string.Join(",", headers));

            foreach (var row in rows)
            {
                var values = headers.Select(h =>
                {
                    var val = row.GetValueOrDefault(h)?.ToString() ?? "";
                    return val.Contains(',') || val.Contains('"') || val.Contains('\n')
                        ? $"\"{val.Replace("\"", "\"\"")}\"" : val;
                });
                sb.AppendLine(string.Join(",", values));
            }

            return (Encoding.UTF8.GetBytes(sb.ToString()), fileName, "text/csv");
        }

        // ── EXCEL ─────────────────────────────────────────────────────────────

        private static (byte[] Content, string FileName, string ContentType) BuildExcel(
            List<Dictionary<string, object?>> rows, string sheetName, string fileName)
        {
            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add(sheetName);

            if (rows.Count == 0)
            {
                using var emptyMs = new MemoryStream();
                wb.SaveAs(emptyMs);
                return (emptyMs.ToArray(), fileName,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            }

            var headers = rows[0].Keys.ToList();

            for (int c = 0; c < headers.Count; c++)
            {
                var cell = ws.Cell(1, c + 1);
                cell.Value = headers[c];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.LightBlue;
            }

            for (int r = 0; r < rows.Count; r++)
            {
                for (int c = 0; c < headers.Count; c++)
                {
                    var val  = rows[r].GetValueOrDefault(headers[c]);
                    var cell = ws.Cell(r + 2, c + 1);

                    cell.Value = val switch
                    {
                        null      => XLCellValue.FromObject(""),
                        int v     => (XLCellValue)v,
                        decimal v => (XLCellValue)(double)v,
                        double v  => (XLCellValue)v,
                        bool v    => (XLCellValue)v,
                        _         => (XLCellValue)(val.ToString() ?? "")
                    };
                }
            }

            ws.Columns().AdjustToContents();

            using var ms = new MemoryStream();
            wb.SaveAs(ms);
            return (ms.ToArray(), fileName,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        }

        // ── JSON ─────────────────────────────────────────────────────────────

        private static (byte[] Content, string FileName, string ContentType) BuildJson(
            List<Dictionary<string, object?>> rows, string _, string fileName)
        {
            var json = JsonSerializer.Serialize(rows, new JsonSerializerOptions { WriteIndented = true });
            return (Encoding.UTF8.GetBytes(json), fileName, "application/json");
        }

        // ════════════════════════════════════════════════════════════════════
        //  PRIVATE — FILE PARSER  (CSV / Excel / JSON)
        // ════════════════════════════════════════════════════════════════════

             
private static async Task<List<Dictionary<string, string>>> ParseFileAsync(IFormFile file)
        {
            var ext = Path.GetExtension(file.FileName).ToLower();
            return ext switch
            {
                ".xlsx" or ".xls" => ParseExcel(file),
                ".json"           => await ParseJsonAsync(file),
                _                 => await ParseCsvAsync(file)
            };
        }

        private static async Task<List<Dictionary<string, string>>> ParseCsvAsync(IFormFile file)
        {
            var result = new List<Dictionary<string, string>>();
            using var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8);

            var headerLine = await reader.ReadLineAsync();
            if (headerLine == null) return result;
            var headers = SplitCsvLine(headerLine);

            string? line;
            while ((line = await reader.ReadLineAsync()) != null)
            {
                if (string.IsNullOrWhiteSpace(line)) continue;
                var values = SplitCsvLine(line);
                var row    = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                for (int i = 0; i < headers.Count; i++)
                    row[headers[i]] = i < values.Count ? values[i] : "";
                result.Add(row);
            }

            return result;
        }

        private static List<Dictionary<string, string>> ParseExcel(IFormFile file)
        {
            var result = new List<Dictionary<string, string>>();
            using var stream = file.OpenReadStream();
            using var wb     = new XLWorkbook(stream);
            var ws = wb.Worksheets.First();

            var lastCol = ws.LastColumnUsed()?.ColumnNumber() ?? 0;
            var lastRow = ws.LastRowUsed()?.RowNumber()       ?? 0;
            if (lastCol == 0 || lastRow < 2) return result;

            var headers = Enumerable.Range(1, lastCol)
                .Select(c => ws.Cell(1, c).GetString().Trim())
                .ToList();

            for (int r = 2; r <= lastRow; r++)
            {
                var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                for (int c = 0; c < headers.Count; c++)
                    row[headers[c]] = ws.Cell(r, c + 1).GetString().Trim();
                result.Add(row);
            }

            return result;
        }

        private static async Task<List<Dictionary<string, string>>> ParseJsonAsync(IFormFile file)
        {
            using var stream = file.OpenReadStream();
            var list = await JsonSerializer.DeserializeAsync<List<Dictionary<string, JsonElement>>>(stream);
            return list?.Select(d =>
                d.ToDictionary(
                    kv => kv.Key,
                    kv => kv.Value.ToString(),
                    StringComparer.OrdinalIgnoreCase))
                .ToList() ?? new List<Dictionary<string, string>>();
        }

        // ════════════════════════════════════════════════════════════════════
        //  PRIVATE — HELPERS
        // ════════════════════════════════════════════════════════════════════

        private static bool GetString(Dictionary<string, string> row, string key, out string? value)
        {
            value = row.TryGetValue(key, out var v) ? v?.Trim() : null;
            return !string.IsNullOrWhiteSpace(value);
        }

        private static string? GetStringOrNull(Dictionary<string, string> row, string key)
        {
            var val = row.TryGetValue(key, out var v) ? v?.Trim() : null;
            return string.IsNullOrWhiteSpace(val) ? null : val;
        }

        private static bool GetInt(Dictionary<string, string> row, string key, out int value)
        {
            value = 0;
            return row.TryGetValue(key, out var v) && int.TryParse(v?.Trim(), out value);
        }

        private static decimal GetDecimal(Dictionary<string, string> row, string key)
        {
            if (row.TryGetValue(key, out var v) &&
                decimal.TryParse(v?.Trim(), NumberStyles.Any, CultureInfo.InvariantCulture, out var d))
                return d;
            return 0;
        }

        private static List<string> SplitCsvLine(string line)
        {
            var result   = new List<string>();
            var sb       = new StringBuilder();
            bool inQuotes = false;

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                if (c == '"')
                {
                    if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                    { sb.Append('"'); i++; }
                    else
                    { inQuotes = !inQuotes; }
                }
                else if (c == ',' && !inQuotes)
                { result.Add(sb.ToString()); sb.Clear(); }
                else
                { sb.Append(c); }
            }

            result.Add(sb.ToString());
            return result;
        }
    }
}
