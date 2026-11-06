namespace Warehouse.Services.Interfaces
{
    // Kanal real-time i veçantë nga njoftimet e përdoruesit (ReceiveNotification).
    // Dërgon vetëm EMRIN e resursit që ndryshoi (p.sh. "products"), jo të dhëna —
    // çdo client rifreskon vetë endpoint-in e tij të autorizuar.
    public interface IRealtimeNotifier
    {
        // Njofton klientët e tenantit aktiv se një ose më shumë resurse kanë ndryshuar.
        Task ResourceChangedAsync(params string[] resources);

        // Njofton VETËM SuperAdmin-at (grupi "platform"). Nevojitet sepse
        // ResourceChangedAsync kërkon një tenant aktiv, ndërsa ndryshimet e
        // listës së tenantave ndodhin pa të — SuperAdmin-i nuk është brenda
        // asnjë tenanti kur pezullon një tjetër.
        Task PlatformChangedAsync(params string[] resources);
    }
}
