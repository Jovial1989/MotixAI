'use client';

import Link from 'next/link';
import MainNav from '../_main-nav';
import Footer from '../_footer';
import FounderImage from '../_founder-image';
import { useT } from '@/lib/i18n';

export default function AboutPage() {
  const t = useT();
  const a = t.aboutPage;

  return (
    <div className="page">
      <MainNav />

      {/* ─── 1. HERO ────────────────────────────────────── */}
      <section className="inner-hero">
        <div className="inner-hero-content">
          <p className="eyebrow-tag">{a.heroEyebrow}</p>
          <h1 className="inner-hero-h1">
            {a.heroTitle.split('\n')[0]}<br />{a.heroTitle.split('\n')[1]}
          </h1>
          <p className="inner-hero-sub">{a.heroSub}</p>
        </div>
      </section>

      {/* ─── 2. OUR STORY ───────────────────────────────── */}
      <section className="pg-section">
        <div className="pg-wrap about-story">
          <div className="pg-header">
            <p className="eyebrow-tag">{a.storyEyebrow}</p>
            <h2 className="section-h2">{a.storyTitle}</h2>
          </div>
          <div className="about-story-body">
            <p className="about-story-p">{a.storyP1}</p>
            <p className="about-story-p">{a.storyP2}</p>
          </div>
        </div>
      </section>

      {/* ─── 3. LEADERSHIP ──────────────────────────────── */}
      <section className="pg-section pg-section--alt">
        <div className="pg-wrap">
          <div className="pg-header">
            <p className="eyebrow-tag">{a.leadershipEyebrow}</p>
            <h2 className="section-h2">{a.leadershipTitle}</h2>
          </div>

          <div className="team-grid">
            {/* CEO */}
            <div className="team-member-card">
              <FounderImage size="lg" />
              <p className="founder-card-name">{a.ceoName}</p>
              <p className="founder-card-role">{a.ceoRole}</p>
              <p className="team-member-bio">{a.ceoBio}</p>
              <div className="founder-card-links">
                <a
                  href="https://www.linkedin.com/in/petrovkyrylo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="founder-card-btn founder-card-btn--primary"
                >
                  {a.linkedinLabel}
                </a>
                <a
                  href="mailto:petrov.cpay@gmail.com"
                  className="founder-card-btn founder-card-btn--ghost"
                >
                  {a.emailLabel}
                </a>
              </div>
            </div>

            {/* CTO */}
            <div className="team-member-card">
              <img
                src="/cto.jpg"
                alt={a.ctoName}
                className="founder-img"
              />
              <a
                href="https://www.linkedin.com/in/mykhailo-s-862ba860/"
                target="_blank"
                rel="noopener noreferrer"
                className="founder-card-name team-member-link"
              >
                {a.ctoName}
              </a>
              <p className="founder-card-role">{a.ctoRole}</p>
              <p className="team-member-bio">{a.ctoBio}</p>
              <div className="founder-card-links">
                <a
                  href="https://www.linkedin.com/in/mykhailo-s-862ba860/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="founder-card-btn founder-card-btn--primary"
                >
                  {a.linkedinLabel}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. WHY WE BUILD ────────────────────────────── */}
      <section className="pg-section">
        <div className="pg-wrap">
          <div className="pg-header">
            <p className="eyebrow-tag">{a.whyEyebrow}</p>
            <h2 className="section-h2">{a.whyTitle}</h2>
          </div>
          <div className="about-why-grid">
            {a.whyCards.map((c) => (
              <div key={c.title} className="about-why-card">
                <span className="about-why-icon">{c.icon}</span>
                <h3 className="about-why-title">{c.title}</h3>
                <p className="about-why-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. EXPERIENCE ──────────────────────────────── */}
      <section className="pg-section pg-section--alt">
        <div className="pg-wrap">
          <div className="pg-header">
            <p className="eyebrow-tag">{a.expEyebrow}</p>
            <h2 className="section-h2">{a.expTitle}</h2>
          </div>
          <div className="about-exp-grid">
            {a.expBullets.map((b) => (
              <div key={b.label} className="about-exp-card">
                <p className="about-exp-card-label">{b.label}</p>
                <p className="about-exp-card-desc">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. CTA ─────────────────────────────────────── */}
      <section className="about-quote-bar">
        <p className="about-quote-text">
          &ldquo;{a.ctaQuote}&rdquo;
        </p>
        <p className="about-quote-attr">{a.ctaQuoteAttr}</p>
        <div className="about-quote-actions">
          <Link href="/auth/signup" className="cta-primary">{a.ctaTrial}</Link>
          <Link href="/contact" className="cta-band-ghost">{a.ctaContact}</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
