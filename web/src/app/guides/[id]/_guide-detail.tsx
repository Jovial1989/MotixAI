'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, createRef } from 'react';
import { useParams } from 'next/navigation';
import type { RepairGuide, RepairStep } from '@motixai/shared';
import { webApi } from '@/lib/api';

/* ── Image viewer ─────────────────────────────────────────────────────── */
function StepImage({ step, guideId }: { step: RepairStep; guideId: string }) {
  const [status, setStatus] = useState(step.imageStatus ?? 'none');
  const [url, setUrl]       = useState(step.imageUrl ?? null);
  const [fullscreen, setFullscreen] = useState(false);
  const [triggered, setTriggered]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (triggered || status === 'ready') return;
    setTriggered(true);
    webApi.generateStepImage(step.id, false).then((r) => {
      setStatus(r.imageStatus as typeof status); if (r.imageUrl) setUrl(r.imageUrl);
    }).catch(() => {});
  }, [step.id, triggered, status]);

  useEffect(() => {
    if (status !== 'queued' && status !== 'generating') {
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
      {fullscreen && (
        <div className="simg-modal" onClick={() => setFullscreen(false)}>
          <button className="simg-modal-x">✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={step.title} className="simg-modal-img" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
  if (status === 'queued' || status === 'generating') return (
    <div className="simg-skeleton"><span className="gen-spinner gen-spinner--md" /><span>Generating illustration…</span></div>
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

/* ── Step card ────────────────────────────────────────────────────────── */
function StepCard({ step, index, active, onActivate, guideId, stepRef }: {
  step: RepairStep; index: number; active: boolean; onActivate: () => void; guideId: string;
  stepRef: React.RefObject<HTMLDivElement>;
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
          <StepImage step={step} guideId={guideId} />
          <div className="sc-inst">
            {step.instruction.split('\n').filter(Boolean).map((line, i) => (
              <span key={i} style={{ display: 'block' }}>{line}</span>
            ))}
          </div>
          {(step.torqueValue || step.warningNote) && (
            <div className="sc-specs">
              {step.warningNote && (
                <div className="sc-spec sc-spec--warn">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1L10.5 10H.5L5.5 1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/><path d="M5.5 4.5v2M5.5 8v.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  {step.warningNote}
                </div>
              )}
              {step.torqueValue && (
                <div className="sc-spec sc-spec--ok">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.1"/><path d="M3.5 7.5c1-2 3-2 4-3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  Torque: {step.torqueValue}
                </div>
              )}
            </div>
          )}
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
      <header className="dash-nav"><Link href="/dashboard" className="dash-logo">MotixAI</Link><Link href="/dashboard" className="dash-nav-back">← All guides</Link></header>
      <div className="gd-center"><p className="gd-error-msg">⚠ {error}</p><Link href="/dashboard" className="auth-btn-primary" style={{display:'inline-flex',width:'auto',padding:'0 24px'}}>← Back</Link></div>
    </div>
  );

  if (!guide) return (
    <div className="dash-root">
      <header className="dash-nav"><Link href="/dashboard" className="dash-logo">MotixAI</Link><Link href="/dashboard" className="dash-nav-back">← All guides</Link></header>
      <div className="gd-center"><span className="gen-spinner gen-spinner--lg" /><p style={{color:'var(--text-muted)',marginTop:12}}>Loading guide…</p></div>
    </div>
  );

  const steps = guide.steps ?? [];

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
        <Link href="/dashboard" className="dash-logo">MotixAI</Link>
        <div className="dash-nav-right">
          <Link href="/dashboard" className="dash-nav-back">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            All guides
          </Link>
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
