import MainNav from '../_main-nav';
import Footer from '../_footer';
import FounderImage from '../_founder-image';

export default function ContactPage() {
  return (
    <div className="page">
      <MainNav />

      {/* ─── INNER HERO ──────────────────────────────────── */}
      <section className="inner-hero">
        <div className="inner-hero-content">
          <p className="eyebrow-tag">Contact</p>
          <h1 className="inner-hero-h1">Let&apos;s talk</h1>
          <p className="inner-hero-sub">
            For partnerships, enterprise deployments, consulting, product strategy,
            or any questions about Motixi — I respond personally.
          </p>
        </div>
      </section>

      {/* ─── CONTACT BODY ────────────────────────────────── */}
      <section className="contact-v2-wrap">
        <div className="contact-v2-inner">

          {/* Founder card */}
          <div className="contact-v2-card">
            <div className="contact-v2-img-wrap">
              <FounderImage size="sm" />
            </div>
            <p className="contact-v2-name">Kyrylo Petrov</p>
            <p className="contact-v2-role">Founder &amp; CEO, Motixi</p>
            <div className="contact-v2-links">
              <a
                href="mailto:petrov.cpay@gmail.com"
                className="founder-card-btn founder-card-btn--primary"
              >
                Email
              </a>
              <a
                href="https://www.linkedin.com/in/petrovkyrylo/"
                target="_blank"
                rel="noopener noreferrer"
                className="founder-card-btn founder-card-btn--ghost"
              >
                LinkedIn
              </a>
            </div>
          </div>

          {/* Body */}
          <div className="contact-v2-body">
            <h2 className="contact-v2-h2">Get in touch directly</h2>
            <p className="contact-v2-p">
              I respond personally to every message. Whether you&apos;re evaluating Motixi
              for your workshop, exploring an enterprise deployment, looking for a consulting
              conversation, or just want to discuss the problem space — I&apos;m reachable.
            </p>
            <p className="contact-v2-p">
              The fastest path is email. LinkedIn works too for a more formal introduction.
            </p>
            <div className="contact-v2-divider" />
            <div className="contact-v2-actions">
              <a href="mailto:petrov.cpay@gmail.com" className="contact-v2-email">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                petrov.cpay@gmail.com
              </a>
              <a
                href="https://www.linkedin.com/in/petrovkyrylo/"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-v2-li"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <rect x="1" y="1" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M4.5 6.5v5M4.5 4.5v.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M7.5 11.5V9c0-1.38 1-2.5 2.25-2.5S12 7.62 12 9v2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                linkedin.com/in/petrovkyrylo
              </a>
            </div>
            <p className="contact-v2-note">Usually responds within 24 hours.</p>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
