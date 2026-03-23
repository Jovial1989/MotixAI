'use client';

import { useT } from '@/lib/i18n';

export type DashView =
  | 'guides'
  | 'new-guide'
  | 'garage'
  | 'jobs'
  | 'requests'
  | 'manuals'
  | 'analytics'
  | 'settings';

interface Props {
  view: DashView;
  onView: (v: DashView) => void;
  isEnterprise: boolean;
  isGuest?: boolean;
  initials: string;
  email: string;
  guideCount: number;
  jobCount?: number;
  requestCount?: number;
  guidesUsed: number;
  guidesLimit: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
  planType?: string;
}

function NavItem({
  icon,
  label,
  active,
  count,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button className={`sb-item${active ? ' sb-item--active' : ''}`} onClick={onClick}>
      <span className="sb-item-icon">{icon}</span>
      <span className="sb-item-label">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="sb-item-badge">{count}</span>
      )}
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="sb-section-label">{children}</p>;
}

export default function Sidebar({
  view, onView, isEnterprise, isGuest, initials, email,
  guideCount, jobCount, requestCount,
  guidesUsed, guidesLimit,
  mobileOpen, onMobileClose, planType = 'free',
}: Props) {
  const t = useT();

  function nav(v: DashView) {
    onView(v);
    onMobileClose();
  }

  const isPremium = planType === 'premium' || isEnterprise;
  const isTrial = planType === 'trial';
  const planLabel = isEnterprise
    ? t.sidebar.enterprise
    : isPremium
    ? t.sidebar.pro
    : isTrial
    ? `${t.sidebar.trial} · ${guidesUsed}/${guidesLimit}`
    : (guidesUsed >= guidesLimit ? `${t.sidebar.free} · ${t.sidebar.limitReached}` : `${t.sidebar.free} · ${guidesUsed}/${guidesLimit}`);
  const planPercent = isPremium ? 100 : Math.min(100, Math.round(guidesUsed / guidesLimit * 100));

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="sb-overlay" onClick={onMobileClose} />}

      <aside className={`sb-root${mobileOpen ? ' sb-root--open' : ''}`}>
        {/* Logo */}
        <div className="sb-logo">
          <div className="sb-logo-mark">M</div>
          <span className="sb-logo-text">Motixi</span>
        </div>

        {isGuest ? (
          /* ── Guest: minimal demo sidebar ── */
          <nav className="sb-nav">
            <NavItem
              icon={<IconGuides />}
              label={t.sidebar.sampleGuides}
              active={view === 'guides'}
              count={guideCount}
              onClick={() => nav('guides')}
            />
            <div style={{ flex: 1 }} />
            <a href="/auth/signup" className="sb-new-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
              {t.sidebar.createFreeAccount}
            </a>
          </nav>
        ) : (
          /* ── Authenticated sidebar ── */
          <nav className="sb-nav">
            <NavItem
              icon={<IconGuides />}
              label={t.common.guides}
              active={view === 'guides'}
              count={guideCount}
              onClick={() => nav('guides')}
            />
            <NavItem
              icon={<IconGarage />}
              label={t.common.vehicles}
              active={view === 'garage'}
              onClick={() => nav('garage')}
            />
            <button className="sb-new-btn" onClick={() => nav('new-guide')}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {t.sidebar.newGuide}
            </button>

            {isEnterprise && (
              <>
                <SectionLabel>{t.sidebar.workshop}</SectionLabel>
                <NavItem
                  icon={<IconJobs />}
                  label={t.sidebar.jobs}
                  active={view === 'jobs'}
                  count={jobCount}
                  onClick={() => nav('jobs')}
                />
                <NavItem
                  icon={<IconRequests />}
                  label={t.sidebar.requests}
                  active={view === 'requests'}
                  count={requestCount}
                  onClick={() => nav('requests')}
                />
                <NavItem
                  icon={<IconAnalytics />}
                  label={t.sidebar.analytics}
                  active={view === 'analytics'}
                  onClick={() => nav('analytics')}
                />
              </>
            )}

            <SectionLabel>{t.sidebar.account}</SectionLabel>
            <NavItem
              icon={<IconSettings />}
              label={t.sidebar.settings}
              active={view === 'settings'}
              onClick={() => nav('settings')}
            />
          </nav>
        )}

        {/* Footer */}
        <div className="sb-footer">
          {!isGuest && (
            <>
              <button className="sb-user" onClick={() => nav('settings')}>
                <div className="sb-avatar">{initials}</div>
                <div className="sb-user-info">
                  <span className="sb-user-email">{email}</span>
                  <span className="sb-user-plan">{planLabel}</span>
                </div>
              </button>

              {!isEnterprise && (
                <div className="sb-usage">
                  <div className="sb-usage-bar">
                    <div
                      className={`sb-usage-fill${guidesUsed >= guidesLimit ? ' sb-usage-fill--full' : ''}`}
                      style={{ width: `${planPercent}%` }}
                    />
                  </div>
                  {guidesUsed >= guidesLimit && (
                    <p className="sb-upgrade-hint">
                      {t.sidebar.limitReached} —{' '}
                      <button className="sb-upgrade-link" onClick={() => nav('settings')}>{t.sidebar.upgrade}</button>
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <button
            className="sb-logout"
            onClick={() => {
              localStorage.removeItem('motix_access_token');
              localStorage.removeItem('motix_refresh_token');
              location.href = isGuest ? '/' : '/auth/login';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isGuest ? t.sidebar.exitDemo : t.sidebar.logOut}
          </button>
        </div>
      </aside>
    </>
  );
}

// ── SVG icons ─────────────────────────────────────────────────────────────────

function IconGuides() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function IconGarage() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 10l2-5h8l2 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <rect x="1" y="10" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="4.5" cy="14" r="1" fill="currentColor"/>
      <circle cx="11.5" cy="14" r="1" fill="currentColor"/>
    </svg>
  );
}
function IconJobs() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M13 4l-3 3M3 13l3-3M8 8l3-3-1-3-3 1-3 3 3 3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}
function IconRequests() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 3V1M5 6h6M5 9h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function IconManuals() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M6 5h4M6 8h4M6 11h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function IconAnalytics() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 13h12M4 13V8M8 13V5M12 13V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
