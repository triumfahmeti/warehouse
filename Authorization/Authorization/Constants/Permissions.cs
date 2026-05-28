using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Warehouse.Authorization.Constants
{
    public class Permissions
    {
        public static class Orders
        {
            public const string View = "Orders.View";
            public const string Create = "Orders.Create";
            public const string Approve = "Orders.Approve";
            public const string Delete = "Orders.Delete";
        }

        public static class Inventory
        {
            public const string View = "Inventory.View";
            public const string Update = "Inventory.Update";
            public const string Transfer = "Inventory.Transfer";
        }

        public static class Products
        {
            public const string View = "Products.View";
            public const string Create = "Products.Create";
            public const string Edit = "Products.Edit";
            public const string Delete = "Products.Delete";
        }

        public static class Users
        {
            public const string View = "Users.View";
            public const string Create = "Users.Create";
            public const string Manage = "Users.Manage";
        }

        public static class Reports
        {
            public const string View = "Reports.View";
        }

        public static IEnumerable<string> GetAll()
        {
            return typeof(Permissions).GetNestedTypes()
                .SelectMany(t => t.GetFields())
                .Where(f => f.IsLiteral && f.FieldType == typeof(string))
                .Select(f => (string)f.GetRawConstantValue()!);
        }
    }
}