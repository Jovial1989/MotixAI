'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { webApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      const res = await webApi.forgotPassword(String(data.get('email')));
      setResetToken(res.resetToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (resetToken) {
    return (
      <main className="auth-page">
        <Link href="/" className="auth-logo">MotixAI</Link>
        <div className="auth-card">
          <h1 className="auth-title">Token ready</h1>
          <p className="auth-sub">
            In production this would be emailed. Copy and use the token below.
          </p>
          <div className="auth-token-box">{resetToken}</div>
          <p className="auth-token-note">Tap to select all · valid for 15 minutes</p>
          <button
            className="auth-btn-primary"
            onClick={() => router.push(`/auth/reset-password?token=${encodeURIComponent(resetToken)}`)}
          >
            Continue to reset password
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <Link href="/" className="auth-logo">MotixAI</Link>

      <div className="auth-card">
        <h1 className="auth-title">Forgot password?</h1>
        <p className="auth-sub">
          Enter your email and we&apos;ll send a reset token.{' '}
          <Link href="/auth/login">Back to sign in</Link>
        </p>

        <form onSubmit={onSubmit}>
          <div className="auth-fields">
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input name="email" type="email" required placeholder="you@example.com" className="auth-input" />
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
              <><span className="gen-spinner" /> Sending…</>
            ) : 'Send reset token'}
          </button>
        </form>
      </div>
    </main>
  );
}
