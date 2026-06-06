namespace Warehouse.Services.Interfaces
{
    // Kanal real-time i veçantë nga njoftimet e përdoruesit (ReceiveNotification).
    // Dërgon vetëm EMRIN e resursit që ndryshoi (p.sh. "products"), jo të dhëna —
    // çdo client rifreskon vetë endpoint-in e tij të autorizuar.
    public interface IRealtimeNotifier
    {
        // Njofton të gjithë klientët se një ose më shumë resurse kanë ndryshuar.
        Task ResourceChangedAsync(params string[] resources);
    }
}
