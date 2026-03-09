'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function readAuth(): { valid: boolean; initials: string } {
  try {
    const token = localStorage.getItem('motix_access_token');
    const refreshToken = localStorage.getItem('motix_refresh_token');
    if (!token && !refreshToken) return { valid: false, initials: '' };

    if (token) {
      // JWT uses Base64URL (RFC 7519) — convert to Base64 before atob()
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(
        Math.ceil(token.split('.')[1].length / 4) * 4, '='
      );
      const payload = JSON.parse(atob(b64)) as { exp?: number; email?: string; sub?: string };
      const email = payload.email ?? payload.sub ?? '';
      const initials = email ? email[0].toUpperCase() : 'U';
      // Access token still valid
      if (payload.exp && Date.now() / 1000 < payload.exp) return { valid: true, initials };
      // Access token expired — show avatar if refresh token exists (session is recoverable)
      if (refreshToken) return { valid: true, initials };
    }

    // Only refresh token present
    if (refreshToken) return { valid: true, initials: 'U' };

    return { valid: false, initials: '' };
  } catch {
    return { valid: false, initials: '' };
  }
}

export default function NavAuth() {
  const [auth, setAuth] = useState<{ valid: boolean; initials: string } | null>(null);

  useEffect(() => { setAuth(readAuth()); }, []);

  // Avoid layout shift while hydrating
  if (auth === null) return <div className="nav-right" style={{ minWidth: 110 }} />;

  if (auth.valid) {
    return (
      <div className="nav-right">
        <Link href="/profile" className="nav-avatar" title="Your profile">
          {auth.initials}
        </Link>
      </div>
    );
  }

  return (
    <div className="nav-right">
      <Link href="/auth/login" className="nav-btn-ghost">Log in</Link>
      <Link href="/auth/signup" className="nav-btn-cta">Start free</Link>
    </div>
  );
}
