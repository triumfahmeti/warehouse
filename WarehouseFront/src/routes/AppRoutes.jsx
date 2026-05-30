import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";
import RoleRoute from "../auth/RoleRoute";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import WarehousesPage from "../pages/WarehousesPage";
import RaftsPage from "../pages/RaftsPage";
import ProductsPage from "../pages/ProductsPage";
import InventoryPage from "../pages/InventoryPage";
import ClientsPage from "../pages/ClientsPage";
import SalesOrdersPage from "../pages/SalesOrdersPage";
import PalletsPage from "../pages/PalletsPage";
import PackingListsPage from "../pages/PackingListsPage";
import ShipmentsPage from "../pages/ShipmentsPage";
import NotFoundPage from "../pages/NotFoundPage";
import UserManagementPage from "../pages/UserManagementPage";
import RolesPage from "../pages/RolesPage";
import AuditLogsPage from "../pages/AuditLogsPage";
import SystemSettingsPage from "../pages/SystemSettingsPage";

// Struktura:
//   /login - publik
//   ProtectedRoute - duhet login
//     AppLayout - shell me sidebar/topbar
//       Route-et publike për të gjithë rolet (Dashboard)
//       RoleRoute - mbron grupe sipas rolesh
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Të gjithë rolet */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/shipments" element={<ShipmentsPage />} />
          <Route path="/sales-orders" element={<SalesOrdersPage />} />

          {/* Vetëm Admin + Manager */}
          <Route element={<RoleRoute allowedRoles={["Admin", "Manager"]} />}>
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/rafts" element={<RaftsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
          </Route>

          {/* Admin + Manager + Worker (jo Client) */}
          <Route
            element={
              <RoleRoute allowedRoles={["Admin", "Manager", "Worker"]} />
            }
          >
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/pallets" element={<PalletsPage />} />
            <Route path="/packing-lists" element={<PackingListsPage />} />
          </Route>

          {/* Vetëm Admin — Administration panel */}
          <Route element={<RoleRoute allowedRoles={["Admin"]} />}>
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/roles" element={<RolesPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="/admin/settings" element={<SystemSettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
