namespace Warehouse.Enums
{
    public enum PackingListStatus
    {
        Draft = 0,
        Ready = 1,
        Closed = 2,    // mbyllet automatikisht kur shipment-i niset
        Cancelled = 3  // anulim manual para nisjes
    }
}
