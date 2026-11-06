using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Services.Tenancy
{
    public class TenantProvider : ITenantProvider
    {
        public const string TenantClaimType = "tenant_id";
        public const string SuperAdminRole = "SuperAdmin";
        public const string TenantHeader = "X-Tenant-Id";

        private readonly IHttpContextAccessor _httpContextAccessor;

        private bool _resolved;
        private int? _tenantId;
        private bool _isSuperAdmin;
        private bool _bypassFilter;

        public TenantProvider(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public int? TenantId { get { Resolve(); return _tenantId; } }
        public bool IsSuperAdmin { get { Resolve(); return _isSuperAdmin; } }
        public bool ByPassFilter { get { Resolve(); return _bypassFilter; } }

        public void SetTenant(int? tenantId, bool bypassFilter = false)
        {
            _resolved = true;
            _tenantId = tenantId;
            _bypassFilter = bypassFilter;
        }

        private void Resolve()
        {
            if (_resolved) return;

            var user = _httpContextAccessor.HttpContext?.User;
            if (user?.Identity?.IsAuthenticated != true)
            {
                // Pa tenant => CurrentTenantId bie ne 0 dhe asnje rresht nuk perputhet.
                _resolved = true;
                return;
            }

            _isSuperAdmin = user.IsInRole(SuperAdminRole);

            if (_isSuperAdmin)
            {
                // SuperAdmin mund te hyje ne nje tenant te caktuar permes header-it;
                // pa te, sheh te gjitha tenantet. Header-i nuk nderohet per role te tjera.
                var header = _httpContextAccessor.HttpContext!.Request.Headers[TenantHeader].ToString();
                if (int.TryParse(header, out var requested) && requested > 0)
                    _tenantId = requested;
                else
                    _bypassFilter = true;
            }
            else
            {
                var claim = user.FindFirst(TenantClaimType)?.Value;
                if (int.TryParse(claim, out var fromClaim) && fromClaim > 0)
                    _tenantId = fromClaim;
            }

            _resolved = true;
        }

    }
}