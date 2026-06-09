import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Mbron një grup route-esh sipas lejeve (any-of). Nëse user-i nuk ka asnjë nga
// lejet e dhëna, ridrejtohet te '/'. Burimi i lejeve është i njëjti me backend-in.
//
//   <Route element={<PermissionRoute anyOf={['Warehouses.View']} />}>
//     <Route path="/warehouses" element={<WarehousesPage />} />
//   </Route>
export default function PermissionRoute({ anyOf = [] }) {
  const { hasAnyPermission } = useAuth();

  if (anyOf.length === 0 || hasAnyPermission(anyOf)) {
    return <Outlet />;
  }

  return <Navigate to="/" replace />;
}
