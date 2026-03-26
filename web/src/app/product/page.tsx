'use client';

import Link from 'next/link';
import MainNav from '../_main-nav';
import Footer from '../_footer';
import { useT } from '@/lib/i18n';
import ProductHeroActions from './_product-hero-actions';

export default function ProductPage() {
  const t = useT();

  const forCards = t.productPage.forCards;
  const guideOutputs = t.productPage.guideOutputs;
  const differentiators = t.productPage.differentiators;

  return (
    <div className="page">
      <MainNav />

      {/* ─── HERO ────────────────────────────────────────── */}
      <section className="inner-hero">
        <div className="inner-hero-content">
          <p className="eyebrow-tag">{t.productPage.eyebrow}</p>
          <h1 className="inner-hero-h1">{t.productPage.title.split('\n')[0]}<br />{t.productPage.title.split('\n')[1]}</h1>
          <p className="inner-hero-sub">
            {t.productPage.sub}
          </p>
          <ProductHeroActions />
        </div>
      </section>

      {/* ─── APP DEMO ─────────────────────────────────────── */}
      <section className="app-demo-section">
        <div className="app-demo-header">
          <p className="app-demo-eyebrow">{t.productPage.walkthroughEyebrow}</p>
          <h2 className="app-demo-h2">{t.productPage.walkthroughTitle}</h2>
          <p className="app-demo-sub">
            {t.productPage.walkthroughSub}
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
              <p className="app-screen-num">{t.productPage.step01}</p>
              <p className="app-screen-title">{t.productPage.step01title}</p>
              <p className="app-screen-desc">{t.productPage.step01desc}</p>
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
              <p className="app-screen-num">{t.productPage.step02}</p>
              <p className="app-screen-title">{t.productPage.step02title}</p>
              <p className="app-screen-desc">{t.productPage.step02desc}</p>
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
              <p className="app-screen-num">{t.productPage.step03}</p>
              <p className="app-screen-title">{t.productPage.step03title}</p>
              <p className="app-screen-desc">{t.productPage.step03desc}</p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── WHO IT'S FOR ─────────────────────────────────── */}
      <section className="pg-section pg-section--alt">
        <div className="pg-wrap">
          <div className="pg-header">
            <p className="eyebrow-tag">{t.productPage.whoEyebrow}</p>
            <h2 className="section-h2">{t.productPage.whoTitle}</h2>
            <p className="section-sub">{t.productPage.whoSub}</p>
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
            <p className="eyebrow-tag">{t.productPage.guideOutputEyebrow}</p>
            <h2 className="section-h2">{t.productPage.guideOutputTitle}</h2>
            <p className="section-sub">{t.productPage.guideOutputSub}</p>
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
            <p className="eyebrow-tag">{t.productPage.whyEyebrow}</p>
            <h2 className="section-h2">{t.productPage.whyTitle.split('\n')[0]}<br />{t.productPage.whyTitle.split('\n')[1]}</h2>
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
        <p className="cta-band-eyebrow">{t.productPage.ctaEyebrow}</p>
        <h2 className="cta-band-h2">{t.productPage.ctaTitle}</h2>
        <p className="cta-band-sub">{t.productPage.ctaSub}</p>
        <div className="cta-band-actions">
          <Link href="/auth/signup" className="cta-primary">{t.common.signUp}</Link>
          <Link href="/auth/login" className="cta-band-ghost">{t.productPage.alreadyHaveAccount}</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
