using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Warehouse.Services.Tenancy;

namespace Warehouse.Hubs
{
    // Çdo lidhje futet ne grupin e tenantit te vet, qe broadcast-et te mos
    // dalin jashte kufirit te tenantit. SignalR e heq lidhjen nga grupi
    // automatikisht ne disconnect.
    [Authorize]
    public class NotificationHub : Hub
    {
        // Grup i nivelit platforme: vetem SuperAdmin-at. Perdoret per ndryshime
        // qe nuk i perkasin asnje tenanti te vetem (lista e tenantave).
        public const string PlatformGroup = "platform";

        public override async Task OnConnectedAsync()
        {
            var tenantId = ResolveTenantId();

            if (tenantId > 0)
                await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant-{tenantId}");

            // SuperAdmin-i pa tenant aktiv do mbetej pa asnje grup — prandaj futet
            // gjithmone ne grupin e platformes, pavaresisht nese ka "hyre" ne tenant.
            if (Context.User?.IsInRole(TenantProvider.SuperAdminRole) == true)
                await Groups.AddToGroupAsync(Context.ConnectionId, PlatformGroup);

            await base.OnConnectedAsync();
        }

        private int ResolveTenantId()
        {
            var user = Context.User;

            // Perdoruesi i zakonshem: vetem nga claim-i. Query string-u NUK nderohet
            // ketu — perndryshe cdokush do mund te degjonte transmetimet e nje tenanti
            // tjeter thjesht duke ndryshuar URL-ne e lidhjes.
            if (user?.IsInRole(TenantProvider.SuperAdminRole) != true)
            {
                var claim = user?.FindFirst(TenantProvider.TenantClaimType)?.Value;
                return int.TryParse(claim, out var fromClaim) && fromClaim > 0 ? fromClaim : 0;
            }

            // SuperAdmin-i s'ka claim tenanti; "hyn" ne nje tenant permes header-it
            // X-Tenant-Id te kerkesat REST. WebSocket-i nuk mbart header-a te
            // personalizuar, prandaj ketu i njejti informacion vjen si query string.
            var requestedRaw = Context.GetHttpContext()?.Request.Query["tenantId"].ToString();
            return int.TryParse(requestedRaw, out var requested) && requested > 0 ? requested : 0;
        }
    }
}