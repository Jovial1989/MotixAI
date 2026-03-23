'use client';

import Link from 'next/link';
import MainNav from './_main-nav';
import Footer from './_footer';
import SearchHero from './_search-hero';
import { useT } from '@/lib/i18n';

export default function LandingPage() {
  const t = useT();

  const features = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L3 7v11h5v-5h4v5h5V7L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      ),
      title: t.landing.feat1title,
      desc: t.landing.feat1desc,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      title: t.landing.feat2title,
      desc: t.landing.feat2desc,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="3" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 17h8M10 15v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M5 8h10M5 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      title: t.landing.feat3title,
      desc: t.landing.feat3desc,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      title: t.landing.feat4title,
      desc: t.landing.feat4desc,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
      title: t.landing.feat5title,
      desc: t.landing.feat5desc,
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM14 13.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      ),
      title: t.landing.feat6title,
      desc: t.landing.feat6desc,
    },
  ];

  const steps = [
    { n: '01', title: t.landing.step01title, text: t.landing.step01text },
    { n: '02', title: t.landing.step02title, text: t.landing.step02text },
    { n: '03', title: t.landing.step03title, text: t.landing.step03text },
    { n: '04', title: t.landing.step04title, text: t.landing.step04text },
  ];

  const plans = [
    {
      name: t.landing.planFreeName,
      price: '$0',
      period: '',
      desc: t.landing.planFreeDesc,
      items: [t.landing.planFreeItem1, t.landing.planFreeItem2, t.landing.planFreeItem3, t.landing.planFreeItem4],
      cta: t.landing.planFreeGetStarted,
      href: '/auth/signup',
      highlight: false,
    },
    {
      name: t.landing.planProName,
      price: '$39',
      period: t.landing.planPerMonth,
      desc: t.landing.planProDesc,
      items: [t.landing.planProItem1, t.landing.planProItem2, t.landing.planProItem3, t.landing.planProItem4, t.landing.planProItem5],
      cta: t.landing.planProStartTrial,
      href: '/auth/signup',
      highlight: true,
    },
    {
      name: t.landing.planEntName,
      price: t.landing.planCustom,
      period: '',
      desc: t.landing.planEntDesc,
      items: [t.landing.planEntItem1, t.landing.planEntItem2, t.landing.planEntItem3, t.landing.planEntItem4, t.landing.planEntItem5],
      cta: t.landing.planEntContactUs,
      href: '/contact',
      highlight: false,
    },
  ];

  const stats = [
    { val: '<3s', label: t.landing.statGeneration },
    { val: '8–15', label: t.landing.statSteps },
    { val: '100%', label: t.landing.statAiGenerated },
    { val: '∞', label: t.landing.statVehicleModels },
  ];

  return (
    <div className="page">

      {/* ─── NAV ─────────────────────────────────────────── */}
      <MainNav />

      {/* ─── HERO ────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" aria-hidden>
          <div className="hero-bg-grid" />
          <div className="hero-bg-orb hero-bg-orb--1" />
          <div className="hero-bg-orb hero-bg-orb--2" />
          <div className="hero-bg-orb hero-bg-orb--3" />
        </div>
        <SearchHero />
      </section>

      {/* ─── LOGOS ───────────────────────────────────────── */}
      <div className="logos-bar">
        <p className="logos-label">{t.landing.trustedBy}</p>
        {['AutoShop Pro', 'FleetWorks', 'HeavyMech', 'TechGarage', 'MotoServ'].map((name) => (
          <span key={name} className="logos-name">{name}</span>
        ))}
      </div>

      {/* ─── HOW IT WORKS ────────────────────────────────── */}
      <section id="how" className="how-section">
        <div className="section-header">
          <p className="eyebrow-tag">{t.landing.howEyebrow}</p>
          <h2 className="section-h2">{t.landing.howTitle}</h2>
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
          <p className="eyebrow-tag">{t.landing.featuresEyebrow}</p>
          <h2 className="section-h2">{t.landing.featuresTitle}</h2>
          <p className="section-sub">{t.landing.featuresSub}</p>
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
            <p className="eyebrow-tag">{t.landing.mobileEyebrow}</p>
            <h2 className="section-h2">{t.landing.mobileTitle}</h2>
            <p className="mobile-sub">
              {t.landing.mobileSub}
            </p>

            <ul className="mobile-bullets">
              {[
                t.landing.mobileBullet1,
                t.landing.mobileBullet2,
                t.landing.mobileBullet3,
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
              {t.landing.mobileEarlyAccess}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <p className="mobile-coming">{t.landing.mobileComingSoon}</p>
          </div>

          {/* Right: premium dark phone mockups */}
          <div className="mobile-phones" aria-hidden="true">

            {/* ── Back phone: Guide List ── */}
            <div className="phone phone--back">
              <div className="phone-di" />
              <div className="phone-screen">

                {/* Status bar */}
                <div className="mp-sb">
                  <span className="mp-sb-time">9:41</span>
                  <div className="mp-sb-right">
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><rect x="0" y="3" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.35"/><rect x="3" y="2" width="2" height="6" rx="0.5" fill="currentColor" opacity="0.55"/><rect x="6" y="1" width="2" height="7" rx="0.5" fill="currentColor" opacity="0.75"/><rect x="9" y="0" width="2" height="8" rx="0.5" fill="currentColor"/></svg>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M6 1.5C7.93 1.5 9.66 2.28 10.9 3.52L12 2.42C10.47 0.92 8.34 0 6 0C3.66 0 1.53 0.92 0 2.42L1.1 3.52C2.34 2.28 4.07 1.5 6 1.5Z" fill="currentColor" opacity="0.35"/><path d="M6 4C7.1 4 8.1 4.45 8.83 5.17L9.93 4.07C8.9 3.04 7.52 2.4 6 2.4C4.48 2.4 3.1 3.04 2.07 4.07L3.17 5.17C3.9 4.45 4.9 4 6 4Z" fill="currentColor" opacity="0.65"/><circle cx="6" cy="7" r="1" fill="currentColor"/></svg>
                    <div className="mp-battery"><div className="mp-battery-fill" /></div>
                  </div>
                </div>

                {/* Header */}
                <div className="mp-list-header">
                  <div>
                    <p className="mp-list-eyebrow">{t.landing.phoneMyWorkspace}</p>
                    <p className="mp-list-title">{t.landing.phoneGuides}</p>
                    <p className="mp-list-count">{t.landing.phoneGuidesCount}</p>
                  </div>
                  <div className="mp-avatar">K</div>
                </div>

                {/* Search bar */}
                <div className="mp-search">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7.5 7.5L9.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <span>{t.landing.phoneSearchGuides}</span>
                </div>

                {/* Section label */}
                <p className="mp-list-section">{t.landing.phoneRecent}</p>

                {/* Guide cards */}
                {[
                  { title: 'Brake Caliper Replacement', vehicle: 'Nissan Qashqai 2020', time: '90–120 min', diff: 'Intermediate', steps: '8',  diffColor: '#F59E0B' },
                  { title: 'Turbocharger Service',      vehicle: 'Toyota LC 200',        time: '110 min',    diff: 'Advanced',     steps: '10', diffColor: '#EA580C' },
                  { title: 'Oil Change',                vehicle: 'BMW E90 330d',          time: '45 min',     diff: 'Beginner',     steps: '5',  diffColor: '#22C55E' },
                ].map((g) => (
                  <div key={g.title} className="mp-card">
                    <div className="mp-card-accent" style={{ background: g.diffColor }} />
                    <div className="mp-card-icon" style={{ background: g.diffColor + '18', borderColor: g.diffColor + '30', color: g.diffColor }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="1" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 4h4M4 6.5h4M4 9h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    </div>
                    <div className="mp-card-body">
                      <p className="mp-card-title">{g.title}</p>
                      <p className="mp-card-vehicle">{g.vehicle}</p>
                      <div className="mp-card-meta">
                        <span className="mp-card-chip">
                          <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><circle cx="3.5" cy="3.5" r="3" stroke="currentColor" strokeWidth="0.9"/><path d="M3.5 2v1.5l1 0.8" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/></svg>
                          {g.time}
                        </span>
                        <span className="mp-card-diff" style={{ color: g.diffColor, borderColor: g.diffColor + '45', background: g.diffColor + '16' }}>{g.diff}</span>
                      </div>
                    </div>
                    <div className="mp-card-right">
                      <div className="mp-card-steps-badge" style={{ background: g.diffColor + '18', borderColor: g.diffColor + '35', color: g.diffColor }}>
                        <span className="mp-card-steps-num">{g.steps}</span>
                        <span className="mp-card-steps-lbl">{t.common.steps}</span>
                      </div>
                      <svg width="7" height="7" viewBox="0 0 7 7" fill="none" style={{ marginTop: 5, color: '#404050' }}><path d="M1.5 1.5l4 2-4 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                ))}

                {/* Tab bar */}
                <div className="mp-tabbar">
                  <button className="mp-tab-item mp-tab-item--active">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L2 5.5V12.5H5.5V9H8.5V12.5H12V5.5L7 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                    <span>{t.landing.phoneGuides}</span>
                    <div className="mp-tab-dot" />
                  </button>
                  <button className="mp-tab-item">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 8l1.5-4h5L11 8" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><rect x="2" y="8" width="10" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><circle cx="5" cy="12.5" r="1" fill="currentColor"/><circle cx="9" cy="12.5" r="1" fill="currentColor"/></svg>
                    <span>{t.landing.phoneGarage}</span>
                  </button>
                  <button className="mp-tab-item">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 12.5c0-2.49 2.01-4.5 4.5-4.5s4.5 2.01 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    <span>{t.landing.phoneProfile}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Front phone: Guide Detail ── */}
            <div className="phone phone--front">
              <div className="phone-di" />
              <div className="phone-screen mp-screen--detail">

                {/* Status bar */}
                <div className="mp-sb">
                  <span className="mp-sb-time">9:41</span>
                  <div className="mp-sb-right">
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><rect x="0" y="3" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.35"/><rect x="3" y="2" width="2" height="6" rx="0.5" fill="currentColor" opacity="0.55"/><rect x="6" y="1" width="2" height="7" rx="0.5" fill="currentColor" opacity="0.75"/><rect x="9" y="0" width="2" height="8" rx="0.5" fill="currentColor"/></svg>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M6 1.5C7.93 1.5 9.66 2.28 10.9 3.52L12 2.42C10.47 0.92 8.34 0 6 0C3.66 0 1.53 0.92 0 2.42L1.1 3.52C2.34 2.28 4.07 1.5 6 1.5Z" fill="currentColor" opacity="0.35"/><path d="M6 4C7.1 4 8.1 4.45 8.83 5.17L9.93 4.07C8.9 3.04 7.52 2.4 6 2.4C4.48 2.4 3.1 3.04 2.07 4.07L3.17 5.17C3.9 4.45 4.9 4 6 4Z" fill="currentColor" opacity="0.65"/><circle cx="6" cy="7" r="1" fill="currentColor"/></svg>
                    <div className="mp-battery"><div className="mp-battery-fill" /></div>
                  </div>
                </div>

                {/* Top nav */}
                <div className="mp-detail-nav">
                  <button className="mp-back">
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M6.5 1L1.5 6l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {t.landing.phoneBack}
                  </button>
                  <div className="mp-motix-logo">
                    <div className="mp-motix-mark">M</div>
                    <span>Motixi</span>
                  </div>
                  <div style={{ width: 40 }} />
                </div>

                {/* Guide header */}
                <div className="mp-detail-head">
                  <p className="mp-detail-vehicle">CAT 320D Excavator</p>
                  <p className="mp-detail-title"><span className="mp-hl">Hydraulic</span> Pump Replacement</p>
                  <div className="mp-detail-chips">
                    <span className="mp-dc mp-dc--time">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="3.2" stroke="currentColor" strokeWidth="0.9"/><path d="M4 2.2V4l1.2 1" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round"/></svg>
                      90–120 min
                    </span>
                    <span className="mp-dc mp-dc--diff">
                      <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M3.5 1L1 3v2.5L3.5 7 6 5.5V3L3.5 1Z" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round"/></svg>
                      Intermediate
                    </span>
                    <span className="mp-dc mp-dc--steps">10 {t.common.steps}</span>
                  </div>
                </div>

                <div className="mp-detail-scroll">
                  {/* Tools */}
                  <div className="mp-section">
                    <p className="mp-section-hd">
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 8L3.5 5.5M5.5 1l2.5 2.5-2 2-2.5-2.5L5.5 1ZM3.5 5.5L2.5 6.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {t.landing.phoneToolsRequired}
                    </p>
                    <div className="mp-tools">
                      {['Socket set', 'Torque wrench', 'Trim tools', 'Thread locker'].map((tool) => (
                        <span key={tool} className="mp-tool">{tool}</span>
                      ))}
                    </div>
                  </div>

                  {/* Safety */}
                  <div className="mp-safety">
                    <div className="mp-safety-hd">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1L1 3.5V6C1 7.93 2.79 9.62 5 10C7.21 9.62 9 7.93 9 6V3.5L5 1Z" stroke="#F59E0B" strokeWidth="1" strokeLinejoin="round" fill="rgba(245,158,11,0.12)"/><path d="M5 3.8V5.8M5 6.8v.4" stroke="#F59E0B" strokeWidth="0.9" strokeLinecap="round"/></svg>
                      <span>{t.landing.phoneSafetyNotes}</span>
                    </div>
                    <p className="mp-safety-line">{t.landing.phoneSafetyLine1}</p>
                    <p className="mp-safety-line">{t.landing.phoneSafetyLine2}</p>
                  </div>

                  {/* Step card */}
                  <div className="mp-step">
                    <div className="mp-step-hd">
                      <div className="mp-step-num">1</div>
                      <div style={{ flex: 1 }}>
                        <p className="mp-step-eyebrow">{t.landing.phoneStepOf}</p>
                        <p className="mp-step-name">Preparation &amp; Access</p>
                      </div>
                      <div className="mp-step-status">Ready</div>
                    </div>

                    {/* Engineering diagram */}
                    <div className="mp-diagram">
                      <svg viewBox="0 0 220 110" width="100%" height="100%">
                        {/* Background */}
                        <rect width="220" height="110" fill="#F0EDE8" rx="0"/>

                        {/* Grid lines (technical drawing style) */}
                        {[20,40,60,80,100,120,140,160,180,200].map(x => (
                          <line key={x} x1={x} y1="0" x2={x} y2="110" stroke="#DDD8D0" strokeWidth="0.4"/>
                        ))}
                        {[20,40,60,80,100].map(y => (
                          <line key={y} x1="0" y1={y} x2="220" y2={y} stroke="#DDD8D0" strokeWidth="0.4"/>
                        ))}

                        {/* Hydraulic pump body */}
                        <rect x="70" y="30" width="80" height="55" rx="4" fill="none" stroke="#555" strokeWidth="1.4"/>
                        <rect x="80" y="38" width="60" height="38" rx="2" fill="none" stroke="#888" strokeWidth="0.8"/>

                        {/* Pump shaft */}
                        <line x1="110" y1="10" x2="110" y2="30" stroke="#444" strokeWidth="2"/>
                        <rect x="104" y="8" width="12" height="6" rx="1" fill="none" stroke="#444" strokeWidth="1.2"/>

                        {/* Port A (inlet) */}
                        <line x1="70" y1="52" x2="50" y2="52" stroke="#444" strokeWidth="1.8"/>
                        <rect x="38" y="46" width="12" height="12" rx="1.5" fill="none" stroke="#444" strokeWidth="1.2"/>
                        <line x1="38" y1="52" x2="28" y2="52" stroke="#888" strokeWidth="1"/>

                        {/* Port B (outlet) */}
                        <line x1="150" y1="52" x2="170" y2="52" stroke="#EA580C" strokeWidth="1.8"/>
                        <rect x="170" y="46" width="12" height="12" rx="1.5" fill="none" stroke="#EA580C" strokeWidth="1.2"/>
                        <line x1="182" y1="52" x2="192" y2="52" stroke="#EA580C" strokeWidth="1"/>

                        {/* Drain port */}
                        <line x1="110" y1="85" x2="110" y2="100" stroke="#444" strokeWidth="1.4"/>
                        <rect x="102" y="100" width="16" height="7" rx="1" fill="none" stroke="#666" strokeWidth="1"/>

                        {/* Mounting bolts */}
                        {[[76,32],[76,80],[144,32],[144,80]].map(([bx,by]) => (
                          <circle key={`${bx}-${by}`} cx={bx} cy={by} r="3" fill="none" stroke="#666" strokeWidth="0.8"/>
                        ))}

                        {/* Center gear indicator */}
                        <circle cx="110" cy="57" r="10" fill="none" stroke="#777" strokeWidth="1"/>
                        <circle cx="110" cy="57" r="4" fill="none" stroke="#EA580C" strokeWidth="1.2"/>
                        {[0,45,90,135,180,225,270,315].map(a => {
                          const r1 = 10, r2 = 13;
                          const rad = a * Math.PI / 180;
                          return <line key={a} x1={110 + r1*Math.cos(rad)} y1={57 + r1*Math.sin(rad)} x2={110 + r2*Math.cos(rad)} y2={57 + r2*Math.sin(rad)} stroke="#888" strokeWidth="0.8"/>;
                        })}

                        {/* Labels */}
                        <text x="14" y="55" fontSize="5.5" fill="#777" fontFamily="monospace">IN</text>
                        <text x="185" y="45" fontSize="5.5" fill="#EA580C" fontFamily="monospace">OUT</text>
                        <text x="98" y="108" fontSize="5.5" fill="#777" fontFamily="monospace">DRAIN</text>
                        <text x="88" y="18" fontSize="5.5" fill="#555" fontFamily="monospace">SHAFT</text>

                        {/* Leader lines */}
                        <line x1="110" y1="19" x2="88" y2="14" stroke="#999" strokeWidth="0.5" strokeDasharray="2,1"/>
                        <line x1="38" y1="48" x2="14" y2="43" stroke="#999" strokeWidth="0.5" strokeDasharray="2,1"/>
                        <line x1="182" y1="48" x2="185" y2="42" stroke="#EA580C" strokeWidth="0.5" strokeDasharray="2,1" opacity="0.7"/>
                      </svg>
                    </div>

                    {/* Progress */}
                    <div className="mp-progress">
                      <span className="mp-progress-label">{t.landing.phoneOfSteps}</span>
                      <div className="mp-progress-track">
                        <div className="mp-progress-fill" style={{ width: '10%' }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── PRICING ─────────────────────────────────────── */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <p className="eyebrow-tag">{t.landing.pricingEyebrow}</p>
          <h2 className="section-h2">{t.landing.pricingTitle}</h2>
          <p className="section-sub">{t.landing.pricingSub}</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={`plan${plan.highlight ? ' plan--pro' : ''}`}>
              {plan.highlight && <div className="plan-popular">{t.landing.planProMostPopular}</div>}
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
        <p className="cta-band-eyebrow">{t.landing.ctaEyebrow}</p>
        <h2 className="cta-band-h2">{t.landing.ctaTitle}</h2>
        <p className="cta-band-sub">{t.landing.ctaSub}</p>
        <div className="cta-band-actions">
          <Link href="/auth/signup" className="cta-primary">{t.landing.ctaStartTrial}</Link>
          <Link href="/auth/login" className="cta-band-ghost">{t.landing.ctaAlreadyHaveAccount}</Link>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
