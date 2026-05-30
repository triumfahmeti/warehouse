import {
  Package, Warehouse as WarehouseIcon, Layers, Box, Users, FileText,
  Truck, ClipboardList, BarChart3, Shield, Activity, Settings, UserCog,
} from 'lucide-react';

// Konfigurimi i navigimit. 'roles' tregon cilët role mund ta shohin item-in.
// Nëse 'roles' mungon, item shihet nga të gjithë.
export const navItems = [
  { id: 'dashboard',    label: 'Dashboard',       icon: BarChart3,      path: '/',                   group: 'Operations',     roles: ['Admin', 'Manager', 'Worker', 'Client'] },

  // Inventory - vetëm staff i brendshëm
  { id: 'warehouses',   label: 'Warehouses',      icon: WarehouseIcon,  path: '/warehouses',         group: 'Inventory',      roles: ['Admin', 'Manager'] },
  { id: 'rafts',        label: 'Rafts',           icon: Layers,         path: '/rafts',              group: 'Inventory',      roles: ['Admin', 'Manager'] },
  { id: 'products',     label: 'Products',        icon: Package,        path: '/products',           group: 'Inventory',      roles: ['Admin', 'Manager', 'Worker'] },
  { id: 'inventory',    label: 'Inventory',       icon: Box,            path: '/inventory',          group: 'Inventory',      roles: ['Admin', 'Manager', 'Worker'] },
  { id: 'clients',      label: 'Clients',         icon: Users,          path: '/clients',            group: 'Inventory',      roles: ['Admin', 'Manager'] },

  // Fulfillment
  { id: 'salesorders',  label: 'Sales Orders',    icon: FileText,       path: '/sales-orders',       group: 'Fulfillment',    roles: ['Admin', 'Manager', 'Client'] },
  { id: 'pallets',      label: 'Pallets',         icon: Box,            path: '/pallets',            group: 'Fulfillment',    roles: ['Admin', 'Manager', 'Worker'] },
  { id: 'packinglists', label: 'Packing Lists',   icon: ClipboardList,  path: '/packing-lists',      group: 'Fulfillment',    roles: ['Admin', 'Manager', 'Worker'] },
  { id: 'shipments',    label: 'Shipments',       icon: Truck,          path: '/shipments',          group: 'Fulfillment',    roles: ['Admin', 'Manager', 'Worker', 'Client'], highlight: true },

  // Administration - vetëm Admin
  { id: 'users',        label: 'User Management', icon: UserCog,        path: '/admin/users',        group: 'Administration', roles: ['Admin'] },
  { id: 'roles',        label: 'Roles',           icon: Shield,         path: '/admin/roles',        group: 'Administration', roles: ['Admin'] },
  { id: 'auditlogs',    label: 'Audit Logs',      icon: Activity,       path: '/admin/audit-logs',   group: 'Administration', roles: ['Admin'] },
  { id: 'syssettings',  label: 'System Settings', icon: Settings,       path: '/admin/settings',     group: 'Administration', roles: ['Admin'] },
];

export const navGroups = ['Operations', 'Inventory', 'Fulfillment', 'Administration'];

// Helper: kthen items që user-i mund të shohë bazuar te rolet e tij.
export function getVisibleNavItems(userRoles = []) {
  return navItems.filter(item => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.some(role => userRoles.includes(role));
  });
}

// Helper: kthen grupet që kanë të paktën një item të dukshëm.
export function getVisibleGroups(visibleItems) {
  const groupsWithItems = new Set(visibleItems.map(i => i.group));
  return navGroups.filter(g => groupsWithItems.has(g));
}