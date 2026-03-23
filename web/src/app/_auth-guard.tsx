'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Client-side auth guard. Wraps protected pages.
 * Checks localStorage for a valid (non-expired) JWT.
 * If missing or expired → hard redirect to /auth/login.
 * Renders nothing until auth is confirmed → prevents UI flash.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('motix_access_token');
      if (!token) {
        router.replace('/auth/login');
        return;
      }
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && Date.now() / 1000 >= payload.exp) {
        // Token expired — try refresh
        const refreshToken = localStorage.getItem('motix_refresh_token');
        if (!refreshToken) {
          localStorage.removeItem('motix_access_token');
          router.replace('/auth/login');
          return;
        }
        // Let the page load — the API proxy will handle refresh on first call.
        // If refresh fails, api.ts redirects to login.
        setAuthed(true);
        return;
      }
      setAuthed(true);
    } catch {
      localStorage.removeItem('motix_access_token');
      router.replace('/auth/login');
    }
  }, [router]);

  if (!authed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="gen-spinner gen-spinner--lg" />
      </div>
    );
  }

  return <>{children}</>;
}
