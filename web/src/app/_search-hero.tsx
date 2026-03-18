'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const EXAMPLE_QUERIES = [
  'bmw e90 oil filter',
  'cat 320d hydraulic pump',
  'ford f150 brake pads',
  'toyota timing belt',
];

const POPULAR_REPAIRS = [
  { query: 'BMW E90 oil change',          count: 2841, icon: '🔧' },
  { query: 'Ford F-150 brake pads',       count: 1923, icon: '🛑' },
  { query: 'Toyota timing belt',          count: 1654, icon: '⚙️' },
  { query: 'CAT 320D hydraulic pump',     count: 1203, icon: '🏗️' },
  { query: 'Nissan Qashqai turbocharger', count: 987,  icon: '💨' },
  { query: 'VW gearbox oil change',       count: 876,  icon: '🔩' },
];

const STORAGE_KEY = 'motix_recent_searches';
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}
function saveRecent(q: string) {
  try {
    const list = getRecent().filter(s => s !== q);
    list.unshift(q);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 5)));
  } catch { /* ignore */ }
}

export default function SearchHero() {
  const router = useRouter();
  const [query, setQuery]   = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => { setRecent(getRecent()); }, []);

  function handleSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    saveRecent(trimmed);
    setRecent(getRecent());
    router.push(`/dashboard?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="sh-root">

      {/* ── Two-column hero ── */}
      <div className="sh-cols">

        {/* ── Left: copy + search ── */}
        <div className="sh-left">
          <div className="hero-eyebrow">
            <span className="eyebrow-dot" />
            AI Repair Intelligence
          </div>

          <h1 className="sh-h1">
            The repair knowledge base<br />
            <span className="sh-h1-grad">for every vehicle.</span>
          </h1>

          <p className="sh-sub">
            Ask any repair question. MotixAI searches its knowledge base — if the guide
            exists, you get it instantly. If not, AI generates it and stores it for everyone.
          </p>

          <div className="sh-input-wrap">
            <svg className="sh-input-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.7"/>
              <path d="M14.5 14.5L18 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            <input
              className="sh-input"
              placeholder="Search by vehicle, issue, or component…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
              autoComplete="off"
            />
            <button className="sh-btn" onClick={() => handleSearch(query)}>
              Search
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="sh-chips">
            <span className="sh-chips-label">Try:</span>
            {EXAMPLE_QUERIES.map(q => (
              <button key={q} className="sh-chip" onClick={() => handleSearch(q)}>{q}</button>
            ))}
          </div>

          {recent.length > 0 && (
            <div className="sh-recent">
              <span className="sh-recent-label">Recent:</span>
              {recent.map(q => (
                <button key={q} className="sh-recent-item" onClick={() => handleSearch(q)}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1"/>
                    <path d="M5 3v2.2l1.4.9" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                  </svg>
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: dual-phone mockup with floating badges ── */}
        <div className="sh-right" aria-hidden="true">
          <div className="sh-duo">

            {/* Floating stat badges */}
            <div className="sh-badge sh-badge--tl">
              <span className="sh-badge-val">⚡ &lt;3s</span>
              <span className="sh-badge-lbl">AI generation</span>
            </div>
            <div className="sh-badge sh-badge--tr">
              <span className="sh-badge-val">∞</span>
              <span className="sh-badge-lbl">Vehicle models</span>
            </div>
            <div className="sh-badge sh-badge--bl">
              <span className="sh-badge-val">8–15</span>
              <span className="sh-badge-lbl">Steps per guide</span>
            </div>

            {/* Glow behind phones */}
            <div className="sh-duo-glow" />

            {/* ── Back phone: Guide List ── */}
            <div className="phone phone--back">
              <div className="phone-di" />
              <div className="phone-screen">
                <div className="mp-sb">
                  <span className="mp-sb-time">9:41</span>
                  <div className="mp-sb-right">
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><rect x="0" y="3" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.35"/><rect x="3" y="2" width="2" height="6" rx="0.5" fill="currentColor" opacity="0.55"/><rect x="6" y="1" width="2" height="7" rx="0.5" fill="currentColor" opacity="0.75"/><rect x="9" y="0" width="2" height="8" rx="0.5" fill="currentColor"/></svg>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M6 1.5C7.93 1.5 9.66 2.28 10.9 3.52L12 2.42C10.47 0.92 8.34 0 6 0C3.66 0 1.53 0.92 0 2.42L1.1 3.52C2.34 2.28 4.07 1.5 6 1.5Z" fill="currentColor" opacity="0.35"/><path d="M6 4C7.1 4 8.1 4.45 8.83 5.17L9.93 4.07C8.9 3.04 7.52 2.4 6 2.4C4.48 2.4 3.1 3.04 2.07 4.07L3.17 5.17C3.9 4.45 4.9 4 6 4Z" fill="currentColor" opacity="0.65"/><circle cx="6" cy="7" r="1" fill="currentColor"/></svg>
                    <div className="mp-battery"><div className="mp-battery-fill" /></div>
                  </div>
                </div>
                <div className="mp-list-header">
                  <div>
                    <p className="mp-list-eyebrow">My Workspace</p>
                    <p className="mp-list-title">Guides</p>
                    <p className="mp-list-count">3 guides · this week</p>
                  </div>
                  <div className="mp-avatar">K</div>
                </div>
                <div className="mp-search">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7.5 7.5L9.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <span>Search guides…</span>
                </div>
                <p className="mp-list-section">Recent</p>
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
                        <span className="mp-card-steps-lbl">steps</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mp-tabbar">
                  <button className="mp-tab-item mp-tab-item--active">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5L2 5.5V12.5H5.5V9H8.5V12.5H12V5.5L7 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                    <span>Guides</span>
                    <div className="mp-tab-dot" />
                  </button>
                  <button className="mp-tab-item">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 8l1.5-4h5L11 8" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><rect x="2" y="8" width="10" height="3.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><circle cx="5" cy="12.5" r="1" fill="currentColor"/><circle cx="9" cy="12.5" r="1" fill="currentColor"/></svg>
                    <span>Garage</span>
                  </button>
                  <button className="mp-tab-item">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 12.5c0-2.49 2.01-4.5 4.5-4.5s4.5 2.01 4.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    <span>Profile</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ── Front phone: Guide Detail ── */}
            <div className="phone phone--front">
              <div className="phone-di" />
              <div className="phone-screen mp-screen--detail">
                <div className="mp-sb">
                  <span className="mp-sb-time">9:41</span>
                  <div className="mp-sb-right">
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none"><rect x="0" y="3" width="2" height="5" rx="0.5" fill="currentColor" opacity="0.35"/><rect x="3" y="2" width="2" height="6" rx="0.5" fill="currentColor" opacity="0.55"/><rect x="6" y="1" width="2" height="7" rx="0.5" fill="currentColor" opacity="0.75"/><rect x="9" y="0" width="2" height="8" rx="0.5" fill="currentColor"/></svg>
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M6 1.5C7.93 1.5 9.66 2.28 10.9 3.52L12 2.42C10.47 0.92 8.34 0 6 0C3.66 0 1.53 0.92 0 2.42L1.1 3.52C2.34 2.28 4.07 1.5 6 1.5Z" fill="currentColor" opacity="0.35"/><path d="M6 4C7.1 4 8.1 4.45 8.83 5.17L9.93 4.07C8.9 3.04 7.52 2.4 6 2.4C4.48 2.4 3.1 3.04 2.07 4.07L3.17 5.17C3.9 4.45 4.9 4 6 4Z" fill="currentColor" opacity="0.65"/><circle cx="6" cy="7" r="1" fill="currentColor"/></svg>
                    <div className="mp-battery"><div className="mp-battery-fill" /></div>
                  </div>
                </div>
                <div className="mp-detail-nav">
                  <button className="mp-back">
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="none"><path d="M6.5 1L1.5 6l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Back
                  </button>
                  <div className="mp-motix-logo">
                    <div className="mp-motix-mark">M</div>
                    <span>MotixAI</span>
                  </div>
                  <div style={{ width: 40 }} />
                </div>
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
                    <span className="mp-dc mp-dc--steps">10 steps</span>
                  </div>
                </div>
                <div className="mp-detail-scroll">
                  <div className="mp-step">
                    <div className="mp-step-hd">
                      <div className="mp-step-num">1</div>
                      <div style={{ flex: 1 }}>
                        <p className="mp-step-eyebrow">STEP 1 OF 10</p>
                        <p className="mp-step-name">Preparation &amp; Access</p>
                      </div>
                      <div className="mp-step-status">Ready</div>
                    </div>
                    <div className="mp-diagram">
                      <svg viewBox="0 0 220 110" width="100%" height="100%">
                        <rect width="220" height="110" fill="#F0EDE8"/>
                        {[20,40,60,80,100,120,140,160,180,200].map(x => <line key={x} x1={x} y1="0" x2={x} y2="110" stroke="#DDD8D0" strokeWidth="0.4"/>)}
                        {[20,40,60,80,100].map(y => <line key={y} x1="0" y1={y} x2="220" y2={y} stroke="#DDD8D0" strokeWidth="0.4"/>)}
                        <rect x="70" y="30" width="80" height="55" rx="4" fill="none" stroke="#555" strokeWidth="1.4"/>
                        <rect x="80" y="38" width="60" height="38" rx="2" fill="none" stroke="#888" strokeWidth="0.8"/>
                        <line x1="110" y1="10" x2="110" y2="30" stroke="#444" strokeWidth="2"/>
                        <rect x="104" y="8" width="12" height="6" rx="1" fill="none" stroke="#444" strokeWidth="1.2"/>
                        <line x1="70" y1="52" x2="50" y2="52" stroke="#444" strokeWidth="1.8"/>
                        <rect x="38" y="46" width="12" height="12" rx="1.5" fill="none" stroke="#444" strokeWidth="1.2"/>
                        <line x1="150" y1="52" x2="170" y2="52" stroke="#EA580C" strokeWidth="1.8"/>
                        <rect x="170" y="46" width="12" height="12" rx="1.5" fill="none" stroke="#EA580C" strokeWidth="1.2"/>
                        <circle cx="110" cy="57" r="10" fill="none" stroke="#777" strokeWidth="1"/>
                        <circle cx="110" cy="57" r="4" fill="none" stroke="#EA580C" strokeWidth="1.2"/>
                        {[0,45,90,135,180,225,270,315].map(a => {
                          const rad = a * Math.PI / 180;
                          return <line key={a} x1={110+10*Math.cos(rad)} y1={57+10*Math.sin(rad)} x2={110+13*Math.cos(rad)} y2={57+13*Math.sin(rad)} stroke="#888" strokeWidth="0.8"/>;
                        })}
                        <text x="14" y="55" fontSize="5.5" fill="#777" fontFamily="monospace">IN</text>
                        <text x="185" y="45" fontSize="5.5" fill="#EA580C" fontFamily="monospace">OUT</text>
                        <text x="88" y="18" fontSize="5.5" fill="#555" fontFamily="monospace">SHAFT</text>
                      </svg>
                    </div>
                    <div className="mp-progress">
                      <span className="mp-progress-label">1 of 10 steps</span>
                      <div className="mp-progress-track">
                        <div className="mp-progress-fill" style={{ width: '10%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="mp-section">
                    <p className="mp-section-hd">
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 8L3.5 5.5M5.5 1l2.5 2.5-2 2-2.5-2.5L5.5 1ZM3.5 5.5L2.5 6.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Tools required
                    </p>
                    <div className="mp-tools">
                      {['Socket set', 'Torque wrench', 'Trim tools', 'Thread locker'].map(t => (
                        <span key={t} className="mp-tool">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ── Popular repairs (full width below) ── */}
      <div className="sh-popular">
        <p className="sh-popular-hd">Popular Repairs</p>
        <div className="sh-popular-grid">
          {POPULAR_REPAIRS.map(r => (
            <button key={r.query} className="sh-popular-item" onClick={() => handleSearch(r.query)}>
              <span className="sh-popular-icon">{r.icon}</span>
              <span className="sh-popular-name">{r.query}</span>
              <span className="sh-popular-count">{r.count.toLocaleString()} guides</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
