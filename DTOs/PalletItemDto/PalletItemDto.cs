namespace Warehouse.DTOs.PalletItem
{
    public class PalletItemDto
    {
        public int Id { get; set; }
        public int PalletId { get; set; }
        public string? PalletCode { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int Quantity { get; set; }

        // Rafti nga u mor ky rresht (gjurmueshmëri e pick-ut). Null për të dhëna të vjetra.
        public int? RaftId { get; set; }
        public string? RaftNumber { get; set; }
        public string? WarehouseName { get; set; }
    }
}