'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, createRef } from 'react';
import { useParams } from 'next/navigation';
import type { RepairGuide, RepairStep } from '@motixai/shared';
import { webApi } from '@/lib/api';

// Guard against AI-generated string "null"/"none" values for optional fields
function isMeaningfulString(v: string | null | undefined): v is string {
  if (!v) return false;
  const t = v.trim().toLowerCase();
  return t !== 'null' && t !== 'none' && t !== 'n/a' && t !== '-' && t.length > 0;
}

/* ── Image viewer ─────────────────────────────────────────────────────── */
function StepImage({ step, guideId, isDemo }: { step: RepairStep; guideId: string; isDemo?: boolean }) {
  const [status, setStatus] = useState(step.imageStatus ?? 'none');
  const [url, setUrl]       = useState(step.imageUrl ?? null);
  const [fullscreen, setFullscreen] = useState(false);
  const [triggered, setTriggered]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isDemo || triggered || status === 'ready') return;
    setTriggered(true);
    webApi.generateStepImage(step.id, false).then((r) => {
      setStatus(r.imageStatus as typeof status); if (r.imageUrl) setUrl(r.imageUrl);
    }).catch(() => {});
  }, [step.id, triggered, status, isDemo]);

  useEffect(() => {
    const activeStatuses = ['queued', 'searching_refs', 'analyzing_refs', 'generating'];
    if (!activeStatuses.includes(status)) {
      if (timerRef.current) clearInterval(timerRef.current); return;
    }
    timerRef.current = setInterval(async () => {
      try {
        const g = await webApi.getGuide(guideId);
        const f = g?.steps?.find((s: RepairStep) => s.id === step.id);
        if (f) { setStatus((f.imageStatus ?? 'none') as typeof status); if (f.imageUrl) setUrl(f.imageUrl); }
      } catch { /* ignore */ }
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, step.id, guideId]);

  const illustrationType = url?.startsWith('data:') ? 'ai' : url ? 'fallback' : null;

  if (status === 'ready' && url) return (
    <>
      <button className="simg-preview" onClick={() => setFullscreen(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={step.title} className="simg-img" />
        <span className="simg-expand">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 4.5V2h2.5M8.5 2H11v2.5M11 8.5V11H8.5M4.5 11H2V8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Expand
        </span>
      </button>
      {illustrationType === 'fallback' && (
        <span className="simg-fallback-badge">Fallback illustration</span>
      )}
      <button className="simg-regen" title="Regenerate illustration" onClick={(e) => {
        e.stopPropagation();
        webApi.generateStepImage(step.id, true).then((r) => {
          setStatus(r.imageStatus as typeof status); if (r.imageUrl) setUrl(r.imageUrl);
        }).catch(() => {});
        setStatus('queued');
      }}>↺ Regenerate</button>
      {fullscreen && (
        <div className="simg-modal" onClick={() => setFullscreen(false)}>
          <button className="simg-modal-x">✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={step.title} className="simg-modal-img" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
  const statusLabel: Record<string, string> = {
    queued:         'Queued…',
    searching_refs: 'Searching references…',
    analyzing_refs: 'Analysing diagram layout…',
    generating:     'Generating illustration…',
  };
  if (status in statusLabel) return (
    <div className="simg-skeleton"><span className="gen-spinner gen-spinner--md" /><span>{statusLabel[status]}</span></div>
  );
  if (status === 'failed') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Failed illustration" className="simg-img" />
      )}
      <button className="simg-failed" onClick={() => { setTriggered(false); setStatus('none'); }}>↺ Retry illustration</button>
    </div>
  );
  return null;
}

/* ── Ask AI panel ────────────────────────────────────────────────────── */
function AskAiPanel({ step, guideId }: { step: RepairStep; guideId: string }) {
  const [open, setOpen]         = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function ask() {
    if (loading) return;
    setLoading(true); setAnswer(null);
    try {
      const res = await webApi.askGuideStep(guideId, step.id, question);
      setAnswer(res.answer);
    } catch {
      setAnswer('Could not get an AI explanation at this time.');
    } finally { setLoading(false); }
  }

  return (
    <div className="ask-ai-wrap">
      {!open ? (
        <button className="ask-ai-btn" onClick={() => setOpen(true)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1l1.12 3.44H11L8.44 6.56 9.56 10 6 7.88 2.44 10l1.12-3.44L1 4.44h3.88L6 1z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
          </svg>
          Ask AI about this step
        </button>
      ) : (
        <div className="ask-ai-panel">
          <div className="ask-ai-panel-hd">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5c2.76 0 5 2.01 5 4.5 0 1.56-.85 2.94-2.14 3.76L9 11.5l-1.5-.75A5.4 5.4 0 016.5 11c-2.76 0-5-2.01-5-4.5s2.24-4.5 5-4.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M6.5 5v1.5M6.5 8.5v.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            Ask AI
            <button className="ask-ai-close" onClick={() => { setOpen(false); setAnswer(null); setQuestion(''); }}>✕</button>
          </div>
          <div className="ask-ai-input-row">
            <input
              className="ask-ai-input"
              placeholder="e.g. What torque should I use here?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ask()}
              autoFocus
            />
            <button className="ask-ai-submit" onClick={ask} disabled={loading}>
              {loading ? <span className="gen-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : 'Ask'}
            </button>
          </div>
          {answer && (
            <div className="ask-ai-answer">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1l1 3H10L7.5 5.8l1 3L5.5 7.2 3 8.8l1-3L1.5 4h3.5L5.5 1z" fill="currentColor" opacity="0.6"/>
              </svg>
              {answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Step card ────────────────────────────────────────────────────────── */
function StepCard({ step, index, active, onActivate, guideId, stepRef, isDemo }: {
  step: RepairStep; index: number; active: boolean; onActivate: () => void; guideId: string;
  stepRef: React.RefObject<HTMLDivElement>; isDemo?: boolean;
}) {
  // Single source of truth: a step is open only when it is the active step.
  return (
    <div ref={stepRef} className={`sc${active ? ' sc--open sc--active' : ''}`}>
      <button className="sc-hd" onClick={onActivate}>
        <span className={`sc-num${active ? ' sc-num--on' : ''}`}>{index + 1}</span>
        <span className="sc-ttl">{step.title}</span>
        <svg className="sc-chv" width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{ transform: active ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {active && (
        <div className="sc-bd">
          <StepImage step={step} guideId={guideId} isDemo={isDemo} />
          <div className="sc-inst">
            {(() => {
              const lines = step.instruction.split('\n').filter(Boolean);
              const isNumbered = lines.some((l) => /^\d+\.\s/.test(l));
              if (isNumbered) {
                return (
                  <div className="sc-inst-list">
                    {lines.map((line, i) => {
                      const m = line.match(/^(\d+)\.\s+(.*)/);
                      return m ? (
                        <div key={i} className="sc-inst-item">
                          <span className="sc-inst-num">{m[1]}</span>
                          <span>{m[2]}</span>
                        </div>
                      ) : (
                        <span key={i} style={{ display: 'block' }}>{line}</span>
                      );
                    })}
                  </div>
                );
              }
              return lines.map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>);
            })()}
          </div>
          {(isMeaningfulString(step.torqueValue) || isMeaningfulString(step.warningNote)) && (
            <div className="sc-specs">
              {isMeaningfulString(step.warningNote) && (
                <div className="sc-spec sc-spec--warn">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1L10.5 10H.5L5.5 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/><path d="M5.5 4.5v2M5.5 8v.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  {step.warningNote}
                </div>
              )}
              {isMeaningfulString(step.torqueValue) && (
                <div className="sc-spec sc-spec--ok">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.1"/><path d="M3.5 7.5c1-2 3-2 4-3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  Torque: {step.torqueValue}
                </div>
              )}
            </div>
          )}
          <AskAiPanel step={step} guideId={guideId} />
        </div>
      )}
    </div>
  );
}

/* ── Guide detail page ────────────────────────────────────────────────── */
export default function GuideDetailPage() {
  const params = useParams<{ id: string }>();
  const [guide, setGuide]         = useState<RepairGuide | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [toolsOpen, setToolsOpen]   = useState(false);
  const stepRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);

  useEffect(() => {
    if (!params.id) return;
    // Clear stale data from any previously-viewed guide immediately so the
    // wrong vehicle / title never shows while the new fetch is in flight.
    setGuide(null);
    setError(null);
    webApi.getGuide(params.id)
      .then(setGuide)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [params.id]);

  // Scroll active step into view whenever it changes
  useEffect(() => {
    const ref = stepRefs.current[activeStep];
    if (!ref?.current) return;
    // Small delay so the card has time to expand before measuring
    const t = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    return () => clearTimeout(t);
  }, [activeStep]);

  const diffColor: Record<string, string> = {
    Beginner: 'badge--green', Intermediate: 'badge--yellow', Advanced: 'badge--orange', Expert: 'badge--red',
  };

  if (error) return (
    <div className="dash-root">
      <header className="dash-nav"><Link href="/dashboard" className="dash-logo">Motixi</Link><Link href="/dashboard" className="dash-nav-back">← All guides</Link></header>
      <div className="gd-center"><p className="gd-error-msg">⚠ {error}</p><Link href="/dashboard" className="auth-btn-primary" style={{display:'inline-flex',width:'auto',padding:'0 24px'}}>← Back</Link></div>
    </div>
  );

  if (!guide) return (
    <div className="dash-root">
      <header className="dash-nav"><Link href="/dashboard" className="dash-logo">Motixi</Link><Link href="/dashboard" className="dash-nav-back">← All guides</Link></header>
      <div className="gd-center"><span className="gen-spinner gen-spinner--lg" /><p style={{color:'var(--text-muted)',marginTop:12}}>Loading guide…</p></div>
    </div>
  );

  const steps = guide.steps ?? [];
  const isDemo = guide.source === 'demo';

  // Keep stepRefs array in sync with steps length
  if (stepRefs.current.length !== steps.length) {
    stepRefs.current = steps.map((_, i) => stepRefs.current[i] ?? createRef<HTMLDivElement>());
  }

  const TOOLS_DEFAULT = 4;
  const toolsVisible = toolsOpen ? guide.tools : guide.tools?.slice(0, TOOLS_DEFAULT);
  const toolsExtra   = (guide.tools?.length ?? 0) - TOOLS_DEFAULT;
  const pct = Math.round(((activeStep + 1) / Math.max(steps.length, 1)) * 100);

  return (
    <div className="dash-root">
      {/* Nav */}
      <header className="dash-nav">
        <div className="dash-nav-inner">
          <Link href="/dashboard" className="dash-logo">Motixi</Link>
          <div className="dash-nav-right">
            <Link href="/dashboard" className="dash-nav-back">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              All guides
            </Link>
          </div>
        </div>
      </header>

      {/* 2-column layout */}
      <div className="gd-layout">

        {/* ═══ LEFT — procedure ═══ */}
        <main className="gd-main">
          {/* Header (mobile only — hidden on desktop where right col shows it) */}
          <div className="gd-mob-head">
            <div className="gd-chip-row">
              <span className={`badge ${diffColor[guide.difficulty] ?? 'badge--yellow'}`}>{guide.difficulty}</span>
              {guide.timeEstimate && (
                <span className="gd-chip">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.2" stroke="currentColor" strokeWidth="1.1"/><path d="M5.5 3.5v2l1.3.9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  {guide.timeEstimate}
                </span>
              )}
            </div>
            <h1 className="gd-mob-title">{guide.title}</h1>
            <p className="gd-mob-sub">{guide.vehicle.model} · {guide.part.name}</p>
          </div>

          <div className="gd-steps-hd">
            <span className="gd-steps-label">PROCEDURE</span>
            <span className="gd-steps-count">{steps.length} steps</span>
          </div>

          <div className="gd-steps-list">
            {steps.map((step, i) => (
              <StepCard
                key={step.id} step={step} index={i}
                active={activeStep === i}
                onActivate={() => setActiveStep(i)}
                guideId={params.id}
                stepRef={stepRefs.current[i]}
                isDemo={isDemo}
              />
            ))}
          </div>
        </main>

        {/* ═══ RIGHT — sticky sidebar ═══ */}
        <aside className="gd-sidebar">

          {/* Guide card */}
          <div className="gd-sb-card">
            <div className="gd-chip-row">
              <span className={`badge ${diffColor[guide.difficulty] ?? 'badge--yellow'}`}>{guide.difficulty}</span>
              {guide.timeEstimate && (
                <span className="gd-chip">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.2" stroke="currentColor" strokeWidth="1.1"/><path d="M5.5 3.5v2l1.3.9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  {guide.timeEstimate}
                </span>
              )}
              <span className="gd-chip">{guide.vehicle.model}</span>
            </div>
            <h2 className="gd-sb-title">{guide.title}</h2>
            <p className="gd-sb-sub">{guide.part.name} · {steps.length} steps</p>
            <div className="gd-ai-meta">
              {guide.source === 'source-backed' ? (
                <span className="ai-source-chip ai-source-chip--sourced">
                  📄 {guide.sourceProvider ?? 'Source-Backed'}
                </span>
              ) : guide.source === 'web-fallback' ? (
                <span className="ai-source-chip ai-source-chip--fallback">
                  🌐 Web Synthesis
                </span>
              ) : (
                <span className="ai-source-chip">⚡ AI Generated</span>
              )}
              {guide.confidence != null && guide.source === 'source-backed' && (
                <span className="ai-confidence">{guide.confidence}% confidence</span>
              )}
            </div>
            <div className="gd-prog-track">
              <div className="gd-prog-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="gd-prog-label">Step {activeStep + 1} of {steps.length}</p>
          </div>

          {/* Tools */}
          {guide.tools && guide.tools.length > 0 && (
            <div className="gd-sb-card">
              <p className="gd-sb-section">TOOLS REQUIRED</p>
              <div className="gd-tools">
                {toolsVisible?.map((t) => <span key={t} className="gd-tool">{t}</span>)}
                {!toolsOpen && toolsExtra > 0 && (
                  <button className="gd-tool gd-tool--more" onClick={() => setToolsOpen(true)}>+{toolsExtra} more</button>
                )}
                {toolsOpen && (
                  <button className="gd-tool gd-tool--more" onClick={() => setToolsOpen(false)}>Show less ↑</button>
                )}
              </div>
            </div>
          )}

          {/* Safety */}
          {guide.safetyNotes && guide.safetyNotes.length > 0 && (
            <div className={`gd-safety${safetyOpen ? ' gd-safety--open' : ''}`}>
              <button className="gd-safety-btn" onClick={() => setSafetyOpen(o => !o)}>
                <span className="gd-safety-ico">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5L11.5 4.5V8c0 2.2-2 4.2-5 5C2 12.2.5 10.2.5 8V4.5L6.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M4.5 7l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <span className="gd-safety-ttl">
                  {safetyOpen ? 'Safety notes' : `${guide.safetyNotes.length} safety notes`}
                </span>
                <svg className="gd-safety-chv" width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{ transform: safetyOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                  <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {safetyOpen && (
                <ul className="gd-safety-list">
                  {guide.safetyNotes.map((n, i) => <li key={i} className="gd-safety-item">{n}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Source References */}
          {guide.sourceReferences && guide.sourceReferences.length > 0 && (
            <div className="gd-sb-card">
              <p className="gd-sb-section">SOURCE REFERENCES</p>
              <div className="gd-sources">
                {guide.sourceReferences.map((ref, i) => (
                  <div key={i} className="gd-source-item">
                    <a href={ref.url} target="_blank" rel="noopener noreferrer" className="gd-source-title">{ref.title}</a>
                    <p className="gd-source-excerpt">{ref.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step navigator */}
          <div className="gd-sb-card gd-nav">
            <button className="gd-nav-prev" disabled={activeStep === 0} onClick={() => setActiveStep(s => s - 1)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Prev
            </button>
            <span className="gd-nav-pos">{activeStep + 1} / {steps.length}</span>
            <button className="gd-nav-next" disabled={activeStep >= steps.length - 1} onClick={() => setActiveStep(s => s + 1)}>
              Next
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>

        </aside>
      </div>
    </div>
  );
}
