// ============ MOCK DATA ============
// Të dhëna provizore për zhvillim. Kur të lidhet API-ja e vërtetë,
// këto zëvendësohen me thirrje nga src/api/*. Struktura e objekteve
// këtu pasqyron atë që pret front-i, prandaj API-ja duhet të kthejë
// të njëjtën formë (ose mapoje te shtresa api/).
export const mockData = {
  warehouses: [
    { id: 1, name: 'Warehouse Prishtinë', location: 'Prishtinë, Kosovë', rafts: 12, utilization: 78 },
    { id: 2, name: 'Warehouse Pejë', location: 'Pejë, Kosovë', rafts: 8, utilization: 45 },
    { id: 3, name: 'Warehouse Prizren', location: 'Prizren, Kosovë', rafts: 10, utilization: 62 },
  ],
  rafts: [
    { id: 1, name: 'Raft A1', warehouseId: 1, warehouseName: 'Warehouse Prishtinë', items: 24 },
    { id: 2, name: 'Raft A2', warehouseId: 1, warehouseName: 'Warehouse Prishtinë', items: 18 },
    { id: 3, name: 'Raft B1', warehouseId: 1, warehouseName: 'Warehouse Prishtinë', items: 32 },
    { id: 4, name: 'Raft A1', warehouseId: 2, warehouseName: 'Warehouse Pejë', items: 15 },
  ],
  products: [
    { id: 1, sku: 'LAP-001', name: 'Laptop Dell XPS', type: 'Electronics', length: 30, width: 20, height: 5, weight: 2.5 },
    { id: 2, sku: 'PHN-001', name: 'iPhone 15 Pro', type: 'Electronics', length: 15, width: 8, height: 1, weight: 0.2 },
    { id: 3, sku: 'CHR-001', name: 'Office Chair', type: 'Furniture', length: 70, width: 70, height: 110, weight: 15 },
    { id: 4, sku: 'BOK-001', name: 'Programming Book', type: 'Books', length: 25, width: 18, height: 3, weight: 0.8 },
    { id: 5, sku: 'MON-001', name: 'Monitor 27"', type: 'Electronics', length: 65, width: 40, height: 8, weight: 5.2 },
  ],
  inventory: [
    { id: 1, productId: 1, productName: 'Laptop Dell XPS', raftId: 1, raftName: 'Raft A1', quantity: 45, reserved: 10, available: 35 },
    { id: 2, productId: 2, productName: 'iPhone 15 Pro', raftId: 1, raftName: 'Raft A1', quantity: 120, reserved: 25, available: 95 },
    { id: 3, productId: 3, productName: 'Office Chair', raftId: 3, raftName: 'Raft B1', quantity: 30, reserved: 5, available: 25 },
    { id: 4, productId: 5, productName: 'Monitor 27"', raftId: 2, raftName: 'Raft A2', quantity: 60, reserved: 12, available: 48 },
  ],
  clients: [
    { id: 1, name: 'TechCorp LLC', email: 'orders@techcorp.com', phone: '+383 44 111 222', address: 'Rr. Agim Ramadani 12, Prishtinë', orders: 24 },
    { id: 2, name: 'Digital Solutions', email: 'info@digitalsol.com', phone: '+383 45 333 444', address: 'Rr. UÇK 88, Pejë', orders: 18 },
    { id: 3, name: 'OfficeMax Kosova', email: 'shop@officemax.xk', phone: '+383 49 555 666', address: 'Rr. Bill Clinton 3, Prizren', orders: 32 },
  ],
  salesOrders: [
    { id: 1, number: 'SO-2026-0001', clientName: 'TechCorp LLC', status: 'Confirmed', total: 5240.00, items: 3, date: '2026-05-20' },
    { id: 2, number: 'SO-2026-0002', clientName: 'Digital Solutions', status: 'Processing', total: 12800.50, items: 5, date: '2026-05-22' },
    { id: 3, number: 'SO-2026-0003', clientName: 'OfficeMax Kosova', status: 'New', total: 890.00, items: 2, date: '2026-05-24' },
    { id: 4, number: 'SO-2026-0004', clientName: 'TechCorp LLC', status: 'Completed', total: 3450.00, items: 4, date: '2026-05-18' },
  ],
  pallets: [
    { id: 1, number: 'PAL-001', packagingType: 'Standard', items: 10, weight: 25.5, salesOrderId: 1 },
    { id: 2, number: 'PAL-002', packagingType: 'Heavy', items: 5, weight: 78.2, salesOrderId: 2 },
    { id: 3, number: 'PAL-003', packagingType: 'Standard', items: 8, weight: 18.4, salesOrderId: 2 },
  ],
  packingLists: [
    { id: 1, number: 'PL-2026-0001', salesOrderNumber: 'SO-2026-0001', warehouseName: 'Warehouse Prishtinë', status: 'Ready', pallets: 1, date: '2026-05-21' },
    { id: 2, number: 'PL-2026-0002', salesOrderNumber: 'SO-2026-0002', warehouseName: 'Warehouse Prishtinë', status: 'Draft', pallets: 2, date: '2026-05-23' },
    { id: 3, number: 'PL-2026-0003', salesOrderNumber: 'SO-2026-0004', warehouseName: 'Warehouse Pejë', status: 'Shipped', pallets: 1, date: '2026-05-19' },
  ],
  shipments: [
    { id: 1, number: 'SHP-2026-0001', packingListNumber: 'PL-2026-0001', warehouseName: 'Warehouse Prishtinë', status: 'Ready', date: '2026-05-22' },
    { id: 2, number: 'SHP-2026-0002', packingListNumber: 'PL-2026-0003', warehouseName: 'Warehouse Pejë', status: 'Delivered', date: '2026-05-19' },
    { id: 3, number: 'SHP-2026-0003', packingListNumber: 'PL-2026-0002', warehouseName: 'Warehouse Prishtinë', status: 'Shipped', date: '2026-05-24' },
    { id: 4, number: 'SHP-2026-0004', packingListNumber: 'PL-2026-0001', warehouseName: 'Warehouse Prishtinë', status: 'Draft', date: '2026-05-25' },
  ],
};
