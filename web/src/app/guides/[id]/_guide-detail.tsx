'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, createRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { RepairGuide, RepairStep } from '@motixai/shared';
import { webApi } from '@/lib/api';
import { getLocale, useT } from '@/lib/i18n';

// Guard against AI-generated string "null"/"none" values for optional fields
function isMeaningfulString(v: string | null | undefined): v is string {
  if (!v) return false;
  const t = v.trim().toLowerCase();
  return t !== 'null' && t !== 'none' && t !== 'n/a' && t !== '-' && t.length > 0;
}

function difficultyBadgeClass(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (['beginner', 'початковий', 'начинаещ'].includes(normalized)) return 'badge--green';
  if (['intermediate', 'середній', 'средно ниво'].includes(normalized)) return 'badge--yellow';
  if (['advanced', 'просунутий', 'напреднал'].includes(normalized)) return 'badge--orange';
  if (['expert', 'експертний', 'експертно'].includes(normalized)) return 'badge--red';
  return 'badge--yellow';
}

/* ── Image viewer ────────────────────────────────────────────────────── */
function StepImage({ step, canRegenerate = true }: { step: RepairStep; canRegenerate?: boolean }) {
  const t = useT();
  const [status, setStatus] = useState(step.imageStatus ?? (step.imageUrl ? 'ready' : 'none'));
  const [url, setUrl]       = useState(step.imageUrl ?? null);
  const [fullscreen, setFullscreen] = useState(false);
  const [triggered, setTriggered]   = useState(Boolean(step.imageUrl));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setStatus(step.imageStatus ?? (step.imageUrl ? 'ready' : 'none'));
    setUrl(step.imageUrl ?? null);
    setTriggered(Boolean(step.imageUrl));
  }, [step.id, step.imageStatus, step.imageUrl]);

  useEffect(() => {
    if (triggered || (status === 'ready' && url)) return;
    setTriggered(true);
    webApi.generateStepImage(step.id, false).then((r) => {
      setStatus(r.imageStatus as typeof status);
      if (r.imageUrl) setUrl(r.imageUrl);
    }).catch(() => {
      setStatus('failed');
    });
  }, [status, step.id, triggered, url]);

  useEffect(() => {
    const activeStatuses = ['queued', 'searching_refs', 'analyzing_refs', 'generating'];
    if (!activeStatuses.includes(status)) {
      if (timerRef.current) clearInterval(timerRef.current); return;
    }
    timerRef.current = setInterval(async () => {
      try {
        const r = await webApi.generateStepImage(step.id, false);
        setStatus(r.imageStatus as typeof status);
        if (r.imageUrl) setUrl(r.imageUrl);
      } catch { /* ignore */ }
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status, step.id]);

  useEffect(() => {
    if (status !== 'failed' || url) return;
    const timer = setTimeout(() => {
      setStatus('none');
      setTriggered(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, [status, url]);

  const showLoader = !url && ['none', 'queued', 'searching_refs', 'analyzing_refs', 'generating', 'failed'].includes(status);

  if (status === 'ready' && url) return (
    <>
      <button className="simg-preview" onClick={() => setFullscreen(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={step.title} className="simg-img simg-img--ready" loading="lazy" />
        <span className="simg-expand">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 4.5V2h2.5M8.5 2H11v2.5M11 8.5V11H8.5M4.5 11H2V8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {t.guideDetail.expand}
        </span>
      </button>
      {canRegenerate && (
        <button className="simg-regen" title={t.guideDetail.regenerate} onClick={(e) => {
          e.stopPropagation();
          webApi.generateStepImage(step.id, true).then((r) => {
            setStatus(r.imageStatus as typeof status); if (r.imageUrl) setUrl(r.imageUrl);
          }).catch(() => {
            setStatus('failed');
          });
          setStatus('queued');
        }}>{`↺ ${t.guideDetail.regenerate}`}</button>
      )}
      {fullscreen && (
        <div className="simg-modal" onClick={() => setFullscreen(false)}>
          <button className="simg-modal-x">✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={step.title} className="simg-modal-img" loading="lazy" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );

  const statusLabel: Record<string, string> = {
    queued:         t.guideDetail.queuedStatus,
    searching_refs: t.guideDetail.searchingRefs,
    analyzing_refs: t.guideDetail.analyzingRefs,
    generating:     t.guideDetail.generatingStatus,
  };
  if (showLoader || status in statusLabel) return (
    <div className="simg-skeleton">
      <div className="simg-skeleton-shimmer" />
      <div className="simg-skeleton-body">
        <span className="gen-spinner gen-spinner--md" />
        <span>{statusLabel[status] ?? t.guideDetail.generatingStatus}</span>
      </div>
    </div>
  );

  return null;
}

/* ── Guest upgrade modal ─────────────────────────────────────────────── */
function GuestUpgradeModal({
  onClose,
  title,
  description,
  ctaLabel,
}: {
  onClose: () => void;
  title?: string;
  description?: string;
  ctaLabel?: string;
}) {
  const t = useT();
  return (
    <div className="simg-modal" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="guest-upgrade-modal" onClick={e => e.stopPropagation()}>
        <button className="guest-upgrade-close" onClick={onClose}>✕</button>
        <div className="guest-upgrade-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 11V7a4 4 0 118 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="guest-upgrade-title">{title ?? t.guideDetail.createAccountToContinue}</h3>
        <p className="guest-upgrade-desc">{description ?? t.guideDetail.upgradeDesc}</p>
        <div className="guest-upgrade-actions">
          <Link href="/auth/signup" className="guest-upgrade-cta">{ctaLabel ?? t.guideDetail.createFreeAccount}</Link>
          <Link href="/auth/login" className="guest-upgrade-ghost">{t.guideDetail.signIn}</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Ask AI panel ────────────────────────────────────────────────────── */
function AskAiPanel({ step, guideId, isGuest }: { step: RepairStep; guideId: string; isGuest?: boolean }) {
  const t = useT();
  const [open, setOpen]         = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  async function ask() {
    if (loading) return;
    const q = question.trim();
    if (!q) return;

    if (isGuest) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true); setAnswer(null);
    try {
      const res = await webApi.askGuideStep(guideId, step.id, q, getLocale());
      setAnswer(res.answer);
    } catch {
      if (isGuest) {
        setShowUpgrade(true);
      } else {
        setAnswer(t.guideDetail.aiExplanationError);
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="ask-ai-wrap">
      {showUpgrade && (
        <GuestUpgradeModal
          onClose={() => setShowUpgrade(false)}
          title={t.guideDetail.availableInPro}
          description={t.guideDetail.askAiUpgradeDesc}
          ctaLabel={t.guideDetail.startFreeTrial}
        />
      )}
      {!open ? (
        <button className="ask-ai-btn" onClick={() => setOpen(true)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1l1.12 3.44H11L8.44 6.56 9.56 10 6 7.88 2.44 10l1.12-3.44L1 4.44h3.88L6 1z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
          </svg>
          {t.guideDetail.askAiAboutStep}
        </button>
      ) : (
        <div className="ask-ai-panel">
          <div className="ask-ai-panel-hd">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1.5c2.76 0 5 2.01 5 4.5 0 1.56-.85 2.94-2.14 3.76L9 11.5l-1.5-.75A5.4 5.4 0 016.5 11c-2.76 0-5-2.01-5-4.5s2.24-4.5 5-4.5z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
              <path d="M6.5 5v1.5M6.5 8.5v.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
            {t.guideDetail.askAi}
            <button className="ask-ai-close" onClick={() => { setOpen(false); setAnswer(null); setQuestion(''); }}>✕</button>
          </div>
          <div className="ask-ai-input-row">
            <input
              className="ask-ai-input"
              placeholder={t.guideDetail.askPlaceholder}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ask()}
              autoFocus
            />
            <button className="ask-ai-submit" onClick={ask} disabled={loading}>
              {loading ? <span className="gen-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : t.guideDetail.ask}
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
function StepCard({ step, index, active, onActivate, guideId, stepRef, isGuest }: {
  step: RepairStep; index: number; active: boolean; onActivate: () => void; guideId: string;
  stepRef: React.RefObject<HTMLDivElement>; isGuest?: boolean;
}) {
  const t = useT();
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
          <div>
            <StepImage step={step} canRegenerate={!isGuest} />
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
                    {t.guideDetail.torque}: {step.torqueValue}
                  </div>
                )}
              </div>
            )}
            <AskAiPanel step={step} guideId={guideId} isGuest={isGuest} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Guide detail page ────────────────────────────────────────────────── */
export default function GuideDetailPage() {
  const t = useT();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const locale = getLocale();
  const [guide, setGuide]         = useState<RepairGuide | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [toolsOpen, setToolsOpen]   = useState(false);
  const stepRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);

  useEffect(() => {
    if (!params.id) return;
    setGuide(null);
    setError(null);
    webApi.getGuide(params.id, locale)
      .then((nextGuide) => {
        setGuide(nextGuide);
        if (nextGuide.source !== 'demo' && nextGuide.id && nextGuide.id !== params.id) {
          router.replace(`/guides/${nextGuide.id}`);
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [locale, params.id, router]);

  useEffect(() => {
    const ref = stepRefs.current[activeStep];
    if (!ref?.current) return;
    const t = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    return () => clearTimeout(t);
  }, [activeStep]);

  if (error) return (
    <div className="dash-root">
      <header className="dash-nav">
        <div className="dash-nav-inner">
          <Link href="/dashboard" className="dash-logo">Motixi</Link>
          <div className="dash-nav-right">
            <Link href="/dashboard" className="dash-nav-back">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {t.guideDetail.backToGuides}
            </Link>
          </div>
        </div>
      </header>
      <div className="gd-center" style={{ flexDirection: 'column', gap: 16, textAlign: 'center' }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.4 }}>
          <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2"/>
          <path d="M24 16v10M24 30v2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <p className="gd-error-msg" style={{ margin: 0 }}>{error}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>{t.guideDetail.errorLoadMsg}</p>
        <Link href="/dashboard" className="auth-btn-primary" style={{ display: 'inline-flex', width: 'auto', padding: '0 24px', marginTop: 8 }}>{t.guideDetail.backToGuides}</Link>
      </div>
    </div>
  );

  if (!guide) return (
    <div className="dash-root">
      <header className="dash-nav"><Link href="/dashboard" className="dash-logo">Motixi</Link><Link href="/dashboard" className="dash-nav-back">← {t.guideDetail.backToGuides}</Link></header>
      <div className="gd-center"><span className="gen-spinner gen-spinner--lg" /><p style={{color:'var(--text-muted)',marginTop:12}}>{t.common.loading}</p></div>
    </div>
  );

  const steps = guide.steps ?? [];
  const isGuest = guide.source === 'demo';

  if (stepRefs.current.length !== steps.length) {
    stepRefs.current = steps.map((_, i) => stepRefs.current[i] ?? createRef<HTMLDivElement>());
  }

  const TOOLS_DEFAULT = 4;
  const toolsVisible = toolsOpen ? guide.tools : guide.tools?.slice(0, TOOLS_DEFAULT);
  const toolsExtra   = (guide.tools?.length ?? 0) - TOOLS_DEFAULT;
  const pct = Math.round(((activeStep + 1) / Math.max(steps.length, 1)) * 100);

  return (
    <div className="dash-root">
      <header className="dash-nav">
        <div className="dash-nav-inner">
          <Link href="/dashboard" className="dash-logo">Motixi</Link>
          <div className="dash-nav-right">
            <Link href="/dashboard" className="dash-nav-back">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {t.guideDetail.backToGuides}
            </Link>
          </div>
        </div>
      </header>

      <div className="gd-layout">
        <main className="gd-main">
          <div className="gd-mob-head">
            <div className="gd-chip-row">
              <span className={`badge ${difficultyBadgeClass(guide.difficulty)}`}>{guide.difficulty}</span>
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
            <span className="gd-steps-label">{t.guideDetail.procedure}</span>
            <span className="gd-steps-count">{steps.length} {t.common.steps}</span>
          </div>

          <div className="gd-steps-list">
            {steps.map((step, i) => (
              <StepCard
                key={step.id} step={step} index={i}
                active={activeStep === i}
                onActivate={() => setActiveStep(i)}
                guideId={guide.id}
                stepRef={stepRefs.current[i]}
                isGuest={isGuest}
              />
            ))}
          </div>
        </main>

        <aside className="gd-sidebar">
          <div className="gd-sb-card">
            <div className="gd-chip-row">
              <span className={`badge ${difficultyBadgeClass(guide.difficulty)}`}>{guide.difficulty}</span>
              {guide.timeEstimate && (
                <span className="gd-chip">
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.2" stroke="currentColor" strokeWidth="1.1"/><path d="M5.5 3.5v2l1.3.9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  {guide.timeEstimate}
                </span>
              )}
              <span className="gd-chip">{guide.vehicle.model}</span>
            </div>
            <h2 className="gd-sb-title">{guide.title}</h2>
            <p className="gd-sb-sub">{guide.part.name} · {steps.length} {t.common.steps}</p>
            <div className="gd-ai-meta">
              <span className="ai-source-chip">{t.guideDetail.aiGeneratedLabel}</span>
            </div>
            <div className="gd-prog-track">
              <div className="gd-prog-fill" style={{ width: `${pct}%` }} />
            </div>
            <p className="gd-prog-label">{t.guideDetail.step} {activeStep + 1} {t.guideDetail.stepOf} {steps.length}</p>
          </div>

          {guide.tools && guide.tools.length > 0 && (
            <div className="gd-sb-card">
              <p className="gd-sb-section">{t.guideDetail.toolsRequired}</p>
              <div className="gd-tools">
                {toolsVisible?.map((tool) => <span key={tool} className="gd-tool">{tool}</span>)}
                {!toolsOpen && toolsExtra > 0 && (
                  <button className="gd-tool gd-tool--more" onClick={() => setToolsOpen(true)}>+{toolsExtra} {t.guideDetail.moreTools}</button>
                )}
                {toolsOpen && (
                  <button className="gd-tool gd-tool--more" onClick={() => setToolsOpen(false)}>{t.guideDetail.showLess} ↑</button>
                )}
              </div>
            </div>
          )}

          {guide.safetyNotes && guide.safetyNotes.length > 0 && (
            <div className={`gd-safety${safetyOpen ? ' gd-safety--open' : ''}`}>
              <button className="gd-safety-btn" onClick={() => setSafetyOpen(o => !o)}>
                <span className="gd-safety-ico">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5L11.5 4.5V8c0 2.2-2 4.2-5 5C2 12.2.5 10.2.5 8V4.5L6.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M4.5 7l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <span className="gd-safety-ttl">
                  {safetyOpen ? t.guideDetail.safetyNotes : `${guide.safetyNotes.length} ${t.guideDetail.nSafetyNotes}`}
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

          <div className="gd-sb-card gd-nav">
            <button className="gd-nav-prev" disabled={activeStep === 0} onClick={() => setActiveStep(s => s - 1)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {t.guideDetail.prev}
            </button>
            <span className="gd-nav-pos">{activeStep + 1} / {steps.length}</span>
            {activeStep >= steps.length - 1 ? (
              <Link href="/dashboard" className="gd-nav-next gd-nav-done">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {t.guideDetail.done}
              </Link>
            ) : (
              <button className="gd-nav-next" onClick={() => setActiveStep(s => s + 1)}>
                {t.guideDetail.next}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
          </div>

        </aside>
      </div>
    </div>
  );
}
