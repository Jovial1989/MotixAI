'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { webApi } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const prefillToken = searchParams.get('token') ?? '';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const data            = new FormData(event.currentTarget);
    const resetToken      = String(data.get('resetToken')).trim();
    const newPassword     = String(data.get('newPassword'));
    const confirmPassword = String(data.get('confirmPassword'));

    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await webApi.resetPassword(resetToken, newPassword);
      router.push('/auth/login?reset=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <Link href="/" className="auth-logo">MotixAI</Link>

      <div className="auth-card">
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-sub">
          <Link href="/auth/login">Back to sign in</Link>
        </p>

        <form onSubmit={onSubmit}>
          <div className="auth-fields">
            <div className="auth-field">
              <label className="auth-label">Reset token</label>
              <textarea
                name="resetToken"
                required
                defaultValue={prefillToken}
                placeholder="Paste your reset token here"
                rows={3}
                className="auth-input auth-input--mono"
              />
            </div>
            <div className="auth-field">
              <label className="auth-label">New password</label>
              <input name="newPassword" type="password" required placeholder="••••••••" className="auth-input" />
            </div>
            <div className="auth-field">
              <label className="auth-label">Confirm new password</label>
              <input name="confirmPassword" type="password" required placeholder="••••••••" className="auth-input" />
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
              <><span className="gen-spinner" /> Updating…</>
            ) : 'Update password'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
