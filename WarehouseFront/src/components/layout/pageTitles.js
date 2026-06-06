// Titujt e topbar-it për çdo route. Çelësi është path-i i react-router.
// AppLayout e lexon path-in aktual dhe shfaq titull/subtitle përkatës.
export const pageTitles = {
  '/':              { title: 'Dashboard',     subtitle: 'Overview · Lab 2' },
  '/warehouses':    { title: 'Warehouses',    subtitle: 'Inventory Management' },
  '/rafts':         { title: 'Rafts',         subtitle: 'Storage Locations' },
  '/products':      { title: 'Products',      subtitle: 'Catalog' },
  '/inventory':     { title: 'Inventory',     subtitle: 'Stock Levels' },
  '/clients':       { title: 'Clients',       subtitle: 'Customer Management' },
  '/sales-orders':  { title: 'Sales Orders',  subtitle: 'Fulfillment' },
  '/pallets':       { title: 'Pallets',       subtitle: 'Packaging' },
  '/packing-lists': { title: 'Packing Lists', subtitle: 'Pre-shipment' },
  '/shipments':     { title: 'Shipments',     subtitle: 'Shipment' },
   // Administration
  '/admin/users':    { title: 'User Management', subtitle: 'Administration' },
  '/admin/roles':    { title: 'Roles',           subtitle: 'Administration' },
  '/admin/audit':    { title: 'Audit Logs',      subtitle: 'Administration' },
  '/admin/settings': { title: 'System Settings', subtitle: 'Administration' },
};

export const defaultTitle = { title: 'Warehouse OS', subtitle: '' };
