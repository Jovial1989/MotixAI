'use client';

type SessionUser = {
  role?: string;
  hasCompletedOnboarding?: boolean;
  planType?: string;
  subscriptionStatus?: string;
  trialEndsAt?: string | null;
};

type SessionResponse = {
  accessToken: string;
  refreshToken?: string | null;
  user: SessionUser;
};

export type StoredSessionState = {
  role: string;
  email: string;
  hasCompletedOnboarding: boolean;
  planType: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
};

function decodeJwt(token: string): { role?: string; email?: string; sub?: string; exp?: number } | null {
  try {
    const body = token.split('.')[1];
    if (!body) return null;
    const normalized = body
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(body.length / 4) * 4, '=');
    return JSON.parse(atob(normalized)) as { role?: string; email?: string; sub?: string; exp?: number };
  } catch {
    return null;
  }
}

export function storeAuthSession(result: SessionResponse) {
  localStorage.setItem('motix_access_token', result.accessToken);
  if (result.refreshToken) {
    localStorage.setItem('motix_refresh_token', result.refreshToken);
  } else {
    localStorage.removeItem('motix_refresh_token');
  }
  localStorage.setItem('motix_user_role', result.user.role ?? 'USER');
  localStorage.setItem('motix_onboarding_done', result.user.hasCompletedOnboarding ? 'true' : 'false');
  localStorage.setItem('motix_user', JSON.stringify({
    planType: result.user.planType ?? 'free',
    subscriptionStatus: result.user.subscriptionStatus ?? 'none',
    trialEndsAt: result.user.trialEndsAt ?? null,
  }));
}

export function clearAuthSession() {
  localStorage.removeItem('motix_access_token');
  localStorage.removeItem('motix_refresh_token');
  localStorage.removeItem('motix_user_role');
  localStorage.removeItem('motix_onboarding_done');
  localStorage.removeItem('motix_user');
}

export function readStoredSessionState(): StoredSessionState {
  if (typeof window === 'undefined') {
    return {
      role: 'USER',
      email: '',
      hasCompletedOnboarding: false,
      planType: 'free',
      subscriptionStatus: 'none',
      trialEndsAt: null,
    };
  }

  const token = localStorage.getItem('motix_access_token');
  const payload = token ? decodeJwt(token) : null;

  let userState: SessionUser = {};
  try {
    const raw = localStorage.getItem('motix_user');
    if (raw) userState = JSON.parse(raw) as SessionUser;
  } catch {
    userState = {};
  }

  return {
    role: payload?.role ?? localStorage.getItem('motix_user_role') ?? 'USER',
    email: payload?.email ?? payload?.sub ?? '',
    hasCompletedOnboarding: localStorage.getItem('motix_onboarding_done') === 'true',
    planType: userState.planType ?? 'free',
    subscriptionStatus: userState.subscriptionStatus ?? 'none',
    trialEndsAt: userState.trialEndsAt ?? null,
  };
}

export function hasValidStoredAccessToken(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('motix_access_token');
  if (!token) return false;
  const payload = decodeJwt(token);
  return Boolean(payload?.exp && Date.now() / 1000 < payload.exp);
}

export function isDemoSession(state: StoredSessionState): boolean {
  return state.role === 'GUEST' || state.planType === 'demo';
}

export function isPendingActivation(state: StoredSessionState): boolean {
  return !isDemoSession(state) && (
    state.subscriptionStatus === 'pending' ||
    !state.hasCompletedOnboarding
  );
}

export function isActiveAccountSession(state: StoredSessionState): boolean {
  return hasValidStoredAccessToken() && !isPendingActivation(state) && !isDemoSession(state);
}
