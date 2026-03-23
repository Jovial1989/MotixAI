'use client';

import Link from 'next/link';
import MainNav from '../_main-nav';
import Footer from '../_footer';
import FounderImage from '../_founder-image';
import { useT } from '@/lib/i18n';

export default function AboutPage() {
  const t = useT();

  const experienceBullets = t.aboutPage.experienceBullets;
  const credCards = t.aboutPage.credCards;

  return (
    <div className="page">
      <MainNav />

      {/* ─── HERO ────────────────────────────────────────── */}
      <section className="inner-hero">
        <div className="inner-hero-content">
          <p className="eyebrow-tag">{t.aboutPage.eyebrow}</p>
          <h1 className="inner-hero-h1">{t.aboutPage.title.split('\n')[0]}<br />{t.aboutPage.title.split('\n')[1]}</h1>
          <p className="inner-hero-sub">
            {t.aboutPage.sub}
          </p>
        </div>
      </section>

      {/* ─── LEADERSHIP TEAM ──────────────────────────────── */}
      <section className="pg-section pg-section--alt">
        <div className="pg-wrap">
          <div className="pg-header">
            <p className="eyebrow-tag">Leadership</p>
            <h2 className="section-h2">The team behind Motixi</h2>
          </div>

          <div className="team-grid">
            {/* CEO card */}
            <div className="team-member-card">
              <FounderImage size="lg" />
              <p className="founder-card-name">{t.aboutPage.founderName}</p>
              <p className="founder-card-role">{t.aboutPage.founderRole}</p>
              <p className="team-member-bio">{t.aboutPage.bioHeadline}</p>
              <div className="founder-card-links">
                <a
                  href="https://www.linkedin.com/in/petrovkyrylo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="founder-card-btn founder-card-btn--primary"
                >
                  LinkedIn
                </a>
                <a
                  href="mailto:petrov.cpay@gmail.com"
                  className="founder-card-btn founder-card-btn--ghost"
                >
                  Email
                </a>
              </div>
            </div>

            {/* CTO card */}
            <div className="team-member-card">
              <img
                src="/cto.jpg"
                alt={t.aboutPage.ctoName}
                className="founder-img"
              />
              <a
                href="https://www.linkedin.com/in/mykhailo-s-862ba860/"
                target="_blank"
                rel="noopener noreferrer"
                className="founder-card-name team-member-link"
              >
                {t.aboutPage.ctoName}
              </a>
              <p className="founder-card-role">{t.aboutPage.ctoRole} &middot; {t.aboutPage.ctoTitle}</p>
              <p className="team-member-bio">{t.aboutPage.ctoBio}</p>
              <div className="founder-card-links">
                <a
                  href="https://www.linkedin.com/in/mykhailo-s-862ba860/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="founder-card-btn founder-card-btn--primary"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* CEO detailed bio below the team grid */}
          <div className="founder-detail-section">
            <h2 className="bio-headline">
              {t.aboutPage.bioHeadline}
            </h2>

            <p className="bio-p">
              {t.aboutPage.bioP1}
            </p>
            <p className="bio-p">
              {t.aboutPage.bioP2}
            </p>

            <div className="about-exp-block">
              <p className="about-exp-label">{t.aboutPage.experienceLabel}</p>
              <ul className="about-exp-list">
                {experienceBullets.map((bullet) => (
                  <li key={bullet} className="about-exp-item">
                    <span className="about-exp-dot" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CREDIBILITY CARDS ───────────────────────────── */}
      <section className="pg-section">
        <div className="pg-wrap">
          <div className="pg-header">
            <p className="eyebrow-tag">{t.aboutPage.backgroundEyebrow}</p>
            <h2 className="section-h2">{t.aboutPage.backgroundTitle}</h2>
          </div>
          <div className="cred-grid-v2">
            {credCards.map((c) => (
              <div key={c.label} className="cred-card-v2">
                <div className="cred-card-v2-icon">{c.icon}</div>
                <p className="cred-card-v2-label">{c.label}</p>
                <p className="cred-card-v2-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── QUOTE / CTA ─────────────────────────────────── */}
      <section className="about-quote-bar">
        <p className="about-quote-text">
          &ldquo;{t.aboutPage.quote}&rdquo;
        </p>
        <p className="about-quote-attr">{t.aboutPage.quoteAttr}</p>
        <div className="about-quote-actions">
          <Link href="/contact" className="cta-primary">{t.aboutPage.getInTouch}</Link>
          <Link href="/product" className="cta-band-ghost">{t.aboutPage.seeProduct}</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
