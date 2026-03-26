'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isPendingActivation, readStoredSessionState } from '@/lib/session';

/**
 * Included in the landing page — if a valid access token is already present
 * in localStorage, silently redirect the user into the correct page.
 * Returning users go to /dashboard; users who haven't finished onboarding
 * go to /onboarding.
 */
export default function AuthRedirect() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('motix_access_token');
    if (!token) return;
    // Decode exp claim without a library
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && Date.now() / 1000 < payload.exp) {
        const session = readStoredSessionState();
        router.replace(isPendingActivation(session) ? '/onboarding' : '/dashboard');
      }
    } catch {
      // malformed token — leave on landing page
    }
  }, [router]);
  return null;
}
