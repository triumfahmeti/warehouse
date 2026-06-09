// ============ API CLIENT ============
import { tokenStorage } from '../auth/tokenStorage';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5138/api';

export class AuthError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'AuthError';
  }
}

let refreshPromise = null;

async function doRefresh() {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new AuthError('No refresh token');
  }

  const res = await fetch(`${API_BASE}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new AuthError('Refresh failed');
  }

  const data = await res.json();
  tokenStorage.setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: { email: data.email, userId: data.userId, roles: data.roles, permissions: data.permissions || [] },
  });
  return data.accessToken;
}

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

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

  if (res.status === 401 && !options.skipAuthRefresh && tokenStorage.getRefreshToken()) {
    try {
      token = await refreshAccessToken();
      res = await rawFetch(path, options, token);
    } catch {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      throw new AuthError();
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {}

    if (res.status === 401 && !options.skipAuthRefresh) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent('auth:logout'));
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
  upload: async (path, formData) => {
    let token = tokenStorage.getAccessToken();
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try { const d = await res.json(); message = d.message || message; } catch {}
      throw new Error(message);
    }
    return res.status === 204 ? null : res.json();
  },
};