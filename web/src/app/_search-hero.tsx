'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { env } from '@/lib/env';
import { useT } from '@/lib/i18n';

const EXAMPLE_QUERIES = [
  'bmw e90 oil filter',
  'cat 320d hydraulic pump',
  'ford f150 brake pads',
  'toyota timing belt',
];

const POPULAR_REPAIRS = [
  { query: 'BMW E90 oil change',          count: 2841, icon: '🔧' },
  { query: 'Ford F-150 brake pads',       count: 1923, icon: '🛑' },
  { query: 'Toyota timing belt',          count: 1654, icon: '⚙️' },
  { query: 'CAT 320D hydraulic pump',     count: 1203, icon: '🏗️' },
  { query: 'Nissan Qashqai turbocharger', count: 987,  icon: '💨' },
  { query: 'VW gearbox oil change',       count: 876,  icon: '🔩' },
];

const STORAGE_KEY = 'motix_recent_searches';
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}
function saveRecent(q: string) {
  try {
    const list = getRecent().filter(s => s !== q);
    list.unshift(q);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 5)));
  } catch { /* ignore */ }
}

function isAuthenticated(): boolean {
  try {
    const token = localStorage.getItem('motix_access_token');
    if (!token) return false;
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp && Date.now() / 1000 < payload.exp;
  } catch { return false; }
}

export default function SearchHero() {
  const router = useRouter();
  const t = useT();
  const [query, setQuery]   = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [authModal, setAuthModal] = useState<string | null>(null); // pending query
  const [guestLoading, setGuestLoading] = useState(false);

  useEffect(() => { setRecent(getRecent()); }, []);

  function handleSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    if (isAuthenticated()) {
      saveRecent(trimmed);
      setRecent(getRecent());
      router.push(`/dashboard?q=${encodeURIComponent(trimmed)}`);
    } else {
      setAuthModal(trimmed);
    }
  }

  async function continueAsGuest() {
    if (!authModal) return;
    setGuestLoading(true);
    try {
      const res = await fetch(`${env.apiUrl}/auth/guest`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        const data = await res.json() as { accessToken: string };
        localStorage.setItem('motix_access_token', data.accessToken);
        // Guest enters predefined demo mode — no query forwarding
        router.push('/dashboard');
      }
    } catch { /* ignore */ } finally {
      setGuestLoading(false);
      setAuthModal(null);
    }
  }

  return (
    <>
      {/* ── Auth modal ── */}
      {authModal !== null && (
        <div className="auth-modal-overlay" onClick={() => setAuthModal(null)}>
          <div className="auth-modal" onClick={e => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setAuthModal(null)} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            <div className="auth-modal-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="9" r="4.5" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M5 24c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="auth-modal-title">{t.authModal.title}</h2>
            <p className="auth-modal-sub">{t.authModal.sub}</p>
            <div className="auth-modal-actions">
              <Link
                href={`/auth/signup?q=${encodeURIComponent(authModal)}`}
                className="auth-modal-btn auth-modal-btn--primary"
                onClick={() => setAuthModal(null)}
              >
                {t.authModal.createAccount}
              </Link>
              <Link
                href={`/auth/login?q=${encodeURIComponent(authModal)}`}
                className="auth-modal-btn auth-modal-btn--ghost"
                onClick={() => setAuthModal(null)}
              >
                {t.authModal.signIn}
              </Link>
              <button
                className="auth-modal-btn auth-modal-btn--guest"
                onClick={continueAsGuest}
                disabled={guestLoading}
              >
                {guestLoading ? t.authModal.guestLoadingText : t.authModal.continueAsGuest}
              </button>
            </div>
            <p className="auth-modal-note">{t.authModal.guestNote}</p>
          </div>
        </div>
      )}

      <div className="sh-root">

        {/* ── Two-column hero ── */}
        <div className="sh-cols">

          {/* ── Left: copy + search ── */}
          <div className="sh-left">
            <div className="hero-eyebrow">
              <span className="eyebrow-dot" />
              {t.landing.heroEyebrow}
            </div>

            <h1 className="sh-h1">
              {t.landing.heroTitle}<br />
              <span className="sh-h1-grad">{t.landing.heroTitleGrad}</span>
            </h1>

            <p className="sh-sub">
              {t.landing.heroSub}
            </p>

            <div className="sh-input-wrap">
              <svg className="sh-input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.7"/>
                <path d="M14.5 14.5L18 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
              <input
                className="sh-input"
                placeholder={t.landing.searchPlaceholder}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
                autoComplete="off"
              />
              <button className="sh-btn" onClick={() => handleSearch(query)}>
                {t.common.search}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="sh-chips">
              <span className="sh-chips-label">{t.landing.tryLabel}</span>
              {EXAMPLE_QUERIES.map(q => (
                <button key={q} className="sh-chip" onClick={() => handleSearch(q)}>{q}</button>
              ))}
            </div>

            {recent.length > 0 && (
              <div className="sh-recent">
                <span className="sh-recent-label">{t.landing.recentLabel}</span>
                {recent.map(q => (
                  <button key={q} className="sh-recent-item" onClick={() => handleSearch(q)}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1"/>
                      <path d="M5 3v2.2l1.4.9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: manual intelligence visual ── */}
          <div className="sh-right" aria-hidden="true">
            <div className="sh-manual">

              {/* ── Source / manual badge ── */}
              <div className="sh-man-source">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <rect x="1" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                  <path d="M3 3.5h5M3 5.5h5M3 7.5h3" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
                </svg>
                {t.landing.demoSourceLabel}
                <span className="sh-man-verified">
                  <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                    <path d="M1.5 3.5l1.5 1.5 2.5-2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {t.landing.demoOemVerified}
                </span>
              </div>

              {/* ── Main schematic card ── */}
              <div className="sh-man-card sh-man-card--main">
                <div className="sh-man-card-hd">
                  <div className="sh-man-card-hd-icon">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <rect x="1" y="1" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.1"/>
                      <path d="M4 4h5M4 6.5h5M4 9h3" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="sh-man-card-hd-text">
                    <p className="sh-man-vehicle">{t.landing.demoVehicle1}</p>
                    <p className="sh-man-title">{t.landing.demoTitle1}</p>
                  </div>
                  <span className="sh-man-view-badge">{t.landing.demoViewBadge}</span>
                </div>

                {/* Technical schematic diagram */}
                <div className="sh-man-diagram">
                  <svg viewBox="0 0 280 158" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
                    <defs>
                      <pattern id="mgrid" width="14" height="14" patternUnits="userSpaceOnUse">
                        <path d="M 14 0 L 0 0 0 14" fill="none" stroke="#e2e8f0" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="280" height="158" fill="#f8fafc"/>
                    <rect width="280" height="158" fill="url(#mgrid)"/>
                    <rect x="44" y="22" width="172" height="20" rx="2.5" fill="#f1f5f9" stroke="#475569" strokeWidth="1.3"/>
                    <rect x="44" y="116" width="172" height="20" rx="2.5" fill="#f1f5f9" stroke="#475569" strokeWidth="1.3"/>
                    <rect x="44" y="22" width="20" height="114" rx="2.5" fill="#f1f5f9" stroke="#475569" strokeWidth="1.3"/>
                    <rect x="64" y="40" width="72" height="78" rx="2" fill="none" stroke="#64748b" strokeWidth="1"/>
                    <rect x="64" y="40" width="58" height="78" rx="2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.9"/>
                    <line x1="110" y1="40" x2="110" y2="118" stroke="#cbd5e1" strokeWidth="0.7" strokeDasharray="3,2"/>
                    <rect x="120" y="48" width="8" height="62" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8"/>
                    <rect x="130" y="40" width="20" height="78" rx="1.5" fill="rgba(234,88,12,0.12)" stroke="#EA580C" strokeWidth="1.3"/>
                    <rect x="130" y="40" width="9" height="78" rx="1" fill="rgba(234,88,12,0.22)" stroke="none"/>
                    <rect x="153" y="30" width="30" height="98" rx="1.5" fill="none" stroke="#94a3b8" strokeWidth="1.1" strokeDasharray="5,3"/>
                    <line x1="163" y1="30" x2="163" y2="128" stroke="#cbd5e1" strokeWidth="0.7"/>
                    <line x1="170" y1="30" x2="170" y2="128" stroke="#cbd5e1" strokeWidth="0.7"/>
                    <line x1="177" y1="30" x2="177" y2="128" stroke="#cbd5e1" strokeWidth="0.7"/>
                    <rect x="186" y="40" width="20" height="78" rx="1.5" fill="rgba(234,88,12,0.12)" stroke="#EA580C" strokeWidth="1.3"/>
                    <rect x="196" y="40" width="10" height="78" rx="1" fill="rgba(234,88,12,0.22)" stroke="none"/>
                    <circle cx="168" cy="22" r="6" fill="none" stroke="#475569" strokeWidth="1.1"/>
                    <line x1="168" y1="12" x2="168" y2="22" stroke="#475569" strokeWidth="1.1"/>
                    <text x="168" y="8" textAnchor="middle" fontSize="5" fill="#94a3b8" fontFamily="monospace" letterSpacing="0.3">BLEED</text>
                    <circle cx="72" cy="145" r="5" fill="none" stroke="#475569" strokeWidth="1"/>
                    <circle cx="185" cy="145" r="5" fill="none" stroke="#475569" strokeWidth="1"/>
                    <line x1="72" y1="136" x2="72" y2="145" stroke="#475569" strokeWidth="0.9"/>
                    <line x1="185" y1="136" x2="185" y2="145" stroke="#475569" strokeWidth="0.9"/>
                    <circle cx="80" cy="79" r="9" fill="#EA580C"/>
                    <text x="80" y="83" textAnchor="middle" fontSize="8.5" fill="white" fontFamily="monospace" fontWeight="700">1</text>
                    <circle cx="140" cy="56" r="9" fill="#EA580C"/>
                    <text x="140" y="60" textAnchor="middle" fontSize="8.5" fill="white" fontFamily="monospace" fontWeight="700">2</text>
                    <circle cx="168" cy="100" r="8.5" fill="white" stroke="#EA580C" strokeWidth="1.3"/>
                    <text x="168" y="104" textAnchor="middle" fontSize="8" fill="#EA580C" fontFamily="monospace" fontWeight="700">3</text>
                    <line x1="64" y1="10" x2="130" y2="10" stroke="#94a3b8" strokeWidth="0.7"/>
                    <line x1="64" y1="7" x2="64" y2="13" stroke="#94a3b8" strokeWidth="0.7"/>
                    <line x1="130" y1="7" x2="130" y2="13" stroke="#94a3b8" strokeWidth="0.7"/>
                    <text x="97" y="7.5" textAnchor="middle" fontSize="4.5" fill="#94a3b8" fontFamily="monospace">PISTON BORE Ø54mm</text>
                    <path d="M210 79 C218 72 224 72 224 79 C224 86 218 86 210 79" stroke="#EA580C" fill="none" strokeWidth="0.9" strokeDasharray="2,1"/>
                    <polygon points="208,76 208,82 212,79" fill="#EA580C" opacity="0.7"/>
                    <text x="228" y="77" fontSize="5" fill="#EA580C" fontFamily="monospace" fontWeight="600">35 Nm</text>
                    <text x="274" y="155" textAnchor="end" fontSize="4" fill="#cbd5e1" fontFamily="monospace">OEM REF · NOT TO SCALE</text>
                  </svg>
                </div>

                {/* Meta chip row */}
                <div className="sh-man-chips">
                  <span className="sh-man-chip">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="0.9"/><path d="M4.5 2.5v2l1.2 1" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/></svg>
                    {t.landing.demoTime1}
                  </span>
                  <span className="sh-man-chip">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 7.5L3.5 6M5 1.5l2.5 2.5-2 2L3 3.5 5 1.5ZM3.5 6L2.5 7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t.landing.demoTools1}
                  </span>
                  <span className="sh-man-chip sh-man-chip--steps">{t.landing.demoSteps1}</span>
                  <span className="sh-man-chip sh-man-chip--safety">{t.landing.demoSafety1}</span>
                </div>
              </div>

              {/* ── Procedure card ── */}
              <div className="sh-man-card sh-man-card--proc">
                <div className="sh-man-proc-hd">
                  <span className="sh-man-proc-title">{t.landing.demoProcTitle}</span>
                  <span className="sh-man-proc-step">{t.landing.demoProcStep}</span>
                </div>
                <div className="sh-man-proc-vehicle">{t.landing.demoProcVehicle}</div>
                <div className="sh-man-steps">
                  <div className="sh-man-step sh-man-step--done">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4.5" fill="#22c55e"/><path d="M3 5l1.5 1.5 2.5-2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t.landing.demoStep1}
                  </div>
                  <div className="sh-man-step sh-man-step--done">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4.5" fill="#22c55e"/><path d="M3 5l1.5 1.5 2.5-2.5" stroke="white" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t.landing.demoStep2}
                  </div>
                  <div className="sh-man-step sh-man-step--active">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4.5" fill="#EA580C"/><circle cx="5" cy="5" r="2" fill="white"/></svg>
                    {t.landing.demoStep3}
                  </div>
                  <div className="sh-man-step sh-man-step--pending">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#d1d5db" strokeWidth="1"/></svg>
                    {t.landing.demoStep4}
                  </div>
                  <div className="sh-man-step sh-man-step--pending">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#d1d5db" strokeWidth="1"/></svg>
                    {t.landing.demoStep5}
                  </div>
                </div>
                <div className="sh-man-proc-footer">
                  <span className="sh-man-proc-badge sh-man-proc-badge--ai">{t.landing.demoAiOrganized}</span>
                  <span className="sh-man-proc-badge">{t.landing.demoTime2}</span>
                </div>
              </div>

              {/* ── Floating detail tags ── */}
              <div className="sh-man-tag sh-man-tag--torque">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 7.5L3.5 6M5 1.5l2.5 2.5-2 2L3 3.5 5 1.5ZM3.5 6L2.5 7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {t.landing.demoTorqueTag}
              </div>
              <div className="sh-man-tag sh-man-tag--verified">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 4.5l2 2 3-3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {t.landing.demoVerifiedTag}
              </div>

              {/* Soft ambient glow */}
              <div className="sh-man-glow" />
            </div>
          </div>

        </div>

        {/* ── Popular repairs (full width below) ── */}
        <div className="sh-popular">
          <p className="sh-popular-hd">{t.landing.popularRepairs}</p>
          <div className="sh-popular-grid">
            {POPULAR_REPAIRS.map(r => (
              <button key={r.query} className="sh-popular-item" onClick={() => handleSearch(r.query)}>
                <span className="sh-popular-icon">{r.icon}</span>
                <span className="sh-popular-name">{r.query}</span>
                <span className="sh-popular-count">{r.count.toLocaleString()} {t.landing.guidesCount}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
