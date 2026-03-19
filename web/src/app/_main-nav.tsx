'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavAuth from './_nav-auth';

const NAV_ITEMS = [
  { label: 'How it works', anchor: 'how' },
  { label: 'Features',     anchor: 'features' },
  { label: 'Pricing',      anchor: 'pricing' },
  { label: 'Product',      href: '/product' },
  { label: 'About',        href: '/about' },
  { label: 'Contacts',     href: '/contact' },
] as const;

type NavItem = typeof NAV_ITEMS[number];

function isAnchor(item: NavItem): item is Extract<NavItem, { anchor: string }> {
  return 'anchor' in item;
}

export default function MainNav() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="nav-wrap">
        <nav className="nav">
          <Link href="/" className="nav-logo">Motixi</Link>

          <div className="nav-center">
            {NAV_ITEMS.map((item) => {
              if (isAnchor(item)) {
                const href = isHome ? `#${item.anchor}` : `/#${item.anchor}`;
                return (
                  <a key={item.label} href={href} className="nav-link">
                    {item.label}
                  </a>
                );
              }
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`nav-link${active ? ' nav-link--active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right: desktop auth + mobile hamburger */}
          <div className="nav-auth-wrap">
            <div className="nav-auth-inner">
              <NavAuth />
            </div>
            <button
              className="nav-mobile-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile slide-in menu */}
      {mobileOpen && (
        <div className="nav-mobile-menu" onClick={() => setMobileOpen(false)}>
          <div className="nav-mobile-panel" onClick={e => e.stopPropagation()}>
            <div className="nav-mobile-header">
              <Link href="/" className="nav-logo" onClick={() => setMobileOpen(false)}>
                Motixi
              </Link>
              <button
                className="nav-mobile-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <nav className="nav-mobile-links">
              {NAV_ITEMS.map((item) => {
                if (isAnchor(item)) {
                  const href = isHome ? `#${item.anchor}` : `/#${item.anchor}`;
                  return (
                    <a
                      key={item.label}
                      href={href}
                      className="nav-mobile-link"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="nav-mobile-link"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="nav-mobile-auth">
              <Link
                href="/auth/signup"
                className="nav-mobile-auth-cta"
                onClick={() => setMobileOpen(false)}
              >
                Try for free
              </Link>
              <Link
                href="/auth/login"
                className="nav-mobile-auth-ghost"
                onClick={() => setMobileOpen(false)}
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
