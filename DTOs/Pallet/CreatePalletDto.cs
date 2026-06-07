using Warehouse.Enums;

namespace Warehouse.DTOs.Pallet
{
    public class CreatePalletDto
    {
        public int SalesOrderId { get; set; }
        public PackagingType PackagingType { get; set; }
    }
}
