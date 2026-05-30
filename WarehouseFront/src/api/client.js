// ============ API CLIENT ============
// Wrapper mbi fetch me auto-refresh transparent.
//
// Rrjedha kur access token skadon:
//   1. Request kthen 401
//   2. Provojmë refresh token-in (vetëm një herë, edhe nëse disa requests
//      dështojnë njëkohësisht — shih refreshPromise më poshtë)
//   3. Nëse refresh del mirë → ruajmë token-in e ri → përsërisim request-in
//   4. Nëse refresh dështon → pastrojmë sesionin → hedhim error që UI të
//      bëjë redirect te /login (e kap ProtectedRoute / AuthContext)

import { tokenStorage } from '../auth/tokenStorage';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5138/api';

// Error special që sinjalizon se duhet logout/redirect te login.
export class AuthError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'AuthError';
  }
}

// Mban refresh-in aktiv që të mos bëhen disa refresh paralel.
let refreshPromise = null;

async function doRefresh() {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) throw new AuthError('No refresh token');

  const res = await fetch(`${API_BASE}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    tokenStorage.clear();
    throw new AuthError('Refresh failed');
  }

  const data = await res.json();
  // AuthResponseDto: accessToken, refreshToken, email, userId, roles
  tokenStorage.setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: { email: data.email, userId: data.userId, roles: data.roles },
  });
  return data.accessToken;
}

// Sigurohet që vetëm një refresh ndodh në një kohë.
function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Kryen një fetch të vetëm me token-in aktual.
async function rawFetch(path, options, token) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

export async function api(path, options = {}) {
  let token = tokenStorage.getAccessToken();
  let res = await rawFetch(path, options, token);

  // Nëse 401 dhe kemi refresh token, provojmë një herë të rifreskojmë.
  // skipAuthRefresh përdoret nga vetë login/refresh që të mos hyjnë në cikël.
  if (res.status === 401 && !options.skipAuthRefresh && tokenStorage.getRefreshToken()) {
    try {
      token = await refreshAccessToken();
      res = await rawFetch(path, options, token); // përsërit me token të ri
    } catch {
      tokenStorage.clear();
      throw new AuthError();
    }
  }

  if (!res.ok) {
    // Lexojmë mesazhin e backend-it (nëse ka) për çdo rast gabimi.
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      // përgjigjja s'ishte JSON
    }

    // 401 te login/refresh (skipAuthRefresh) = kredenciale gabim, JO session
    // expired. Kthejmë mesazhin real ("Invalid email or password").
    // 401 në një request normal (pas refresh të dështuar) = session expired.
    if (res.status === 401 && !options.skipAuthRefresh) {
      tokenStorage.clear();
      throw new AuthError(message);
    }

    throw new Error(message);
  }

  return res.status === 204 ? null : res.json();
}

export const http = {
  get: path => api(path),
  post: (path, body, opts = {}) => api(path, { method: 'POST', body, ...opts }),
  put: (path, body) => api(path, { method: 'PUT', body }),
  patch: (path, body) => api(path, { method: 'PATCH', body }),
  del: path => api(path, { method: 'DELETE' }),
};
