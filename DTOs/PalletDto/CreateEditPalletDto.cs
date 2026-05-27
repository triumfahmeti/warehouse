namespace Warehouse.DTOs.Pallet
{
    public class CreateEditPalletDto
    {
        public string PalletCode { get; set; }
        public string? PackingType { get; set; }
          public int RaftId { get; set; } 
          public int SalesOrderId { get; set; }
    }
}