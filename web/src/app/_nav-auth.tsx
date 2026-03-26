'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import { ensureAppSession } from '@/lib/guest-access';
import { clearAuthSession, isActiveAccountSession, readStoredSessionState } from '@/lib/session';

function readAuth(): { valid: boolean; initials: string } {
  try {
    const state = readStoredSessionState();
    if (!isActiveAccountSession(state)) return { valid: false, initials: '' };
    const email = state.email;
    const initials = email ? email[0].toUpperCase() : 'U';
    return { valid: true, initials };
  } catch {
    return { valid: false, initials: '' };
  }
}

export default function NavAuth() {
  const t = useT();
  const router = useRouter();
  const [auth, setAuth] = useState<{ valid: boolean; initials: string }>({ valid: false, initials: '' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAuth(readAuth());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocumentClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, [menuOpen]);

  async function handleStartDemo() {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      await ensureAppSession();
      router.push('/dashboard');
    } finally {
      setDemoLoading(false);
    }
  }

  if (auth.valid) {
    return (
      <div className="nav-right nav-user-menu" ref={menuRef}>
        <button type="button" className="nav-avatar" title="Account menu" onClick={() => setMenuOpen((v) => !v)}>
          {auth.initials}
        </button>
        {menuOpen && (
          <div className="nav-dropdown">
            <Link href="/dashboard" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>{t.navAuth.dashboard}</Link>
              <Link href="/profile" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>{t.navAuth.profile}</Link>
              <Link href="/dashboard" className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>{t.navAuth.settings}</Link>
              <button
                type="button"
                className="nav-dropdown-item nav-dropdown-item--danger"
                onClick={() => {
                  clearAuthSession();
                  window.location.href = '/auth/login';
                }}
              >
              {t.navAuth.logOut}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="nav-right">
      <Link href="/auth/login" className="nav-btn-ghost">{t.navAuth.logIn}</Link>
      <button type="button" className="nav-btn-ghost" onClick={handleStartDemo} disabled={demoLoading}>
        {demoLoading ? t.authModal.guestLoadingText : t.productPage.tryDemo}
      </button>
      <Link href="/auth/signup" className="nav-btn-cta">{t.common.signUp}</Link>
    </div>
  );
}
