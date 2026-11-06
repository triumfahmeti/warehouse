import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { authApi } from "../api";
import { tokenStorage } from "./tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!user && tokenStorage.isAuthenticated();

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      const u = {
        email: data.email,
        userId: data.userId,
        roles: data.roles || [],
        permissions: data.permissions || [],
        tenantId: data.tenantId,
        tenantName: data.tenantName,
        isSuperAdmin: data.isSuperAdmin,
      };
      tokenStorage.clear();
      tokenStorage.setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: u,
      });
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {}
    tokenStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      tokenStorage.clear();
      setUser(null);
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const hasPermission = useCallback(
    (perm) => (user?.permissions || []).includes(perm),
    [user],
  );

  const hasAnyPermission = useCallback(
    (...perms) =>
      perms.flat().some((p) => (user?.permissions || []).includes(p)),
    [user],
  );

  const isSuperAdmin = !!user?.isSuperAdmin;

  const [activeTenantId, setActiveTenantIdState] = useState(() =>
    tokenStorage.getActiveTenantId(),
  );

  // SuperAdmin-i "hyn" në një tenant. Rilexojmë faqen sepse çdo listë e
  // ngarkuar deri tani i përket tenantit të mëparshëm — më e sigurt se të
  // provojmë t'i rifreskojmë një nga një.
  const enterTenant = useCallback((tenantId, tenantName) => {
    tokenStorage.setActiveTenantId(tenantId);
    setActiveTenantIdState(String(tenantId));
    const u = { ...tokenStorage.getUser(), tenantName };
    tokenStorage.setSession({ user: u });
    window.location.href = "/";
  }, []);

  const exitTenant = useCallback(() => {
    tokenStorage.setActiveTenantId(null);
    setActiveTenantIdState(null);
    const u = { ...tokenStorage.getUser(), tenantName: null };
    tokenStorage.setSession({ user: u });
    window.location.href = "/admin/tenants";
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    isSuperAdmin,
    activeTenantId,
    enterTenant,
    exitTenant,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
