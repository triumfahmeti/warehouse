using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Services.Tenancy
{
    public interface ITenantProvider
    {
        // Tenanti aktiv i kerkeses. Null kur perdoruesi s'eshte i autentikuar ose
        // kur nje SuperAdmin punon ne nivel platforme (pa zgjedhur tenant).
        int? TenantId { get; }
        bool IsSuperAdmin { get; }

        // Kur true, query filter-at nuk aplikohen (vetem SuperAdmin pa tenant te zgjedhur).
        bool ByPassFilter { get; }

        // Perdoret nga seed-i dhe punet ne sfond, ku s'ka HttpContext.
        void SetTenant(int? tenantId, bool byPassFilter = false);
    }
}