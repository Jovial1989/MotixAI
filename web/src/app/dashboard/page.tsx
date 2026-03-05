'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import type { RepairGuide } from '@motixai/shared';
import { webApi } from '@/lib/api';

export default function DashboardPage() {
  const [guides, setGuides]     = useState<RepairGuide[]>([]);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    webApi
      .listGuides()
      .then(setGuides)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function createGuide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    setError(null);
    try {
      const data    = new FormData(form);
      const created = await webApi.createGuide({
        vin:          String(data.get('vin') || ''),
        vehicleModel: String(data.get('vehicleModel') || ''),
        partName:     String(data.get('partName')),
        oemNumber:    String(data.get('oemNumber') || ''),
      });
      setGuides((prev) => [created, ...prev]);
      form.reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create guide');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteGuide(id: string) {
    setDeleting(id);
    try {
      await webApi.deleteGuide(id);
      setGuides((prev) => prev.filter((g) => g.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete guide');
    } finally {
      setDeleting(null);
    }
  }

  const difficultyColor: Record<string, string> = {
    Beginner:     'badge--green',
    Intermediate: 'badge--yellow',
    Advanced:     'badge--orange',
    Expert:       'badge--red',
  };

  return (
    <div className="dash-root">
      {/* Top nav */}
      <header className="dash-nav">
        <span className="dash-logo">MotixAI</span>
        <div className="dash-nav-right">
          <Link href="/enterprise" className="dash-nav-link">Enterprise</Link>
          <button
            className="dash-nav-link dash-nav-link--logout"
            onClick={() => { localStorage.removeItem('motix_access_token'); location.href = '/auth/login'; }}
          >
            Log out
          </button>
        </div>
      </header>

      <div className="dash-body">
        {/* Page title */}
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">Repair Guides</h1>
            <p className="dash-page-sub">Generate AI-powered workshop-grade guides instantly.</p>
          </div>
          <span className="dash-guide-count">{guides.length} guide{guides.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Generator form */}
        <form onSubmit={createGuide} className="gen-form">
          <div className="gen-form-header">
            <div className="gen-form-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="gen-form-title">Generate new guide</span>
          </div>
          <div className="gen-inputs">
            <div className="gen-input-wrap">
              <label className="gen-label">VIN</label>
              <input name="vin" placeholder="e.g. 1HGBH41JXMN109186" className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">Vehicle model <span className="gen-label-or">or use VIN</span></label>
              <input name="vehicleModel" placeholder="e.g. CAT 320D, Ford F-150" className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">Part name <span className="gen-label-required">*</span></label>
              <input name="partName" placeholder="e.g. Hydraulic Pump" required className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">OEM number</label>
              <input name="oemNumber" placeholder="e.g. 4633891" className="gen-input" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="gen-btn">
            {submitting ? (
              <><span className="gen-spinner" /> Generating…</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13 8H3M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Generate Guide
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="dash-error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* Guide list */}
        <section className="guide-list">
          {loading ? (
            <div className="guide-list-empty">
              <div className="guide-spinner-wrap"><span className="gen-spinner gen-spinner--lg" /></div>
              <p>Loading guides…</p>
            </div>
          ) : guides.length === 0 ? (
            <div className="guide-list-empty">
              <div className="guide-empty-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="6" y="4" width="20" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M11 11h10M11 16h10M11 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="guide-empty-title">No guides yet</p>
              <p className="guide-empty-sub">Generate your first repair guide above.</p>
            </div>
          ) : (
            guides.map((guide) => (
              <div key={guide.id} className="guide-card">
                <Link href={`/guides/${guide.id}`} className="guide-card-main">
                  <div className="guide-card-meta">
                    <span className={`badge ${difficultyColor[guide.difficulty] ?? 'badge--yellow'}`}>
                      {guide.difficulty}
                    </span>
                    <span className="guide-card-time">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M6 3.5v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {guide.timeEstimate ?? '—'}
                    </span>
                  </div>
                  <h2 className="guide-card-title">{guide.title}</h2>
                  <p className="guide-card-sub">
                    {guide.vehicle.model}
                    <span className="guide-card-dot">·</span>
                    {guide.part.name}
                    <span className="guide-card-dot">·</span>
                    {guide.steps?.length ?? 0} steps
                  </p>
                </Link>
                <div className="guide-card-actions">
                  <button
                    className="guide-card-delete"
                    onClick={() => deleteGuide(guide.id)}
                    disabled={deleting === guide.id}
                    title="Delete guide"
                  >
                    {deleting === guide.id ? (
                      <span className="gen-spinner" />
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M2 4h11M6 4V2.5h3V4M5 4v8a1 1 0 001 1h3a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                  <Link href={`/guides/${guide.id}`} className="guide-card-arrow">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
