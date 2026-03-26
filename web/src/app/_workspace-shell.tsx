'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/lib/i18n';
import Sidebar, { type DashView } from '@/app/dashboard/_sidebar';

function readSession() {
  if (typeof window === 'undefined') {
    return {
      role: 'USER',
      email: '',
      planType: 'free',
    };
  }

  let role = 'USER';
  let email = '';
  let planType = 'free';

  try {
    const token = localStorage.getItem('motix_access_token');
    if (token) {
      const body = token.split('.')[1];
      if (body) {
        const b64 = body.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(body.length / 4) * 4, '=');
        const payload = JSON.parse(atob(b64)) as { role?: string; email?: string; sub?: string };
        role = payload.role ?? 'USER';
        email = payload.email ?? payload.sub ?? '';
      }
    }
  } catch {
    // Ignore malformed session data and keep stable fallbacks.
  }

  try {
    const stored = localStorage.getItem('motix_user');
    if (stored) {
      const parsed = JSON.parse(stored) as { planType?: string };
      if (parsed.planType) planType = parsed.planType;
    }
  } catch {
    // Ignore invalid cached billing info.
  }

  return { role, email, planType };
}

export function dashboardViewHref(view: DashView): string {
  if (view === 'guides') return '/dashboard';
  return `/dashboard?view=${view}`;
}

interface WorkspaceShellProps {
  view: DashView;
  children: React.ReactNode;
  guideCount?: number;
  jobCount?: number;
  requestCount?: number;
  guidesUsed?: number;
  guidesLimit?: number;
  planType?: string;
  onNavigate?: (view: DashView) => void;
  allowNewGuide?: boolean;
}

export default function WorkspaceShell({
  view,
  children,
  guideCount,
  jobCount,
  requestCount,
  guidesUsed = 0,
  guidesLimit = 5,
  planType,
  onNavigate,
  allowNewGuide = true,
}: WorkspaceShellProps) {
  const router = useRouter();
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useMemo(() => readSession(), []);

  const isGuest = session.role === 'GUEST';
  const isEnterprise = session.role === 'ENTERPRISE_ADMIN';
  const resolvedPlanType = planType ?? session.planType;
  const initials = session.email ? session.email[0].toUpperCase() : 'U';

  function handleNavigate(nextView: DashView) {
    if (onNavigate) {
      onNavigate(nextView);
      return;
    }
    router.push(dashboardViewHref(nextView));
  }

  return (
    <div className="ds-shell">
      <div className="ds-mobile-bar">
        <button className="ds-hamburger" onClick={() => setMobileOpen(true)} aria-label={t.nav.openNavigation}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
        <span className="ds-mobile-logo">Motixi</span>
        {!isGuest && allowNewGuide ? (
          <button className="ds-mobile-new" onClick={() => handleNavigate('new-guide')} aria-label={t.sidebar.newGuide}>+</button>
        ) : (
          <span className="ds-mobile-spacer" aria-hidden="true" />
        )}
      </div>

      <Sidebar
        view={view}
        onView={handleNavigate}
        isEnterprise={isEnterprise}
        isGuest={isGuest}
        initials={initials}
        email={session.email}
        guideCount={guideCount}
        jobCount={jobCount}
        requestCount={requestCount}
        guidesUsed={guidesUsed}
        guidesLimit={guidesLimit}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        planType={resolvedPlanType}
      />

      <main className="ds-main">
        {children}
      </main>
    </div>
  );
}
