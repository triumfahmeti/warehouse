using Microsoft.AspNetCore.SignalR;
using Warehouse.Hubs;
using Warehouse.Services.Interfaces;

namespace Warehouse.Services.Implementations
{
    // Mbështjell IHubContext të NotificationHub-it për të transmetuar eventin
    // "ResourceChanged" te të gjithë klientët. Regjistrohet si Singleton —
    // IHubContext është i sigurt për singleton dhe injektohet edhe në service-a scoped.
    public class RealtimeNotifier : IRealtimeNotifier
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public RealtimeNotifier(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task ResourceChangedAsync(params string[] resources)
        {
            if (resources == null) return;

            foreach (var resource in resources)
            {
                if (string.IsNullOrWhiteSpace(resource)) continue;
                await _hubContext.Clients.All.SendAsync("ResourceChanged", resource);
            }
        }
    }
}
