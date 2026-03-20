'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { webApi } from '@/lib/api';

export default function SignupPage() {
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pendingQuery = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('q')
    : null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      const result = await webApi.signup({
        email:    String(data.get('email')),
        password: String(data.get('password')),
      });
      localStorage.setItem('motix_access_token',  result.accessToken);
      if (result.refreshToken) localStorage.setItem('motix_refresh_token', result.refreshToken);
      localStorage.setItem('motix_user_role', result.user.role);
      localStorage.setItem('motix_onboarding_done', result.user.hasCompletedOnboarding ? 'true' : 'false');
      localStorage.setItem('motix_user', JSON.stringify({
        planType: result.user.planType,
        subscriptionStatus: result.user.subscriptionStatus,
        trialEndsAt: result.user.trialEndsAt,
      }));
      // New users always go to onboarding (hasCompletedOnboarding = false on first signup)
      const base = result.user.hasCompletedOnboarding ? '/dashboard' : '/onboarding';
      router.push(pendingQuery ? `${base}?q=${encodeURIComponent(pendingQuery)}` : base);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  async function onGuest() {
    setError(null);
    setLoading(true);
    try {
      const result = await webApi.guest();
      localStorage.setItem('motix_access_token', result.accessToken);
      localStorage.setItem('motix_user_role', result.user.role);
      localStorage.setItem('motix_onboarding_done', 'true');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to continue as guest');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-top-bar">
        <Link href="/" className="auth-back-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </Link>
        <Link href="/" className="auth-logo">Motixi</Link>
        <div style={{ width: 60 }} />
      </div>

      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">
          Already have an account?{' '}
          <Link href="/auth/login">Sign in</Link>
        </p>

        <form onSubmit={onSubmit}>
          <div className="auth-fields">
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input name="email" type="email" required placeholder="you@example.com" className="auth-input" />
            </div>
            <div className="auth-field">
              <label className="auth-label">Password <span style={{ fontWeight: 400, color: 'var(--ink-40)' }}>min 8 characters</span></label>
              <input name="password" type="password" required minLength={8} placeholder="••••••••" className="auth-input" />
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="auth-btn-primary">
            {loading ? (
              <><span className="gen-spinner" /> Creating account…</>
            ) : 'Create account'}
          </button>
        </form>

        <div className="auth-divider">
          <hr /><span>or</span><hr />
        </div>

        <button type="button" onClick={onGuest} disabled={loading} className="auth-btn-ghost">
          Continue as guest
        </button>
      </div>
    </main>
  );
}
