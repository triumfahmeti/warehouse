using Microsoft.EntityFrameworkCore;
using Warehouse.Services.Tenancy;

namespace Warehouse.Middleware
{
    // Perdoruesit e zakonshem bllokohen qe ne login/refresh nese tenanti i tyre eshte
    // i pezulluar. Mbetet vetem rruga e SuperAdmin-it, qe "hyn" ne nje tenant permes
    // header-it X-Tenant-Id — ajo rruge nuk kalon nga login, prandaj verifikohet ketu.
    //
    // Kontrolli behet VETEM kur header-i ekziston, qe te mos shtohet nje query shtese
    // per cdo kerkese te zakonshme.
    public class SuspendedTenantMiddleware
    {
        private readonly RequestDelegate _next;

        public SuspendedTenantMiddleware(RequestDelegate next) => _next = next;

        public async Task InvokeAsync(HttpContext context)
        {
            var header = context.Request.Headers[TenantProvider.TenantHeader].ToString();

            if (context.User?.Identity?.IsAuthenticated == true
                && int.TryParse(header, out var tenantId)
                && tenantId > 0
                && !IsPlatformPath(context.Request.Path))
            {
                var db = context.RequestServices.GetRequiredService<AppDbContext>();

                // Tenant nuk eshte ITenantEntity, pra nuk ka query filter mbi te.
                var isActive = await db.Tenants
                    .Where(t => t.Id == tenantId)
                    .Select(t => (bool?)t.IsActive)
                    .FirstOrDefaultAsync();

                if (isActive != true)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        message = isActive == null
                            ? "Tenant not found."
                            : "This tenant is suspended."
                    });
                    return;
                }
            }

            await _next(context);
        }

        // Keto rruge jane te nivelit te platformes. Pa perjashtimin, nje SuperAdmin qe
        // ndodhet brenda nje tenanti kur ai pezullohet do te ngelej i bllokuar: edhe
        // vete faqja e tenanteve (per ta riaktivizuar) dhe logout-i do ktheheshin 403.
        private static bool IsPlatformPath(PathString path) =>
            path.StartsWithSegments("/api/tenant", StringComparison.OrdinalIgnoreCase)
            || path.StartsWithSegments("/api/auth", StringComparison.OrdinalIgnoreCase);
    }
}
