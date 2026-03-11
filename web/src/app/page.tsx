import Link from 'next/link';
import NavAuth from './_nav-auth';
import HeroActions from './_hero-actions';

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L3 7v11h5v-5h4v5h5V7L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Instant guide generation',
    desc: 'VIN or model + part number → full structured repair guide in under 3 seconds.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Step-by-step precision',
    desc: '8–15 ordered steps with torque specs, required tools, and safety warnings built in.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 17h8M10 15v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5 8h10M5 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Engineering diagrams',
    desc: 'AI-generated technical diagrams rendered per step via background image jobs.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Web & mobile',
    desc: 'One unified backend powers both the Next.js dashboard and Flutter mobile app.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Background job queue',
    desc: 'Image generation runs asynchronously with real-time status polling on the client.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM14 13.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Enterprise-ready',
    desc: 'Tenant isolation, custom manual ingestion, role-based access, and admin controls.',
  },
];

const steps = [
  { n: '01', title: 'Enter vehicle info', text: 'Provide VIN or model + part / OEM number.' },
  { n: '02', title: 'Guide is generated', text: 'MotixAI normalises the query and builds a structured repair guide.' },
  { n: '03', title: 'Diagrams rendered', text: 'Engineering-style images are queued and generated per step.' },
  { n: '04', title: 'Follow inline', text: 'Open guide details and follow steps on web or mobile.' },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    desc: 'Get started at no cost.',
    items: ['5 guides / month', 'Standard step output', 'Web access', 'Community support'],
    cta: 'Get started',
    href: '/auth/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$39',
    period: '/mo',
    desc: 'For working technicians.',
    items: ['Unlimited guides', 'Priority image jobs', 'Web + mobile', 'API access', 'Email support'],
    cta: 'Start free trial',
    href: '/auth/signup',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For fleets and workshops.',
    items: ['Tenant isolation', 'Custom manual ingestion', 'Admin dashboard', 'SLA guarantee', 'Dedicated support'],
    cta: 'Contact sales',
    href: 'mailto:hello@motixai.com',
    highlight: false,
  },
];

const stats = [
  { val: '<3s', label: 'Guide generation' },
  { val: '8–15', label: 'Steps per guide' },
  { val: '100%', label: 'AI-generated' },
  { val: '∞', label: 'Vehicle models' },
];

export default function LandingPage() {
  return (
    <div className="page">

      {/* ─── NAV ─────────────────────────────────────────── */}
      <header className="nav-wrap">
        <nav className="nav">
          <Link href="/" className="nav-logo">MotixAI</Link>
          <div className="nav-center">
            <a href="#how" className="nav-link">How it works</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
          </div>
          <NavAuth />
        </nav>
      </header>

      {/* ─── HERO ────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" aria-hidden>
          <div className="hero-bg-grid" />
          <div className="hero-bg-orb hero-bg-orb--1" />
          <div className="hero-bg-orb hero-bg-orb--2" />
        </div>

        <div className="hero-content">
        <div className="hero-inner">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            AI Repair Intelligence
          </div>

          <h1 className="hero-h1">
            Workshop-grade repair guides,
            <br />
            <span className="hero-h1-gradient">generated in seconds.</span>
          </h1>

          <p className="hero-p">
            Enter a VIN or vehicle model. MotixAI returns structured steps,
            torque specs, tool lists, safety notes, and inline engineering diagrams —
            on web and mobile.
          </p>

          <HeroActions />

          <p className="hero-disclaimer">No credit card required · Free plan available</p>
        </div>

        {/* ─── HERO PREVIEW CARD ───────────────────────────────── */}
        <div className="hero-card" aria-hidden="true">
          <div className="hero-card-topbar">
            <span className="topbar-dot topbar-dot--red" />
            <span className="topbar-dot topbar-dot--yellow" />
            <span className="topbar-dot topbar-dot--green" />
            <span className="topbar-title">Repair Guide · 2019 Ford F-150 · Oil Change</span>
          </div>
          <div className="hero-card-body">
            {([
              { done: true,  active: false, n: '✓', title: 'Warm up engine for 2 minutes',      detail: null },
              { done: true,  active: false, n: '✓', title: 'Position drain pan under oil plug',  detail: null },
              { done: false, active: true,  n: '3',  title: 'Remove drain plug — 14mm socket',   detail: '25 Nm torque' },
              { done: false, active: false, n: '4',  title: 'Replace oil filter',                detail: null },
              { done: false, active: false, n: '5',  title: 'Refill with 5W-30 synthetic',       detail: '5.7 L capacity' },
            ] as const).map((s) => (
              <div key={s.n} className={`mock-step${s.done ? ' mock-step--done' : ''}${s.active ? ' mock-step--active' : ''}`}>
                <div className="mock-step-num">{s.n}</div>
                <div>
                  <p className="mock-step-title">{s.title}</p>
                  {s.detail && <p className="mock-step-detail">{s.detail}</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="hero-card-footer">
            <span className="card-footer-badge">3 / 5 steps complete</span>
            <span className="card-footer-diag">Diagrams generating…</span>
          </div>
        </div>

        </div>{/* end .hero-content */}
      </section>

      {/* ─── LOGOS ───────────────────────────────────────── */}
      <div className="logos-bar">
        <p className="logos-label">Trusted by teams at</p>
        {['AutoShop Pro', 'FleetWorks', 'HeavyMech', 'TechGarage', 'MotoServ'].map((name) => (
          <span key={name} className="logos-name">{name}</span>
        ))}
      </div>

      {/* ─── HOW IT WORKS ────────────────────────────────── */}
      <section id="how" className="how-section">
        <div className="section-header">
          <p className="eyebrow-tag">How it works</p>
          <h2 className="section-h2">From query to guide in four steps</h2>
        </div>
        <div className="how-steps">
          {steps.map((s, i) => (
            <div key={s.n} className="how-step">
              <div className="how-step-num">{s.n}</div>
              {i < steps.length - 1 && <div className="how-step-line" />}
              <h3 className="how-step-title">{s.title}</h3>
              <p className="how-step-text">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── STATS ───────────────────────────────────────── */}
      <div className="stats-bar">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <span className="stat-val">{s.val}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ─── FEATURES ────────────────────────────────────── */}
      <section id="features" className="features-section">
        <div className="section-header">
          <p className="eyebrow-tag">Features</p>
          <h2 className="section-h2">Everything a technician needs</h2>
          <p className="section-sub">Built for speed, accuracy, and real-world workshop conditions.</p>
        </div>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feat-card">
              <div className="feat-icon">{f.icon}</div>
              <h3 className="feat-title">{f.title}</h3>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── MOBILE APP ──────────────────────────────────── */}
      <section className="mobile-section">
        <div className="mobile-inner">

          {/* Left: text + CTA */}
          <div className="mobile-text">
            <p className="eyebrow-tag">Mobile App</p>
            <h2 className="section-h2">Workshop guides<br />in your pocket</h2>
            <p className="mobile-sub">
              The same AI-generated repair guides, optimized for mobile.
              Step through procedures at the bench, pinch-to-zoom diagrams,
              and track progress — all offline-capable.
            </p>

            <ul className="mobile-bullets">
              {[
                'Swipe through steps one-handed',
                'Pinch-to-zoom on engineering diagrams',
                'Offline mode for workshop use',
              ].map((b) => (
                <li key={b} className="mobile-bullet">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {b}
                </li>
              ))}
            </ul>

            <a
              href="mailto:hello@motixai.com?subject=Mobile%20App%20Early%20Access"
              className="mobile-cta"
            >
              Request early access
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <p className="mobile-coming">Coming soon to iOS and Android</p>
          </div>

          {/* Right: phone mockup image */}
          <div className="mobile-phones">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mobile-showcase.png"
              alt="MotixAI mobile app — guides list and guide detail screens"
              className="mobile-phones-img"
              width={620}
              height={520}
            />
          </div>

        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────── */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <p className="eyebrow-tag">Pricing</p>
          <h2 className="section-h2">Simple, transparent pricing</h2>
          <p className="section-sub">Start free. Upgrade when you need more.</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={`plan${plan.highlight ? ' plan--pro' : ''}`}>
              {plan.highlight && <div className="plan-popular">Most popular</div>}
              <p className="plan-name">{plan.name}</p>
              <div className="plan-price-row">
                <span className="plan-price">{plan.price}</span>
                {plan.period && <span className="plan-period">{plan.period}</span>}
              </div>
              <p className="plan-desc">{plan.desc}</p>
              <hr className="plan-divider" />
              <ul className="plan-list">
                {plan.items.map((item) => (
                  <li key={item} className="plan-item">
                    <svg className="plan-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={plan.highlight ? 'plan-cta plan-cta--pro' : 'plan-cta plan-cta--default'}>
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* ─── CTA BAND ────────────────────────────────────── */}
      <section className="cta-band">
        <div className="cta-band-orb" aria-hidden />
        <p className="cta-band-eyebrow">Get started today</p>
        <h2 className="cta-band-h2">Generate your first repair guide free.</h2>
        <p className="cta-band-sub">No credit card. No setup. Just results.</p>
        <div className="cta-band-actions">
          <Link href="/auth/signup" className="cta-primary">Start for free</Link>
          <Link href="/auth/login" className="cta-band-ghost">Already have an account →</Link>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <Link href="/" className="nav-logo">MotixAI</Link>
          <p className="footer-copy">© 2026 MotixAI. All rights reserved.</p>
          <div className="footer-links">
            <a href="#" className="footer-link">Privacy</a>
            <a href="#" className="footer-link">Terms</a>
            <a href="mailto:hello@motixai.com" className="footer-link">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
