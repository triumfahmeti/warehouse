// ============ AUTH CONTEXT ============
// Gjendja globale e autentifikimit. Mban user-in aktual dhe ofron
// login/logout. Çdo komponent e merr me hook-un useAuth().

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi } from '../api';
import { tokenStorage } from './tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Inicializojmë nga localStorage që refresh i faqes të mos na nxjerrë jashtë.
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!user && tokenStorage.isAuthenticated();

  // LOGIN: thërret backend-in, ruan token-et + user-in.
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      const u = { email: data.email, userId: data.userId, roles: data.roles || [] };
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

  // LOGOUT: anulon refresh token-in te backend (best-effort), pastron lokal.
  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // edhe nëse dështon backend-i, vazhdojmë me pastrimin lokal
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  // Nëse një tab tjetër bën logout, sinkronizojmë edhe këtë.
  useEffect(() => {
    const onStorage = e => {
      if (e.key === 'accessToken' && !e.newValue) setUser(null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = { user, isAuthenticated, loading, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
