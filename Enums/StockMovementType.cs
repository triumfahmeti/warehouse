namespace Warehouse.Enums
{
    public enum StockMovementType
    {
        Receive = 0,   // pranim malli
        Ship = 1,      // dalje për dërgesë
        Adjust = 2,    // korrigjim inventari
        Transfer = 3   // transferim mes raftesh/warehouse-ve
    }
}