'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { webApi } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { storeAuthSession } from '@/lib/session';

export default function SignupPage() {
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useT();

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
      storeAuthSession(result);
      const base = result.user.hasCompletedOnboarding ? '/dashboard' : '/onboarding';
      router.push(pendingQuery ? `${base}?q=${encodeURIComponent(pendingQuery)}` : base);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.signupFailed);
    } finally {
      setLoading(false);
    }
  }

  async function onGuest() {
    setError(null);
    setLoading(true);
    try {
      const result = await webApi.guest();
      storeAuthSession(result);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.guestFailed);
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
          {t.common.back}
        </Link>
        <Link href="/" className="auth-logo">Motixi</Link>
        <div style={{ width: 60 }} />
      </div>

      <div className="auth-card">
        <h1 className="auth-title">{t.auth.createAccount}</h1>
        <p className="auth-sub">
          {t.auth.alreadyHaveAccount}{' '}
          <Link href="/auth/login">{t.common.signIn}</Link>
        </p>

        <form onSubmit={onSubmit}>
          <div className="auth-fields">
            <div className="auth-field">
              <label className="auth-label">{t.common.email}</label>
              <input name="email" type="email" required placeholder="you@example.com" className="auth-input" />
            </div>
            <div className="auth-field">
              <label className="auth-label">{t.common.password} <span style={{ fontWeight: 400, color: 'var(--ink-40)' }}>{t.auth.passwordMinLength}</span></label>
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
              <><span className="gen-spinner" /> {t.auth.creatingAccount}</>
            ) : t.auth.createAccount}
          </button>
        </form>

        <div className="auth-divider">
          <hr /><span>{t.common.or}</span><hr />
        </div>

        <button type="button" onClick={onGuest} disabled={loading} className="auth-btn-ghost">
          {t.auth.continueAsGuest}
        </button>
      </div>
    </main>
  );
}
