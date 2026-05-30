// ============ TOKEN STORAGE ============
// Vendi i vetëm që prek localStorage për auth. Çdo pjesë tjetër e kodit
// kalon nga këtu — kështu nëse nesër ndryshojmë strategjinë e ruajtjes
// (p.sh. cookie), ndryshojmë vetëm këtë file.

const ACCESS_KEY = 'accessToken';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'authUser';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),

  // Ruajmë çfarë kthen AuthResponseDto pas login/refresh.
  setSession({ accessToken, refreshToken, user }) {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // Lexon user-in e ruajtur (email, userId, roles). Null nëse s'ka.
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated() {
    return !!localStorage.getItem(ACCESS_KEY);
  },
};
