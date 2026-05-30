// ============ PROTECTED ROUTE ============
// Mbështjell route-et që kërkojnë login. Nëse user-i s'është i autentifikuar,
// e ridrejton te /login dhe ruan se ku donte të shkonte (që ta kthejmë aty
// pas login-it të suksesshëm).

import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
