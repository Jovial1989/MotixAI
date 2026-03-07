import { MotixApiClient } from '@motixai/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Token helpers ──────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('motix_access_token');
}

function isTokenExpiredSoon(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Refresh if within 60s of expiry
    return !payload.exp || Date.now() / 1000 >= payload.exp - 60;
  } catch {
    return true;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshToken = localStorage.getItem('motix_refresh_token');
      if (!refreshToken) throw new Error('no refresh token');

      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error('refresh failed');

      const data = await res.json() as { accessToken: string; refreshToken?: string };
      localStorage.setItem('motix_access_token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('motix_refresh_token', data.refreshToken);
      return data.accessToken;
    } catch {
      localStorage.removeItem('motix_access_token');
      localStorage.removeItem('motix_refresh_token');
      window.location.href = '/auth/login';
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function getValidToken(): Promise<string | null> {
  const token = getStoredToken();
  if (!token) return null;
  if (!isTokenExpiredSoon(token)) return token;
  return doRefresh();
}

// ── API client with proactive token refresh ─────────────────────────────────

const _client = new MotixApiClient({
  baseUrl,
  getAccessToken: getStoredToken,
});

// Proxy every method call: refresh the token first if needed, store the fresh
// token back into localStorage so getAccessToken() picks it up, then delegate.
export const webApi = new Proxy(_client, {
  get(target, prop, receiver) {
    const val = Reflect.get(target, prop, receiver);
    if (typeof val !== 'function') return val;
    return async (...args: unknown[]) => {
      if (typeof window !== 'undefined') {
        const token = await getValidToken();
        if (token) localStorage.setItem('motix_access_token', token);
      }
      return (val as (...a: unknown[]) => unknown).apply(target, args);
    };
  },
});
