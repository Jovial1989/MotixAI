'use client';

import { env } from '@/lib/env';
import { hasValidStoredAccessToken, storeAuthSession } from '@/lib/session';

type SessionResponse = Parameters<typeof storeAuthSession>[0];

export function hasValidStoredSession(): boolean {
  return hasValidStoredAccessToken();
}

async function refreshExistingSession(): Promise<boolean> {
  const refreshToken = localStorage.getItem('motix_refresh_token');
  if (!refreshToken) return false;

  const response = await fetch(`${env.apiUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) return false;

  const result = await response.json() as SessionResponse;
  storeAuthSession(result);
  return true;
}

export async function ensureAppSession(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (hasValidStoredSession()) return;

  if (await refreshExistingSession()) return;

  const response = await fetch(`${env.apiUrl}/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error('guest_auth_failed');
  }

  const result = await response.json() as SessionResponse;
  storeAuthSession(result);
}
