'use client';

import { env } from '@/lib/env';

type SessionResponse = {
  accessToken: string;
  refreshToken: string | null;
  user: {
    role: string;
    hasCompletedOnboarding: boolean;
    planType: string;
    subscriptionStatus: string;
    trialEndsAt: string | null;
  };
};

function decodePayload(token: string): { exp?: number } | null {
  try {
    const body = token.split('.')[1];
    if (!body) return null;
    const normalized = body
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(body.length / 4) * 4, '=');
    return JSON.parse(atob(normalized)) as { exp?: number };
  } catch {
    return null;
  }
}

export function hasValidStoredSession(): boolean {
  if (typeof window === 'undefined') return false;

  const token = localStorage.getItem('motix_access_token');
  if (!token) return false;

  const payload = decodePayload(token);
  return Boolean(payload?.exp && Date.now() / 1000 < payload.exp);
}

function storeSession(result: SessionResponse) {
  localStorage.setItem('motix_access_token', result.accessToken);
  if (result.refreshToken) {
    localStorage.setItem('motix_refresh_token', result.refreshToken);
  } else {
    localStorage.removeItem('motix_refresh_token');
  }
  localStorage.setItem('motix_user_role', result.user.role);
  localStorage.setItem('motix_onboarding_done', result.user.hasCompletedOnboarding ? 'true' : 'false');
  localStorage.setItem('motix_user', JSON.stringify({
    planType: result.user.planType,
    subscriptionStatus: result.user.subscriptionStatus,
    trialEndsAt: result.user.trialEndsAt,
  }));
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
  storeSession(result);
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
  storeSession(result);
}
