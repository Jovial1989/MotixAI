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

      {/* ── Hero search area ── */}
      <div className="sh-hero">
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

      {/* ── Popular repairs ── */}
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
