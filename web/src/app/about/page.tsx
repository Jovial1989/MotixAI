import Link from 'next/link';
import MainNav from '../_main-nav';
import Footer from '../_footer';
import FounderImage from '../_founder-image';

const experienceBullets = [
  'Led enterprise consulting engagements across financial services, retail, and technology sectors — from discovery to delivery',
  'Specialized in presales, solution architecture, and bridging business requirements with engineering execution',
  'Delivered digital transformation and IT modernization programs for large-scale organizations',
  'Built AI-driven product concepts and data platform initiatives, from early prototype to production',
  'Experienced across the full product lifecycle: strategy, roadmap, team structure, and go-to-market',
  'Founded and built multiple technology ventures — hands-on from infrastructure to customer conversations',
];

const credCards = [
  {
    icon: '🏗️',
    label: 'Enterprise delivery',
    desc: 'Platforms built for large organizations — multi-tenant, high-availability, compliance-aware.',
  },
  {
    icon: '🤖',
    label: 'AI & transformation',
    desc: 'AI-first product initiatives and digital transformation for enterprise clients across industries.',
  },
  {
    icon: '🔧',
    label: 'Automotive & fleet',
    desc: 'Direct exposure to fleet operations, repair workflows, and the documentation gap Motixi addresses.',
  },
  {
    icon: '📐',
    label: 'Product & strategy',
    desc: 'Takes products from concept to contract — strategy, roadmap, execution, enterprise sales cycle.',
  },
  {
    icon: '⚙️',
    label: 'Full-stack execution',
    desc: 'Writes production code, designs APIs, ships mobile. No gap between vision and execution.',
  },
];

export default function AboutPage() {
  return (
    <div className="page">
      <MainNav />

      {/* ─── HERO ────────────────────────────────────────── */}
      <section className="inner-hero">
        <div className="inner-hero-content">
          <p className="eyebrow-tag">About</p>
          <h1 className="inner-hero-h1">Founder-led software<br />for real-world operations</h1>
          <p className="inner-hero-sub">
            Built by someone with enterprise consulting experience, a product background,
            and enough time inside technical industries to know exactly where the software gap is.
          </p>
        </div>
      </section>

      {/* ─── FOUNDER SECTION ─────────────────────────────── */}
      <section className="pg-section pg-section--alt">
        <div className="pg-wrap">
          <div className="about-founder-v2">

            {/* Left: photo + name + links */}
            <div className="founder-card">
              <FounderImage size="lg" />
              <p className="founder-card-name">Kyrylo Petrov</p>
              <p className="founder-card-role">Founder &amp; CEO</p>
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

            {/* Right: bio + experience */}
            <div className="founder-bio-col">
              <h2 className="bio-headline">
                Serial entrepreneur with an enterprise and product background
              </h2>

              <p className="bio-p">
                I've spent my career at the intersection of enterprise technology, product strategy,
                and digital transformation — consulting for large organizations on IT modernization,
                leading product teams through complex builds, and working with clients where bad tooling
                has real operational consequences.
              </p>
              <p className="bio-p">
                The automotive and heavy equipment space has the same profile: technically demanding,
                consequence-rich, and criminally underserved by software. I built Motixi to close
                that gap — starting with the most fundamental thing: getting the right repair guide,
                instantly, every time.
              </p>

              {/* Experience bullets */}
              <div className="about-exp-block">
                <p className="about-exp-label">Experience</p>
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
        </div>
      </section>

      {/* ─── CREDIBILITY CARDS ───────────────────────────── */}
      <section className="pg-section">
        <div className="pg-wrap">
          <div className="pg-header">
            <p className="eyebrow-tag">Background</p>
            <h2 className="section-h2">What I bring to the table</h2>
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
          &ldquo;The best repair guide is the one that exists at the moment you need it —
          accurate, structured, and faster than any manual lookup.&rdquo;
        </p>
        <p className="about-quote-attr">— Kyrylo Petrov, Founder &amp; CEO</p>
        <div className="about-quote-actions">
          <Link href="/contact" className="cta-primary">Get in touch</Link>
          <Link href="/product" className="cta-band-ghost">See the product →</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
