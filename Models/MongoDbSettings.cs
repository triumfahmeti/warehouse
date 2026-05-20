namespace Warehouse.Models
{
    public class MongoDbSettings
    {
        public string ConnectionString { get; set; } = null!;
        public string DatabaseName { get; set; } = null!;
        public string NotificationsCollectionName { get; set; } = null!;
    }
}