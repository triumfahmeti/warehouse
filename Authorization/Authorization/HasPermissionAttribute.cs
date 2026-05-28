using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace Warehouse.Authorization
{
    public class HasPermissionAttribute : AuthorizeAttribute
    {
        public const string PolicyPrefix = "PERMISSION_";

        public HasPermissionAttribute(string permission)
        {
            Policy = $"{PolicyPrefix}{permission}";
        }
    }
}