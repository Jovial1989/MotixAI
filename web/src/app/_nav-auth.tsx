'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n';

function readAuth(): { valid: boolean; initials: string } {
  try {
    const token = localStorage.getItem('motix_access_token');
    if (!token) return { valid: false, initials: '' };

    const body = token.split('.')[1];
    if (!body) return { valid: false, initials: '' };
    const b64 = body.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      Math.ceil(body.length / 4) * 4, '='
    );
    const payload = JSON.parse(atob(b64)) as { exp?: number; email?: string; sub?: string };
    if (!payload.exp || Date.now() / 1000 >= payload.exp) return { valid: false, initials: '' };
    const email = payload.email ?? payload.sub ?? '';
    const initials = email ? email[0].toUpperCase() : 'U';
    return { valid: true, initials };
  } catch {
    return { valid: false, initials: '' };
  }
}

export default function NavAuth() {
  const t = useT();
  const [auth, setAuth] = useState<{ valid: boolean; initials: string }>({ valid: false, initials: '' });
  const [menuOpen, setMenuOpen] = useState(false);
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
                localStorage.removeItem('motix_access_token');
                localStorage.removeItem('motix_refresh_token');
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
      <Link href="/auth/signup" className="nav-btn-cta">{t.navAuth.startTrial}</Link>
    </div>
  );
}
