import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Mbron një grup route-esh nga rolet që s'kanë akses.
// Përdorimi:
//   <Route element={<RoleRoute allowedRoles={['Admin', 'Manager']} />}>
//     <Route path="/warehouses" element={<WarehousesPage />} />
//   </Route>
//
// Nëse user-i nuk ka asnjë nga rolet e lejuara, ridrejtohet te '/'.
export default function RoleRoute({ allowedRoles = [] }) {
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  const hasAccess =
    allowedRoles.length === 0 ||
    allowedRoles.some((role) => userRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
