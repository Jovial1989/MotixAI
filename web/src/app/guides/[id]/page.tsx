'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import type { RepairGuide, RepairStep } from '@motixai/shared';
import { webApi } from '@/lib/api';

function StepImage({ step, token, guideId }: { step: RepairStep; token: string | null; guideId: string }) {
  const [status, setStatus]   = useState(step.imageStatus ?? 'none');
  const [url, setUrl]         = useState(step.imageUrl ?? null);
  const [triggered, setTriggered] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Trigger generation on mount if not done
  useEffect(() => {
    if (!token || triggered || status === 'ready') return;
    setTriggered(true);
    webApi.generateStepImage(step.id, false).then((res) => {
      setStatus(res.imageStatus);
      if (res.imageUrl) setUrl(res.imageUrl);
    }).catch(() => {});
  }, [step.id, token, triggered, status]);

  // Poll while in progress
  useEffect(() => {
    if (status !== 'queued' && status !== 'generating') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(async () => {
      try {
        const guide = await webApi.getGuide(guideId);
        const fresh = guide?.steps?.find((s: RepairStep) => s.id === step.id);
        if (fresh) {
          setStatus(fresh.imageStatus ?? 'none');
          if (fresh.imageUrl) { setUrl(fresh.imageUrl); }
        }
      } catch { /* ignore */ }
    }, 4000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status, step.id, guideId]);

  if (status === 'ready' && url) {
    return (
      <div className="step-img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={step.title} className="step-img" />
      </div>
    );
  }
  if (status === 'queued' || status === 'generating') {
    return (
      <div className="step-img-skeleton">
        <div className="step-img-skeleton-inner">
          <span className="gen-spinner gen-spinner--md" />
          <span>Generating diagram…</span>
        </div>
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="step-img-failed">
        <span>⚠ Diagram unavailable</span>
      </div>
    );
  }
  return null;
}

export default function GuideDetailPage() {
  const params              = useParams<{ id: string }>();
  const [guide, setGuide]   = useState<RepairGuide | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [token, setToken]   = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('motix_access_token'));
  }, []);

  useEffect(() => {
    if (!params.id) return;
    webApi
      .getGuide(params.id)
      .then(setGuide)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load guide'));
  }, [params.id]);

  if (error) return (
    <div className="dash-root">
      <div className="guide-error">{error}</div>
    </div>
  );

  if (!guide) return (
    <div className="dash-root">
      <div className="guide-loading">
        <span className="gen-spinner gen-spinner--lg" />
        <p>Loading guide…</p>
      </div>
    </div>
  );

  const difficultyColor: Record<string, string> = {
    Beginner: 'badge--green', Intermediate: 'badge--yellow',
    Advanced: 'badge--orange', Expert: 'badge--red',
  };

  return (
    <div className="dash-root">
      <header className="dash-nav">
        <span className="dash-logo">MotixAI</span>
        <Link href="/dashboard" className="dash-nav-back">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          All guides
        </Link>
      </header>

      <div className="dash-body dash-body--narrow">
        {/* Guide header */}
        <div className="guide-header">
          <div className="guide-header-badges">
            <span className={`badge ${difficultyColor[guide.difficulty] ?? 'badge--yellow'}`}>{guide.difficulty}</span>
            {guide.timeEstimate && (
              <span className="guide-header-time">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M6.5 4v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                {guide.timeEstimate}
              </span>
            )}
            <span className="guide-header-steps">{guide.steps?.length ?? 0} steps</span>
          </div>
          <h1 className="guide-title">{guide.title}</h1>
          <p className="guide-vehicle">{guide.vehicle.model} · {guide.part.name}</p>
        </div>

        {/* Tools + Safety side-by-side */}
        <div className="guide-info-row">
        {guide.tools && guide.tools.length > 0 && (
          <div className="guide-tools-card" style={{ marginBottom: 0 }}>
            <h2 className="guide-section-title">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M10 2L13 5L6 12L2 13L3 9L10 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              Tools required
            </h2>
            <div className="guide-tools-list">
              {guide.tools.map((tool: string) => (
                <span key={tool} className="guide-tool-chip">{tool}</span>
              ))}
            </div>
          </div>
        )}

        {guide.safetyNotes && guide.safetyNotes.length > 0 && (
          <div className="guide-safety-card" style={{ marginBottom: 0 }}>
            <h2 className="guide-section-title guide-section-title--safety">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 2L13 5v4c0 2.8-2.2 5-5.5 6C2.2 14 0 11.8 0 9V5L7.5 2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M5 7.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Safety notes
            </h2>
            <ul className="guide-safety-list">
              {guide.safetyNotes.map((note: string) => (
                <li key={note} className="guide-safety-item">{note}</li>
              ))}
            </ul>
          </div>
        )}
        </div>{/* /guide-info-row */}

        {/* Steps */}
        <div className="guide-steps-header">
          <h2 className="guide-section-title">Procedure</h2>
        </div>
        <div className="guide-steps">
          {guide.steps?.map((step: RepairStep, idx: number) => (
            <div key={step.id} className="guide-step">
              <div className="guide-step-number">{idx + 1}</div>
              <div className="guide-step-content">
                <h3 className="guide-step-title">{step.title}</h3>
                <p className="guide-step-instruction">{step.instruction}</p>
                {step.torqueValue && (
                  <div className="guide-step-torque">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M4.5 8.5c1-2 3-2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Torque: {step.torqueValue}
                  </div>
                )}
                {step.warningNote && (
                  <div className="guide-step-warning">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M6.5 1L12.5 11.5H0.5L6.5 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                      <path d="M6.5 5v3M6.5 9.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    {step.warningNote}
                  </div>
                )}
                <StepImage step={step} token={token} guideId={params.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
