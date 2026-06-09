using Warehouse.Enums;


namespace Warehouse.DTOs.Pallet
{
    public class CreatePalletSplitDto
    {
        public int SalesOrderId { get; set; }
        public PackagingType PackagingType { get; set; }
        public int ItemsPerPallet { get; set; }
    }
}