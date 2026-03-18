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
  { query: 'BMW E90 oil change', count: 2841, icon: '🔧' },
  { query: 'Ford F-150 brake pads', count: 1923, icon: '🛑' },
  { query: 'Toyota timing belt', count: 1654, icon: '⚙️' },
  { query: 'CAT 320D hydraulic pump', count: 1203, icon: '🏗️' },
  { query: 'Nissan Qashqai turbocharger', count: 987, icon: '💨' },
  { query: 'VW gearbox oil change', count: 876, icon: '🔩' },
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
  const [query, setQuery] = useState('');
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

      {/* ── Two-column hero row ── */}
      <div className="sh-cols">

        {/* Left: text + search */}
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

        {/* Right: floating phone mockup */}
        <div className="sh-right" aria-hidden="true">
          <div className="sh-phone-scene">
            <div className="sh-phone phone">
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
                    Back
                  </button>
                  <div className="mp-motix-logo">
                    <div className="mp-motix-mark">M</div>
                    <span>MotixAI</span>
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
                    <span className="mp-dc mp-dc--steps">10 steps</span>
                  </div>
                </div>

                <div className="mp-detail-scroll">
                  {/* Step card */}
                  <div className="mp-step">
                    <div className="mp-step-hd">
                      <div className="mp-step-num">1</div>
                      <div style={{ flex: 1 }}>
                        <p className="mp-step-eyebrow">STEP 1 OF 10</p>
                        <p className="mp-step-name">Preparation &amp; Access</p>
                      </div>
                      <div className="mp-step-status">Ready</div>
                    </div>

                    {/* Engineering diagram */}
                    <div className="mp-diagram">
                      <svg viewBox="0 0 220 110" width="100%" height="100%">
                        <rect width="220" height="110" fill="#F0EDE8" rx="0"/>
                        {[20,40,60,80,100,120,140,160,180,200].map(x => (
                          <line key={x} x1={x} y1="0" x2={x} y2="110" stroke="#DDD8D0" strokeWidth="0.4"/>
                        ))}
                        {[20,40,60,80,100].map(y => (
                          <line key={y} x1="0" y1={y} x2="220" y2={y} stroke="#DDD8D0" strokeWidth="0.4"/>
                        ))}
                        <rect x="70" y="30" width="80" height="55" rx="4" fill="none" stroke="#555" strokeWidth="1.4"/>
                        <rect x="80" y="38" width="60" height="38" rx="2" fill="none" stroke="#888" strokeWidth="0.8"/>
                        <line x1="110" y1="10" x2="110" y2="30" stroke="#444" strokeWidth="2"/>
                        <rect x="104" y="8" width="12" height="6" rx="1" fill="none" stroke="#444" strokeWidth="1.2"/>
                        <line x1="70" y1="52" x2="50" y2="52" stroke="#444" strokeWidth="1.8"/>
                        <rect x="38" y="46" width="12" height="12" rx="1.5" fill="none" stroke="#444" strokeWidth="1.2"/>
                        <line x1="38" y1="52" x2="28" y2="52" stroke="#888" strokeWidth="1"/>
                        <line x1="150" y1="52" x2="170" y2="52" stroke="#EA580C" strokeWidth="1.8"/>
                        <rect x="170" y="46" width="12" height="12" rx="1.5" fill="none" stroke="#EA580C" strokeWidth="1.2"/>
                        <line x1="182" y1="52" x2="192" y2="52" stroke="#EA580C" strokeWidth="1"/>
                        <line x1="110" y1="85" x2="110" y2="100" stroke="#444" strokeWidth="1.4"/>
                        <rect x="102" y="100" width="16" height="7" rx="1" fill="none" stroke="#666" strokeWidth="1"/>
                        {([[76,32],[76,80],[144,32],[144,80]] as [number,number][]).map(([bx,by]) => (
                          <circle key={`${bx}-${by}`} cx={bx} cy={by} r="3" fill="none" stroke="#666" strokeWidth="0.8"/>
                        ))}
                        <circle cx="110" cy="57" r="10" fill="none" stroke="#777" strokeWidth="1"/>
                        <circle cx="110" cy="57" r="4" fill="none" stroke="#EA580C" strokeWidth="1.2"/>
                        {[0,45,90,135,180,225,270,315].map(a => {
                          const r1 = 10, r2 = 13;
                          const rad = a * Math.PI / 180;
                          return <line key={a} x1={110 + r1*Math.cos(rad)} y1={57 + r1*Math.sin(rad)} x2={110 + r2*Math.cos(rad)} y2={57 + r2*Math.sin(rad)} stroke="#888" strokeWidth="0.8"/>;
                        })}
                        <text x="14" y="55" fontSize="5.5" fill="#777" fontFamily="monospace">IN</text>
                        <text x="185" y="45" fontSize="5.5" fill="#EA580C" fontFamily="monospace">OUT</text>
                        <text x="98" y="108" fontSize="5.5" fill="#777" fontFamily="monospace">DRAIN</text>
                        <text x="88" y="18" fontSize="5.5" fill="#555" fontFamily="monospace">SHAFT</text>
                        <line x1="110" y1="19" x2="88" y2="14" stroke="#999" strokeWidth="0.5" strokeDasharray="2,1"/>
                        <line x1="38" y1="48" x2="14" y2="43" stroke="#999" strokeWidth="0.5" strokeDasharray="2,1"/>
                        <line x1="182" y1="48" x2="185" y2="42" stroke="#EA580C" strokeWidth="0.5" strokeDasharray="2,1" opacity="0.7"/>
                      </svg>
                    </div>

                    {/* Progress */}
                    <div className="mp-progress">
                      <span className="mp-progress-label">1 of 10 steps</span>
                      <div className="mp-progress-track">
                        <div className="mp-progress-fill" style={{ width: '10%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Tools */}
                  <div className="mp-section">
                    <p className="mp-section-hd">
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 8L3.5 5.5M5.5 1l2.5 2.5-2 2-2.5-2.5L5.5 1ZM3.5 5.5L2.5 6.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Tools required
                    </p>
                    <div className="mp-tools">
                      {['Socket set', 'Torque wrench', 'Trim tools', 'Thread locker'].map((t) => (
                        <span key={t} className="mp-tool">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Glow behind phone */}
            <div className="sh-phone-glow" />
          </div>
        </div>

      </div>

      {/* ── Popular repairs (full width) ── */}
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
