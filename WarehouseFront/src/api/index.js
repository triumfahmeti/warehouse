// ============ API MODULES ============
// Çdo entitet ka objektin e vet me metodat CRUD + veprime specifike.
// Path-et duhet të përputhen me controller-at e .NET API-së tënde.
// Përshtati path-et nëse ndryshojnë (p.sh. '/warehouse' vs '/warehouses').
//
// Përdorimi (kur të lidhesh):
//   import { shipmentsApi } from '../api';
//   const data = await shipmentsApi.getAll();

import { http } from './client';

export const warehousesApi = {
  getAll: () => http.get('/warehouses'),
  getById: id => http.get(`/warehouses/${id}`),
  create: data => http.post('/warehouses', data),
  update: (id, data) => http.put(`/warehouses/${id}`, data),
  remove: id => http.del(`/warehouses/${id}`),
};

export const raftsApi = {
  getAll: () => http.get('/rafts'),
  getById: id => http.get(`/rafts/${id}`),
  create: data => http.post('/rafts', data),
  update: (id, data) => http.put(`/rafts/${id}`, data),
  remove: id => http.del(`/rafts/${id}`),
};

export const productsApi = {
  getAll: () => http.get('/product'),
  getById: id => http.get(`/product/${id}`),
  create: data => http.post('/product', data),
  update: (id, data) => http.put(`/product/${id}`, data),
  remove: id => http.del(`/product/${id}`),
};

export const inventoryApi = {
  getAll: () => http.get('/inventory'),
  getById: id => http.get(`/inventory/${id}`),
  addStock: data => http.post('/inventory', data),
};

export const clientsApi = {
  getAll: () => http.get('/clients'),
  create: data => http.post('/clients', data),
  update: (id, data) => http.put(`/clients/${id}`, data),
  getOrders: id => http.get(`/clients/${id}/orders`),
  getMyOrders: () => http.get('/clients/my-orders'),
  getMyStats: () => http.get('/clients/my-stats'),
};

export const salesOrdersApi = {
  getAll: () => http.get('/salesorder'),                 // Manager/Admin: të gjitha
  getMine: () => http.get('/salesorder/mine'),           // Client: të vetat
  getById: id => http.get(`/salesorder/${id}`),
  create: items => http.post('/salesorder', { items }),  // Client krijon (pa çmim)
  setPrices: (id, items) => http.patch(`/salesorder/${id}/set-prices`, items), // Manager
  confirm: id => http.patch(`/salesorder/${id}/confirm`),// Client konfirmon
  cancel: id => http.patch(`/salesorder/${id}/cancel`),  // Manager (cilendo) ose Client (te veten)
};

export const suppliersApi = {
  getAll: () => http.get('/suppliers'),
  getById: id => http.get(`/suppliers/${id}`),
  create: data => http.post('/suppliers', data),
  update: (id, data) => http.put(`/suppliers/${id}`, data),
  remove: id => http.del(`/suppliers/${id}`),
};

// Purchase Orders — porositë drejt supplier-ëve.
// Flow: create (Pending) → approve (Approved) → receive me raft për çdo item (Received) → close.
export const purchaseOrdersApi = {
  getAll: () => http.get('/purchaseorders'),
  getById: id => http.get(`/purchaseorders/${id}`),
  create: data => http.post('/purchaseorders', data),
  receive: (id, data) => http.post(`/purchaseorders/${id}/receive`, data),
  cancel: id => http.post(`/purchaseorders/${id}/cancel`),
  close: id => http.post(`/purchaseorders/${id}/close`),
};

export const palletsApi = {
  getAll:          ()         => http.get('/pallets'),
  getById:         id         => http.get(`/pallets/${id}`),
  create:          data       => http.post('/pallets', data),
  update:          (id, data) => http.put(`/pallets/${id}`, data),
  remove:          id         => http.del(`/pallets/${id}`),
  fromOrder:       data       => http.post('/pallets/from-order', data),
  orderPreview:    id         => http.get(`/pallets/order-preview/${id}`),
};

export const packingListsApi = {
  getAll: () => http.get('/packinglist'),
  getAvailable: () => http.get('/packinglist/available'), // ← vetëm ato pa shipment
  getById: id => http.get(`/packinglist/${id}`),
  create: data => http.post('/packinglist', data),
  markReady: id => http.patch(`/packinglist/${id}/ready`),
  cancel: id => http.patch(`/packinglist/${id}/cancel`),
};

// Shipment — moduli kryesor. Veprimet e tranzicionit të statusit
// (ready/ship/deliver) varen nga si i ke emërtuar endpoint-et në backend.
export const shipmentsApi = {
  getAll: () => http.get('/shipment'),
  getMine: () => http.get('/shipment/mine'),  // ← shto
  getById: id => http.get(`/shipment/${id}`),
  create: data => http.post('/shipment', data),
  markReady: id => http.patch(`/shipment/${id}/ready`),
  ship: id => http.patch(`/shipment/${id}/ship`),
  deliver: id => http.patch(`/shipment/${id}/deliver`),
};

// Client dashboard - statistika personale të user-it të loguar.
// Backend duhet ta filtrojë automatikisht sipas user-it nga JWT.
// Nëse endpoint-i s'ekziston ende, ClientDashboard përdor fallback.


// Auth — lidhet me AuthController-in tënd.
// login përdor skipAuthRefresh që një 401 (password gabim) të mos provojë
// refresh, por të kthejë gabimin direkt.
export const authApi = {
  login: data => http.post('/auth/login', data, { skipAuthRefresh: true }),
  register: data => http.post('/auth/register', data),
  logout: refreshToken => http.post('/auth/logout', { refreshToken }),
  me: () => http.get('/auth/me'),
};

// User Management — vetëm Admin.
export const usersApi = {
  getAll: () => http.get('/usermanagement'),
  update: (id, data) => http.put(`/usermanagement/${id}`, data),
  deactivate: id => http.patch(`/usermanagement/${id}/deactivate`),
  activate: id => http.patch(`/usermanagement/${id}/activate`),
  assignRole: (id, role) => http.post(`/usermanagement/${id}/roles`, { role }),
  removeRole: (id, role) => http.del(`/usermanagement/${id}/roles/${role}`),
  create: data => http.post('/auth/register', data),
};

// Roles & Permissions — vetëm Admin.
export const rolesApi = {
  getAll: () => http.get('/roles'),
  updatePermissions: (roleId, permissionNames) =>
    http.put(`/roles/${roleId}/permissions`, { permissionNames }),
};

// Audit Logs — me filter opsional.
export const auditLogsApi = {
  getAll: () => http.get('/auditlog'),
  getFiltered: ({ userId, fromDate, toDate, action, entity } = {}) => {
    const params = new URLSearchParams();
    if (userId)   params.set('userId',   userId);
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate)   params.set('toDate',   toDate);
    if (action)   params.set('action',   action);
    if (entity)   params.set('entity',   entity);
    const qs = params.toString();
    return http.get(qs ? `/auditlog/filter?${qs}` : '/auditlog');
  },
};

// System Settings — vetëm Admin.
export const settingsApi = {
  getAll: () => http.get('/setting'),
  getById: id => http.get(`/setting/${id}`),
  create: data => http.post('/setting', data),
  update: (id, data) => http.put(`/setting/${id}`, data),
  remove: id => http.del(`/setting/${id}`),
};

// Admin Dashboard — statistikat e sistemit.
export const adminDashboardApi = {
  getStats: () => http.get('/admindashboard/stats'),
};
