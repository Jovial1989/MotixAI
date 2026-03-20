import Link from 'next/link';
import MainNav from '../_main-nav';
import Footer from '../_footer';

const forCards = [
  {
    icon: '🔧',
    label: 'Independent technicians',
    desc: 'Find the right procedure in seconds — no PDF hunting, no forum guessing, no mis-matched specs.',
  },
  {
    icon: '🏭',
    label: 'Fleet workshops',
    desc: 'Standardize repair procedures across your team with consistent, AI-generated step sequences.',
  },
  {
    icon: '🚛',
    label: 'Heavy equipment operators',
    desc: 'Guides for excavators, cranes, and specialist machinery — not just passenger cars.',
  },
  {
    icon: '📋',
    label: 'Service managers',
    desc: 'Cut diagnostic time and reduce training overhead with on-demand reference guides.',
  },
];

const guideOutputs = [
  'Ordered step sequence', 'Torque specifications', 'Required tools list',
  'OEM part references', 'Safety warnings', 'Engineering diagrams',
  'Difficulty rating', 'Time estimate',
];

const differentiators = [
  {
    vs: 'vs PDF manuals',
    title: 'Searchable. Instant. Structured.',
    desc: 'No downloading. No scrolling through 400 pages. Natural language in, structured procedure out.',
  },
  {
    vs: 'vs forum threads',
    title: 'Authoritative, not anecdotal',
    desc: 'Engineered from AI knowledge — not forum opinions that may not match your exact vehicle trim.',
  },
  {
    vs: 'vs generic AI chat',
    title: 'Domain-aware output',
    desc: 'Motixi is built for automotive repair. It understands torque specs, OEM references, and tool requirements.',
  },
];

export default function ProductPage() {
  return (
    <div className="page">
      <MainNav />

      {/* ─── HERO ────────────────────────────────────────── */}
      <section className="inner-hero">
        <div className="inner-hero-content">
          <p className="eyebrow-tag">Product</p>
          <h1 className="inner-hero-h1">AI repair guides.<br />Instant. Structured. Accurate.</h1>
          <p className="inner-hero-sub">
            Type a vehicle model and repair description. Get a complete step-by-step procedure
            — with torque specs, tools, safety warnings, and engineering diagrams — in under 3 seconds.
          </p>
          <div className="cta-band-actions" style={{ marginTop: '2rem' }}>
            <Link href="/auth/signup" className="cta-primary">Start trial</Link>
            <Link href="/contact" className="cta-band-ghost">Talk to founder →</Link>
          </div>
        </div>
      </section>

      {/* ─── APP DEMO ─────────────────────────────────────── */}
      <section className="app-demo-section">
        <div className="app-demo-header">
          <p className="app-demo-eyebrow">Product walkthrough</p>
          <h2 className="app-demo-h2">Search to guide in three steps</h2>
          <p className="app-demo-sub">
            Available on web and mobile — same AI, same accuracy, any device.
          </p>
        </div>

        <div className="app-screens-row">

          {/* Screen 1 — Search */}
          <div className="app-screen-col">
            <div className="phone-frame">
              <div className="phone-notch" />
              <div className="phone-content" style={{ background: '#0F172A' }}>
                <div className="ps-sb">
                  <span>9:41</span>
                  <span>●●●</span>
                </div>
                <div className="ps-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="ps-logo">Motixi</span>
                  <div className="ps-user-dot">K</div>
                </div>
                <p className="ps-title">What do you need to fix?</p>
                <p className="ps-sub">Vehicle model + repair description</p>
                <div className="ps-input">
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><circle cx="4" cy="4" r="3" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/><path d="M6.5 6.5L8 8" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round"/></svg>
                  <span>BMW E90 brake caliper…</span>
                  <div className="ps-input-cursor" />
                </div>
                <p className="ps-recent-label">Recent searches</p>
                <div className="ps-chip">
                  <span>Toyota LC200 turbo service</span>
                  <span className="ps-chip-tag" style={{ background: 'rgba(234,88,12,0.15)', color: '#FB923C' }}>Advanced</span>
                </div>
                <div className="ps-chip">
                  <span>Nissan Qashqai oil change</span>
                  <span className="ps-chip-tag" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80' }}>Beginner</span>
                </div>
                <div className="ps-chip">
                  <span>CAT 320D hydraulic pump</span>
                  <span className="ps-chip-tag" style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D' }}>Intermediate</span>
                </div>
              </div>
            </div>
            <div className="app-screen-cap">
              <p className="app-screen-num">Step 01</p>
              <p className="app-screen-title">Type your query</p>
              <p className="app-screen-desc">Natural language or structured — VIN, model name, part number. No special syntax.</p>
            </div>
          </div>

          {/* Screen 2 — Results */}
          <div className="app-screen-col">
            <div className="phone-frame">
              <div className="phone-notch" />
              <div className="phone-content" style={{ background: '#0F172A' }}>
                <div className="ps-sb">
                  <span>9:41</span>
                  <span>●●●</span>
                </div>
                <div className="ps-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="ps-logo">Motixi</span>
                  <div className="ps-user-dot">K</div>
                </div>
                <p className="ps-title">Results</p>
                <p className="ps-sub" style={{ marginBottom: '8px' }}>BMW E90 — brake caliper</p>
                <div className="pr-card">
                  <p className="pr-card-title">Front Brake Caliper Replacement</p>
                  <div className="pr-card-meta">
                    <span className="pr-chip pr-chip--diff">Intermediate</span>
                    <span className="pr-chip pr-chip--time">75–90 min</span>
                    <span className="pr-chip pr-chip--steps">9 steps</span>
                  </div>
                </div>
                <div className="pr-card">
                  <p className="pr-card-title">Rear Caliper Overhaul</p>
                  <div className="pr-card-meta">
                    <span className="pr-chip pr-chip--diff">Advanced</span>
                    <span className="pr-chip pr-chip--time">120 min</span>
                    <span className="pr-chip pr-chip--steps">12 steps</span>
                  </div>
                </div>
                <div className="pr-card" style={{ opacity: 0.5 }}>
                  <p className="pr-card-title">Caliper Slide Pin Service</p>
                  <div className="pr-card-meta">
                    <span className="pr-chip pr-chip--diff" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80' }}>Beginner</span>
                    <span className="pr-chip pr-chip--time">30 min</span>
                    <span className="pr-chip pr-chip--steps">5 steps</span>
                  </div>
                </div>
                <div className="pr-new-btn">+ Generate new guide</div>
              </div>
            </div>
            <div className="app-screen-cap">
              <p className="app-screen-num">Step 02</p>
              <p className="app-screen-title">Instant match or generate</p>
              <p className="app-screen-desc">Motixi searches the knowledge base first. Matches are instant — new guides in under 3s.</p>
            </div>
          </div>

          {/* Screen 3 — Guide */}
          <div className="app-screen-col">
            <div className="phone-frame">
              <div className="phone-notch" />
              <div className="phone-content" style={{ background: '#0F172A' }}>
                <div className="ps-sb">
                  <span>9:41</span>
                  <span>●●●</span>
                </div>
                <div className="pd-head">
                  <p className="pd-head-vehicle">BMW E90 330d · Front axle</p>
                  <p className="pd-head-title">Brake Caliper Replacement</p>
                  <div className="pd-chips">
                    <span className="pd-chip pd-chip--int">Intermediate</span>
                    <span className="pd-chip pd-chip--time">75–90 min</span>
                    <span className="pd-chip pd-chip--steps">9 steps</span>
                  </div>
                </div>
                <div className="pd-tools">
                  <p className="pd-tools-label">Tools required</p>
                  <div className="pd-tools-row">
                    <span className="pd-tool">Socket set</span>
                    <span className="pd-tool">Torque wrench</span>
                    <span className="pd-tool">Piston tool</span>
                    <span className="pd-tool">Brake fluid</span>
                  </div>
                </div>
                <div className="pd-step">
                  <div className="pd-step-row">
                    <div className="pd-step-num">1</div>
                    <p className="pd-step-name">Secure vehicle &amp; isolate brake</p>
                  </div>
                  <p className="pd-step-text">Apply parking brake. Place wheel chocks front and rear. Loosen wheel bolts while on ground. Torque: 120 Nm.</p>
                </div>
                <div className="pd-step" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="pd-step-row">
                    <div className="pd-step-num" style={{ background: 'rgba(255,255,255,0.15)' }}>2</div>
                    <p className="pd-step-name">Remove wheel &amp; access caliper</p>
                  </div>
                  <p className="pd-step-text">Lift vehicle on jack stands at factory points. Remove wheel bolts. Pull wheel clear.</p>
                </div>
                <div className="pd-prog">
                  <p className="pd-prog-label">Step 1 of 9</p>
                  <div className="pd-prog-track"><div className="pd-prog-fill" /></div>
                </div>
              </div>
            </div>
            <div className="app-screen-cap">
              <p className="app-screen-num">Step 03</p>
              <p className="app-screen-title">Follow step-by-step</p>
              <p className="app-screen-desc">Ordered steps, torque specs, tools, warnings. Diagrams render inline as you work.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── WHO IT'S FOR ─────────────────────────────────── */}
      <section className="pg-section pg-section--alt">
        <div className="pg-wrap">
          <div className="pg-header">
            <p className="eyebrow-tag">Who it&apos;s for</p>
            <h2 className="section-h2">Built for people who fix things</h2>
            <p className="section-sub">From solo technicians to enterprise fleet workshops.</p>
          </div>
          <div className="for-grid-v2">
            {forCards.map((c) => (
              <div key={c.label} className="for-card-v2">
                <div className="for-card-v2-icon">{c.icon}</div>
                <p className="for-card-v2-label">{c.label}</p>
                <p className="for-card-v2-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHAT'S IN A GUIDE ────────────────────────────── */}
      <section className="pg-section">
        <div className="pg-wrap">
          <div className="pg-header">
            <p className="eyebrow-tag">Guide output</p>
            <h2 className="section-h2">Everything a technician needs, structured</h2>
            <p className="section-sub">Every generated guide includes these elements — not stripped-down summaries.</p>
          </div>
          <div className="guide-outputs">
            {guideOutputs.map((item) => (
              <div key={item} className="guide-output-item">
                <div className="guide-output-dot" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DIFFERENTIATORS ─────────────────────────────── */}
      <section className="pg-section pg-section--alt">
        <div className="pg-wrap">
          <div className="pg-header">
            <p className="eyebrow-tag">Why Motixi</p>
            <h2 className="section-h2">Not a chatbot. Not a manual.<br />Something better.</h2>
          </div>
          <div className="diff-grid">
            {differentiators.map((d) => (
              <div key={d.vs} className="diff-card">
                <span className="diff-badge">{d.vs}</span>
                <h3 className="diff-title">{d.title}</h3>
                <p className="diff-desc">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────── */}
      <section className="cta-band">
        <div className="cta-band-orb" aria-hidden />
        <p className="cta-band-eyebrow">Get started today</p>
        <h2 className="cta-band-h2">Generate your first repair guide free.</h2>
        <p className="cta-band-sub">No credit card. No setup. Just results.</p>
        <div className="cta-band-actions">
          <Link href="/auth/signup" className="cta-primary">Start trial</Link>
          <Link href="/auth/login" className="cta-band-ghost">Already have an account →</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
