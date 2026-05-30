namespace Warehouse.DTOs.Admin
{
    public class RoleWithPermissionsDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Description { get; set; } = string.Empty;
        public List<string> Permissions { get; set; } = new();
        public List<string> AllPermissions { get; set; } = new();
    }

    public class UpdateRolePermissionsDto
    {
        public List<string> PermissionNames { get; set; } = new();
    }
}
