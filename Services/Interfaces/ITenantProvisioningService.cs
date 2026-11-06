using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Warehouse.DTOs.Tenant;
using Warehouse.Models;

namespace Warehouse.Services.Interfaces
{
    public interface ITenantProvisioningService
    {
        Task<Tenant> CreateAsync(CreateTenantDto dto, string? actorUserId);
        Task SeedDefaultSettingsAsync(int tenantId);
    }
}