'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';

function hasValidToken(): boolean {
  try {
    const token = localStorage.getItem('motix_access_token');
    if (!token) return false;
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(
      Math.ceil(token.split('.')[1].length / 4) * 4, '='
    );
    const payload = JSON.parse(atob(b64)) as { exp?: number };
    return !!(payload.exp && Date.now() / 1000 < payload.exp);
  } catch {
    return false;
  }
}

export default function HeroActions() {
  const t = useT();
  const router = useRouter();

  function handleDashboard() {
    router.push(hasValidToken() ? '/dashboard' : '/auth/login');
  }

  return (
    <div className="hero-actions">
      <Link href="/auth/signup" className="cta-primary">
        {t.heroActions.startForFree}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>
      <button onClick={handleDashboard} className="cta-secondary">
        {t.heroActions.viewDashboard}
      </button>
    </div>
  );
}
