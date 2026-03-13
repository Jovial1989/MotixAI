'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard error]', error);
  }, [error]);

  return (
    <div className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 'var(--r-lg)',
          background: 'var(--red-light)', border: '1px solid color-mix(in srgb, var(--red) 20%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="var(--red)" strokeWidth="1.5"/>
            <path d="M12 8v4M12 16v.5" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
          The dashboard encountered an error. This has been logged.
          {error.message && (
            <span style={{ display: 'block', marginTop: 8, fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--red)', textAlign: 'left', background: 'var(--bg-subtle)', padding: '8px 10px', borderRadius: 6, wordBreak: 'break-all' }}>
              {error.message}
            </span>
          )}
          {error.digest && (
            <span style={{ display: 'block', marginTop: 8, fontFamily: 'monospace', fontSize: '0.78rem' }}>
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{
              padding: '10px 20px', borderRadius: 'var(--r-full)',
              background: 'var(--p)', color: '#fff', border: 'none',
              fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              padding: '10px 20px', borderRadius: 'var(--r-full)',
              background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border)',
              fontSize: '0.88rem', fontWeight: 600, textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
