import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../auth/ProtectedRoute";
import PermissionRoute from "../auth/PermissionRoute";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import WarehousesPage from "../pages/WarehousesPage";
import RaftsPage from "../pages/RaftsPage";
import ProductsPage from "../pages/ProductsPage";
import InventoryPage from "../pages/InventoryPage";
import PurchaseOrdersPage from "../pages/PurchaseOrdersPage";
import SuppliersPage from "../pages/SuppliersPage";
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

// Qasja te faqet gat-ohet nga LEJET (jo emrat e roleve) — i njëjti burim me backend-in.
// Çdo route kërkon lejen përkatëse 'View'; ndryshe ridrejtohet te '/'.
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Dashboard — çdo përdorues i autentikuar */}
          <Route path="/" element={<DashboardPage />} />

          <Route element={<PermissionRoute anyOf={["Products.View"]} />}>
            <Route path="/products" element={<ProductsPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["Warehouses.View"]} />}>
            <Route path="/warehouses" element={<WarehousesPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["Rafts.View"]} />}>
            <Route path="/rafts" element={<RaftsPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["Suppliers.View"]} />}>
            <Route path="/suppliers" element={<SuppliersPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["Clients.View"]} />}>
            <Route path="/clients" element={<ClientsPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["Inventory.View"]} />}>
            <Route path="/inventory" element={<InventoryPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["PurchaseOrders.View"]} />}>
            <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["Pallets.View"]} />}>
            <Route path="/pallets" element={<PalletsPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["PackingLists.View"]} />}>
            <Route path="/packing-lists" element={<PackingListsPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["SalesOrders.View", "SalesOrders.ViewOwn"]} />}>
            <Route path="/sales-orders" element={<SalesOrdersPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["Shipments.View", "Shipments.ViewOwn"]} />}>
            <Route path="/shipments" element={<ShipmentsPage />} />
          </Route>

          {/* Administration */}
          <Route element={<PermissionRoute anyOf={["Users.View"]} />}>
            <Route path="/admin/users" element={<UserManagementPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["Roles.View"]} />}>
            <Route path="/admin/roles" element={<RolesPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["AuditLogs.View"]} />}>
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          </Route>
          <Route element={<PermissionRoute anyOf={["Settings.View"]} />}>
            <Route path="/admin/settings" element={<SystemSettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
