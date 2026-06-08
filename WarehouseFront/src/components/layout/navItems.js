import {
  Package, Warehouse as WarehouseIcon, Layers, Box, Users, FileText,
  Truck, ClipboardList, BarChart3, Shield, Activity, Settings, UserCog, ShoppingCart, Building2,
} from 'lucide-react';

// Konfigurimi i navigimit. 'perms' = lejet (any-of) që e shfaqin item-in.
// Nëse 'perms' mungon, item shihet nga çdo përdorues i autentikuar.
export const navItems = [
  { id: 'dashboard',    label: 'Dashboard',       icon: BarChart3,      path: '/',                 group: 'Operations' },

  // Inventory
  { id: 'warehouses',   label: 'Warehouses',      icon: WarehouseIcon,  path: '/warehouses',       group: 'Inventory',      perms: ['Warehouses.View'] },
  { id: 'rafts',        label: 'Rafts',           icon: Layers,         path: '/rafts',            group: 'Inventory',      perms: ['Rafts.View'] },
  { id: 'products',     label: 'Products',        icon: Package,        path: '/products',         group: 'Inventory',      perms: ['Products.View'] },
  { id: 'inventory',    label: 'Inventory',       icon: Box,            path: '/inventory',        group: 'Inventory',      perms: ['Inventory.View'] },
  { id: 'purchaseorders', label: 'Purchase Orders', icon: ShoppingCart, path: '/purchase-orders', group: 'Inventory',      perms: ['PurchaseOrders.View'] },
  { id: 'suppliers',    label: 'Suppliers',       icon: Building2,      path: '/suppliers',        group: 'Inventory',      perms: ['Suppliers.View'] },
  { id: 'clients',      label: 'Clients',         icon: Users,          path: '/clients',          group: 'Inventory',      perms: ['Clients.View'] },

  // Fulfillment
  { id: 'salesorders',  label: 'Sales Orders',    icon: FileText,       path: '/sales-orders',     group: 'Fulfillment',    perms: ['SalesOrders.View', 'SalesOrders.ViewOwn'] },
  { id: 'pallets',      label: 'Pallets',         icon: Box,            path: '/pallets',          group: 'Fulfillment',    perms: ['Pallets.View'] },
  { id: 'packinglists', label: 'Packing Lists',   icon: ClipboardList,  path: '/packing-lists',    group: 'Fulfillment',    perms: ['PackingLists.View'] },
  { id: 'shipments',    label: 'Shipments',       icon: Truck,          path: '/shipments',        group: 'Fulfillment',    perms: ['Shipments.View', 'Shipments.ViewOwn'] },

  // Administration
  { id: 'users',        label: 'User Management', icon: UserCog,        path: '/admin/users',      group: 'Administration', perms: ['Users.View'] },
  { id: 'roles',        label: 'Roles',           icon: Shield,         path: '/admin/roles',      group: 'Administration', perms: ['Roles.View'] },
  { id: 'auditlogs',    label: 'Audit Logs',      icon: Activity,       path: '/admin/audit-logs', group: 'Administration', perms: ['AuditLogs.View'] },
  { id: 'syssettings',  label: 'System Settings', icon: Settings,       path: '/admin/settings',   group: 'Administration', perms: ['Settings.View'] },
];

export const navGroups = ['Operations', 'Inventory', 'Fulfillment', 'Administration'];

// Helper: kthen items që user-i mund të shohë sipas lejeve të tij.
// hasAny: funksion (perms[]) => bool (nga useAuth().hasAnyPermission).
export function getVisibleNavItems(hasAny) {
  return navItems.filter(item => {
    if (!item.perms || item.perms.length === 0) return true;
    return hasAny(item.perms);
  });
}

// Helper: kthen grupet që kanë të paktën një item të dukshëm.
export function getVisibleGroups(visibleItems) {
  const groupsWithItems = new Set(visibleItems.map(i => i.group));
  return navGroups.filter(g => groupsWithItems.has(g));
}
