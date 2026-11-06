using Microsoft.AspNetCore.SignalR;
using Warehouse.Hubs;
using Warehouse.Services.Interfaces;
using Warehouse.Services.Tenancy;

namespace Warehouse.Services.Implementations
{
    // Transmeton "ResourceChanged" vetem te grupi i tenantit aktiv.
    // Eshte Scoped sepse varet nga ITenantProvider (scoped).
    public class RealtimeNotifier : IRealtimeNotifier
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ITenantProvider _tenantProvider;

        public RealtimeNotifier(IHubContext<NotificationHub> hubContext,
                                ITenantProvider tenantProvider)
        {
            _hubContext = hubContext;
            _tenantProvider = tenantProvider;
        }

        public async Task ResourceChangedAsync(params string[] resources)
        {
            if (resources == null) return;

            var tenantId = _tenantProvider.TenantId;
            if (tenantId is null or 0) return;   // pa tenant — asnje transmetim

            await SendToAsync($"tenant-{tenantId}", resources);
        }

        public async Task PlatformChangedAsync(params string[] resources)
        {
            if (resources == null) return;

            // Pa kontroll tenanti: ne kete grup futen vetem SuperAdmin-at (shih
            // NotificationHub.OnConnectedAsync), ndaj nuk ka rrjedhje mes tenantave.
            await SendToAsync(NotificationHub.PlatformGroup, resources);
        }

        private async Task SendToAsync(string groupName, string[] resources)
        {
            var group = _hubContext.Clients.Group(groupName);

            foreach (var resource in resources)
            {
                if (string.IsNullOrWhiteSpace(resource)) continue;
                await group.SendAsync("ResourceChanged", resource);
            }
        }
    }
}