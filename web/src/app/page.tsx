import Link from 'next/link';

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
    desc: 'One unified backend powers both the Next.js dashboard and React Native mobile app.',
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
          <div className="nav-right">
            <Link href="/auth/login" className="nav-btn-ghost">Log in</Link>
            <Link href="/auth/signup" className="nav-btn-cta">Start free</Link>
          </div>
        </nav>
      </header>

      {/* ─── HERO ────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg-grid" aria-hidden />
        <div className="hero-bg-orb hero-bg-orb--1" aria-hidden />
        <div className="hero-bg-orb hero-bg-orb--2" aria-hidden />

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

          <div className="hero-actions">
            <Link href="/auth/signup" className="cta-primary">
              Start for free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/dashboard" className="cta-secondary">View dashboard</Link>
          </div>

          <p className="hero-disclaimer">No credit card required · Free plan available</p>
        </div>

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
