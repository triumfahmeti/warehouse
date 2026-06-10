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

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
