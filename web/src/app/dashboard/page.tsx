'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { AnalyticsData, GuideRequest, ManualDocument, RepairGuide, RepairJob, VehicleWithHistory } from '@motixai/shared';
import { webApi } from '@/lib/api';
import SmartGuideForm from './_guide-form';
import Sidebar, { type DashView } from './_sidebar';

// ── JWT helpers ───────────────────────────────────────────────────────────────

function readJwt(): { role: string; email: string } {
  try {
    const token = localStorage.getItem('motix_access_token');
    if (!token) return { role: 'USER', email: '' };
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(
      Math.ceil(token.split('.')[1].length / 4) * 4, '='
    );
    const p = JSON.parse(atob(b64)) as { role?: string; email?: string; sub?: string };
    return { role: p.role ?? 'USER', email: p.email ?? p.sub ?? '' };
  } catch {
    return { role: 'USER', email: '' };
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function guideStatusDot(guide: RepairGuide): 'green' | 'yellow' | 'red' {
  const steps = guide.steps ?? [];
  if (steps.length === 0) return 'green';
  if (steps.some((s) => s.imageStatus === 'failed')) return 'red';
  if (steps.some((s) => s.imageStatus !== 'ready' && s.imageStatus !== 'none' && s.imageStatus !== 'failed')) return 'yellow';
  return 'green';
}

// ── Guide list with search + filter ──────────────────────────────────────────

function GuidesView({
  guides, loading, error, submitting, guideError, vehicles, analytics,
  onCreateGuide, onDeleteGuide, onNewGuide, deleting, isEnterprise,
}: {
  guides: RepairGuide[];
  loading: boolean;
  error: string | null;
  submitting: boolean;
  guideError: string | null;
  vehicles: VehicleWithHistory[];
  analytics: AnalyticsData | null;
  onCreateGuide: (data: { vehicleModel: string; vin?: string; partName: string; oemNumber?: string }) => Promise<void>;
  onDeleteGuide: (id: string) => void;
  onNewGuide: () => void;
  deleting: string | null;
  isEnterprise: boolean;
}) {
  const [search, setSearch] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [sort, setSort] = useState<'recent' | 'alpha'>('recent');

  const filtered = useMemo(() => {
    let list = [...guides];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((g) =>
        g.title.toLowerCase().includes(q) ||
        g.vehicle.model.toLowerCase().includes(q) ||
        g.part.name.toLowerCase().includes(q)
      );
    }
    if (filterDiff) list = list.filter((g) => g.difficulty === filterDiff);
    if (sort === 'alpha') list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [guides, search, filterDiff, sort]);

  const difficultyColor: Record<string, string> = {
    Beginner: 'badge--green', Intermediate: 'badge--yellow',
    Advanced: 'badge--orange', Expert: 'badge--red',
    easy: 'badge--green', medium: 'badge--yellow', hard: 'badge--red',
  };

  return (
    <div className="dv-guides">
      {/* Header */}
      <div className="dv-header">
        <div>
          <h1 className="dv-title">Guides</h1>
          <p className="dv-sub">Your AI-generated repair guides</p>
        </div>
        <button className="dv-new-btn" onClick={onNewGuide}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New Guide
        </button>
      </div>

      {/* Analytics widgets */}
      {analytics && (
        <div className="analytics-row">
          {[
            { label: 'This month', value: String(analytics.guidesThisMonth) },
            { label: 'Time saved', value: `${Math.round(analytics.timeSavedMinutes / 60)}h` },
            { label: 'Vehicles', value: String(analytics.activeVehicles) },
            { label: 'Top repair', value: analytics.mostCommonRepairs[0]?.partName ?? '—' },
          ].map((w) => (
            <div key={w.label} className="analytics-widget">
              <p className="analytics-value">{w.value}</p>
              <p className="analytics-label">{w.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + filter toolbar */}
      <div className="glist-toolbar">
        <div className="glist-search-wrap">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="glist-search-icon">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            className="glist-search"
            placeholder="Search guides…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="glist-filter" value={filterDiff} onChange={(e) => setFilterDiff(e.target.value)}>
          <option value="">All difficulties</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
          <option value="Expert">Expert</option>
        </select>
        <select className="glist-filter" value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'alpha')}>
          <option value="recent">Most recent</option>
          <option value="alpha">A → Z</option>
        </select>
      </div>

      {/* Error */}
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
        {loading && guides.length === 0 ? (
          <div className="guide-list-empty">
            <span className="gen-spinner gen-spinner--lg" />
            <p>Loading guides…</p>
          </div>
        ) : filtered.length === 0 && search ? (
          <div className="guide-list-empty">
            <p className="guide-empty-title">No results for "{search}"</p>
            <p className="guide-empty-sub">Try a different search term.</p>
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
            <p className="guide-empty-sub">Click <strong>New Guide</strong> to generate your first AI-powered repair guide.</p>
          </div>
        ) : (
          filtered.map((guide) => {
            const dot = guideStatusDot(guide);
            return (
              <div key={guide.id} className="guide-card guide-card--v2">
                <div className={`gcard-dot gcard-dot--${dot}`} title={dot === 'yellow' ? 'Images generating' : dot === 'red' ? 'Image generation failed' : 'Ready'} />
                <Link href={`/guides/${guide.id}`} className="guide-card-main">
                  <div className="guide-card-meta">
                    <span className={`badge ${difficultyColor[guide.difficulty] ?? 'badge--yellow'}`}>{guide.difficulty}</span>
                    <span className="guide-card-time">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M6 3.5v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {guide.timeEstimate ?? '—'}
                    </span>
                    <span className="guide-card-time">{guide.steps?.length ?? 0} steps</span>
                    <span className="guide-card-ts">{relativeTime(guide.createdAt)}</span>
                  </div>
                  <h2 className="guide-card-title">{guide.title}</h2>
                  <p className="guide-card-sub">
                    {guide.vehicle.model}
                    <span className="guide-card-dot">·</span>
                    {guide.part.name}
                  </p>
                </Link>
                <div className="guide-card-actions">
                  <button
                    className="guide-card-delete"
                    onClick={() => onDeleteGuide(guide.id)}
                    disabled={deleting === guide.id}
                    title="Delete guide"
                  >
                    {deleting === guide.id ? <span className="gen-spinner" /> : (
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
            );
          })
        )}
      </section>
    </div>
  );
}

// ── Garage view ───────────────────────────────────────────────────────────────

function GarageView({ vehicles, loading }: { vehicles: VehicleWithHistory[]; loading: boolean }) {
  return (
    <div className="dv-guides">
      <div className="dv-header">
        <div>
          <h1 className="dv-title">My Garage</h1>
          <p className="dv-sub">Vehicles from your repair history</p>
        </div>
      </div>
      {loading ? (
        <div className="guide-list-empty"><span className="gen-spinner gen-spinner--lg" /></div>
      ) : vehicles.length === 0 ? (
        <div className="guide-list-empty">
          <div className="guide-empty-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M4 21l4-10h16l4 10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <rect x="3" y="21" width="26" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="28" r="2" fill="currentColor"/>
              <circle cx="23" cy="28" r="2" fill="currentColor"/>
            </svg>
          </div>
          <p className="guide-empty-title">No vehicles yet</p>
          <p className="guide-empty-sub">Generate a guide to add a vehicle to your garage.</p>
        </div>
      ) : (
        <div className="vehicle-list">
          {vehicles.map((v) => (
            <div key={v.id} className="vehicle-card">
              <div className="vehicle-card-head">
                <div className="vehicle-card-icon">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3 11l2-5h8l2 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                    <rect x="2" y="11" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/>
                    <circle cx="5.5" cy="15" r="1" fill="currentColor"/>
                    <circle cx="12.5" cy="15" r="1" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <p className="vehicle-card-model">{v.model}</p>
                  {v.vin && <p className="vehicle-card-vin">VIN: {v.vin}</p>}
                </div>
                <div className="vehicle-card-counts">
                  <span className="vehicle-count-pill">{v.guides.length} guide{v.guides.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              {v.guides.length > 0 && (
                <div className="vehicle-history">
                  {v.guides.slice(0, 3).map((g) => (
                    <Link key={g.id} href={`/guides/${g.id}`} className="vehicle-history-item">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <rect x="2" y="1" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M4 4h4M4 6.5h4M4 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                      {g.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Jobs view ─────────────────────────────────────────────────────────────────

function JobsView({ vehicles }: { vehicles: VehicleWithHistory[] }) {
  const [jobs, setJobs] = useState<RepairJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    webApi.listJobs().then(setJobs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function createJob(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setCreating(true); setError(null);
    try {
      const job = await webApi.createJob({
        vehicleId: String(data.get('vehicleId')),
        problemDescription: String(data.get('problemDescription')),
        notes: String(data.get('notes') || ''),
      });
      setJobs((prev) => [job, ...prev]);
      form.reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally { setCreating(false); }
  }

  async function advanceStatus(id: string, status: 'pending' | 'in_progress' | 'completed') {
    try {
      const updated = await webApi.updateJob(id, { status });
      setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
    } catch { /* ignore */ }
  }

  const statusColor: Record<string, string> = { pending: 'badge--yellow', in_progress: 'badge--blue', completed: 'badge--green' };
  const statusLabel: Record<string, string> = { pending: 'Pending', in_progress: 'In progress', completed: 'Completed' };

  return (
    <div className="dv-guides">
      <div className="dv-header">
        <div><h1 className="dv-title">Jobs</h1><p className="dv-sub">Track active repair jobs</p></div>
      </div>
      <form onSubmit={createJob} className="gen-form">
        <div className="gen-form-header">
          <div className="gen-form-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <span className="gen-form-title">Log repair job</span>
        </div>
        <div className="gen-inputs">
          <div className="gen-input-wrap">
            <label className="gen-label">Vehicle <span className="gen-label-required">*</span></label>
            <select name="vehicleId" required className="gen-input gen-input--select">
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.model}{v.vin ? ` · ${v.vin}` : ''}</option>)}
            </select>
          </div>
          <div className="gen-input-wrap">
            <label className="gen-label">Problem description <span className="gen-label-required">*</span></label>
            <input name="problemDescription" required placeholder="e.g. Hydraulic pump failure" className="gen-input" />
          </div>
          <div className="gen-input-wrap">
            <label className="gen-label">Notes <span className="gen-label-or">optional</span></label>
            <input name="notes" placeholder="Additional context" className="gen-input" />
          </div>
        </div>
        {error && <div className="dash-error">{error}</div>}
        <button type="submit" disabled={creating} className="gen-btn">
          {creating ? <><span className="gen-spinner" /> Creating…</> : 'Create job'}
        </button>
      </form>
      <section className="guide-list" style={{ marginTop: 12 }}>
        {loading ? (
          <div className="guide-list-empty"><span className="gen-spinner gen-spinner--lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="guide-list-empty">
            <p className="guide-empty-title">No repair jobs yet</p>
            <p className="guide-empty-sub">Log your first job above.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="guide-card">
              <div className="guide-card-main">
                <div className="guide-card-meta">
                  <span className={`badge ${statusColor[job.status] ?? 'badge--yellow'}`}>{statusLabel[job.status] ?? job.status}</span>
                  <span className="guide-card-time">{job.vehicle.model}</span>
                </div>
                <h2 className="guide-card-title">{job.problemDescription}</h2>
                {job.guide && (
                  <p className="guide-card-sub">
                    Guide: <Link href={`/guides/${job.guide.id}`} className="job-guide-link">{job.guide.title}</Link>
                  </p>
                )}
              </div>
              <div className="guide-card-actions">
                {job.status === 'pending' && (
                  <button className="job-status-btn job-status-btn--start" onClick={() => advanceStatus(job.id, 'in_progress')}>Start</button>
                )}
                {job.status === 'in_progress' && (
                  <button className="job-status-btn job-status-btn--done" onClick={() => advanceStatus(job.id, 'completed')}>Complete</button>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// ── Requests view ─────────────────────────────────────────────────────────────

function RequestsView() {
  const [requests, setRequests] = useState<GuideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    webApi.listGuideRequests().then(setRequests).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function createRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setCreating(true); setError(null);
    try {
      const req = await webApi.createGuideRequest({
        vehicleModel: String(data.get('vehicleModel')),
        repairType: String(data.get('repairType')),
        partNumber: String(data.get('partNumber') || ''),
        notes: String(data.get('notes') || ''),
      });
      setRequests((prev) => [req, ...prev]);
      form.reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally { setCreating(false); }
  }

  const statusColor: Record<string, string> = { pending: 'badge--yellow', processing: 'badge--blue', completed: 'badge--green', rejected: 'badge--red' };

  return (
    <div className="dv-guides">
      <div className="dv-header">
        <div><h1 className="dv-title">Requests</h1><p className="dv-sub">Request guides for your fleet</p></div>
      </div>
      <form onSubmit={createRequest} className="gen-form">
        <div className="gen-form-header">
          <div className="gen-form-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <span className="gen-form-title">Request a guide</span>
        </div>
        <div className="gen-inputs">
          <div className="gen-input-wrap">
            <label className="gen-label">Vehicle model <span className="gen-label-required">*</span></label>
            <input name="vehicleModel" required placeholder="e.g. CAT 320D" className="gen-input" />
          </div>
          <div className="gen-input-wrap">
            <label className="gen-label">Repair type <span className="gen-label-required">*</span></label>
            <input name="repairType" required placeholder="e.g. Hydraulic system overhaul" className="gen-input" />
          </div>
          <div className="gen-input-wrap">
            <label className="gen-label">Part number <span className="gen-label-or">optional</span></label>
            <input name="partNumber" placeholder="e.g. 4633891" className="gen-input" />
          </div>
          <div className="gen-input-wrap">
            <label className="gen-label">Notes <span className="gen-label-or">optional</span></label>
            <input name="notes" placeholder="Additional context" className="gen-input" />
          </div>
        </div>
        {error && <div className="dash-error">{error}</div>}
        <button type="submit" disabled={creating} className="gen-btn">
          {creating ? <><span className="gen-spinner" /> Submitting…</> : 'Submit request'}
        </button>
      </form>
      <section className="guide-list" style={{ marginTop: 12 }}>
        {loading ? (
          <div className="guide-list-empty"><span className="gen-spinner gen-spinner--lg" /></div>
        ) : requests.length === 0 ? (
          <div className="guide-list-empty">
            <p className="guide-empty-title">No requests yet</p>
            <p className="guide-empty-sub">Submit a guide request above.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="guide-card">
              <div className="guide-card-main">
                <div className="guide-card-meta">
                  <span className={`badge ${statusColor[req.status] ?? 'badge--yellow'}`}>{req.status}</span>
                  <span className="guide-card-time">{req.vehicleModel}</span>
                </div>
                <h2 className="guide-card-title">{req.repairType}</h2>
                <p className="guide-card-sub">
                  {req.partNumber ? `Part: ${req.partNumber} · ` : ''}
                  {new Date(req.createdAt).toLocaleDateString()}
                </p>
                {req.guide && (
                  <Link href={`/guides/${req.guide.id}`} className="job-guide-link" style={{ fontSize: '0.82rem', marginTop: 4, display: 'block' }}>
                    Guide ready: {req.guide.title} →
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// ── Manuals view (Enterprise) ─────────────────────────────────────────────────

function ManualsView() {
  const [manuals, setManuals] = useState<ManualDocument[]>([]);
  const [generated, setGenerated] = useState<RepairGuide | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    webApi.listManuals().then(setManuals).catch(() => setManuals([]));
  }, []);

  async function uploadManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setUploadError(null); setUploading(true);
    try {
      const data = new FormData(form);
      const manual = await webApi.uploadManual({
        title: String(data.get('title')),
        fileUrl: String(data.get('fileUrl')),
        extractedText: String(data.get('extractedText') || ''),
        vehicleModel: String(data.get('vehicleModel') || ''),
      });
      setManuals((prev) => [manual, ...prev]);
      form.reset();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally { setUploading(false); }
  }

  async function createFromManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setGenError(null); setGenerating(true);
    try {
      const data = new FormData(form);
      const guide = await webApi.createEnterpriseGuide({
        manualId: String(data.get('manualId')),
        vehicleModel: String(data.get('vehicleModel')),
        partName: String(data.get('partName')),
        oemNumber: String(data.get('oemNumber') || ''),
      });
      setGenerated(guide);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    } finally { setGenerating(false); }
  }

  return (
    <div className="dv-guides">
      <div className="dv-header">
        <div>
          <h1 className="dv-title">Manuals Library</h1>
          <p className="dv-sub">Upload OEM manuals and generate guides from your own documentation</p>
        </div>
      </div>
      <div className="ent-grid">
        <form onSubmit={uploadManual} className="gen-form">
          <div className="gen-form-header">
            <div className="gen-form-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 12V4M6 7l3-3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="gen-form-title">Upload manual</span>
          </div>
          <div className="gen-inputs gen-inputs--col">
            <div className="gen-input-wrap">
              <label className="gen-label">Title <span className="gen-label-required">*</span></label>
              <input name="title" required placeholder="e.g. CAT 320D Service Manual" className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">PDF URL <span className="gen-label-required">*</span></label>
              <input name="fileUrl" required placeholder="https://example.com/manual.pdf" className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">Vehicle model <span className="gen-label-or">optional</span></label>
              <input name="vehicleModel" placeholder="e.g. CAT 320D" className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">Extracted text <span className="gen-label-or">optional</span></label>
              <textarea name="extractedText" placeholder="Paste relevant manual text…" className="gen-input gen-input--textarea" rows={4} />
            </div>
          </div>
          {uploadError && <div className="dash-error">{uploadError}</div>}
          <button type="submit" disabled={uploading} className="gen-btn">
            {uploading ? <><span className="gen-spinner" /> Saving…</> : 'Save manual'}
          </button>
        </form>

        <form onSubmit={createFromManual} className="gen-form">
          <div className="gen-form-header">
            <div className="gen-form-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="gen-form-title">Generate from manual</span>
          </div>
          <div className="gen-inputs gen-inputs--col">
            <div className="gen-input-wrap">
              <label className="gen-label">Manual <span className="gen-label-required">*</span></label>
              <select name="manualId" required className="gen-input gen-input--select">
                <option value="">Select manual…</option>
                {manuals.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">Vehicle model <span className="gen-label-required">*</span></label>
              <input name="vehicleModel" required placeholder="e.g. CAT 320D" className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">Part name <span className="gen-label-required">*</span></label>
              <input name="partName" required placeholder="e.g. Hydraulic Pump" className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">OEM number <span className="gen-label-or">optional</span></label>
              <input name="oemNumber" placeholder="e.g. 4633891" className="gen-input" />
            </div>
          </div>
          {genError && <div className="dash-error">{genError}</div>}
          <button type="submit" disabled={generating} className="gen-btn">
            {generating ? <><span className="gen-spinner" /> Generating…</> : <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 8H3M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Generate guide
            </>}
          </button>
          {generated && (
            <Link href={`/guides/${generated.id}`} className="ent-generated-link">
              Guide ready: {generated.title} →
            </Link>
          )}
        </form>
      </div>

      <section className="guide-list" style={{ marginTop: 24 }}>
        <p className="ent-section-title">Uploaded manuals ({manuals.length})</p>
        {manuals.length === 0 ? (
          <div className="guide-list-empty">
            <p className="guide-empty-title">No manuals uploaded</p>
            <p className="guide-empty-sub">Upload a PDF manual above to get started.</p>
          </div>
        ) : (
          manuals.map((m) => (
            <div key={m.id} className="guide-card">
              <div className="guide-card-main">
                <div className="guide-card-meta">
                  <span className="badge badge--green">Manual</span>
                  <span className="guide-card-time">{new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
                <h2 className="guide-card-title">{m.title}</h2>
                <p className="guide-card-sub">{m.fileUrl}</p>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// ── Settings view ─────────────────────────────────────────────────────────────

function SettingsView({ email, isEnterprise, guidesUsed, guidesLimit }: {
  email: string; isEnterprise: boolean; guidesUsed: number; guidesLimit: number;
}) {
  return (
    <div className="dv-guides">
      <div className="dv-header">
        <div><h1 className="dv-title">Settings</h1><p className="dv-sub">Account and billing</p></div>
      </div>
      <div className="settings-grid">
        <div className="gen-form">
          <div className="gen-form-header">
            <div className="gen-form-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M3 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="gen-form-title">Account</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">Email</span>
            <span className="settings-value">{email}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">Plan</span>
            <span className="settings-value">{isEnterprise ? 'Enterprise' : 'Free'}</span>
          </div>
          <Link href="/profile" className="gen-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
            Edit profile →
          </Link>
        </div>

        {!isEnterprise && (
          <div className="gen-form">
            <div className="gen-form-header">
              <div className="gen-form-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 12l3-9 4 6 3-3 4 6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="gen-form-title">Usage</span>
            </div>
            <div className="plan-usage-row">
              <div className="plan-usage-labels">
                <span>Guides this month</span>
                <span>{guidesUsed} / {guidesLimit}</span>
              </div>
              <div className="plan-usage-track">
                <div
                  className={`plan-usage-bar${guidesUsed >= guidesLimit ? ' plan-usage-bar--full' : ''}`}
                  style={{ width: `${Math.min(100, guidesUsed / guidesLimit * 100)}%` }}
                />
              </div>
            </div>
            <div className="plan-upgrade-card">
              <p className="plan-upgrade-title">⚡ Upgrade to Pro — $39/mo</p>
              <ul className="plan-upgrade-list">
                <li>Unlimited guides</li>
                <li>Priority image generation</li>
                <li>Mobile app access</li>
                <li>API access</li>
              </ul>
              <button className="gen-btn" style={{ marginTop: 12 }}>Upgrade now →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── New Guide full-screen view ────────────────────────────────────────────────

function NewGuideView({
  submitting, guideError, onSubmit, onBack, initialQuery,
}: {
  submitting: boolean;
  guideError: string | null;
  onSubmit: (data: { vehicleModel: string; vin?: string; partName: string; oemNumber?: string }) => Promise<void>;
  onBack: () => void;
  initialQuery?: string;
}) {
  return (
    <div className="ng-root">
      <div className="ng-topbar">
        <button className="ng-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Guides
        </button>
        <span className="ng-topbar-logo">MotixAI</span>
        <div style={{ width: 120 }} />
      </div>
      <div className="ng-body">
        <div className="ng-form-wrap">
          <SmartGuideForm onSubmit={onSubmit} submitting={submitting} error={guideError} initialQuery={initialQuery} />
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard page ───────────────────────────────────────────────────────

export default function DashboardPage() {
  const [view, setView] = useState<DashView>('guides');
  const [initialQuery, setInitialQuery] = useState<string | undefined>(undefined);
  const [guides, setGuides] = useState<RepairGuide[]>([]);
  const [vehicles, setVehicles] = useState<VehicleWithHistory[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Handle ?q= URL param — open new guide form with pre-filled query
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) {
      setInitialQuery(q);
      setView('new-guide');
      // Clean the URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Read plan from JWT
  const [userInfo, setUserInfo] = useState({ role: 'USER', email: '' });
  useEffect(() => { setUserInfo(readJwt()); }, []);

  const isEnterprise = userInfo.role === 'ENTERPRISE_ADMIN';
  const email = userInfo.email;
  const initials = email ? email[0].toUpperCase() : 'U';
  const guidesUsed = analytics?.guidesThisMonth ?? 0;
  const guidesLimit = isEnterprise ? Infinity : 5;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      webApi.listGuides(),
      webApi.listVehicles().catch(() => [] as VehicleWithHistory[]),
      webApi.getAnalytics().catch(() => null),
    ]).then(([g, v, a]) => {
      setGuides(g); setVehicles(v); setAnalytics(a);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }).finally(() => setLoading(false));
  }, []);

  async function createGuide(data: {
    vehicleModel: string;
    vin?: string;
    partName: string;
    oemNumber?: string;
    sourceInput?: { make: string; model: string; year: number; component: string; taskType: import('@motixai/shared').TaskType };
  }) {
    setSubmitting(true);
    setGuideError(null);
    try {
      const created = data.sourceInput
        ? await webApi.createSourceGuide(data.sourceInput)
        : await webApi.createGuide({
            vin: data.vin ?? '',
            vehicleModel: data.vehicleModel,
            partName: data.partName,
            oemNumber: data.oemNumber ?? '',
          });
      setGuides((prev) => [created, ...prev]);
      webApi.listVehicles().then(setVehicles).catch(() => {});
      webApi.getAnalytics().then(setAnalytics).catch(() => {});
      setView('guides');
    } catch (err: unknown) {
      setGuideError(err instanceof Error ? err.message : 'Failed to create guide');
      throw err;
    } finally { setSubmitting(false); }
  }

  async function deleteGuide(id: string) {
    setDeleting(id);
    try {
      await webApi.deleteGuide(id);
      setGuides((prev) => prev.filter((g) => g.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete guide');
    } finally { setDeleting(null); }
  }

  // Full-screen new guide mode — no sidebar
  if (view === 'new-guide') {
    return (
      <NewGuideView
        submitting={submitting}
        guideError={guideError}
        onSubmit={createGuide}
        onBack={() => { setGuideError(null); setInitialQuery(undefined); setView('guides'); }}
        initialQuery={initialQuery}
      />
    );
  }

  return (
    <div className="ds-shell">
      {/* Mobile top bar */}
      <div className="ds-mobile-bar">
        <button className="ds-hamburger" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
        <span className="ds-mobile-logo">MotixAI</span>
        <button className="ds-mobile-new" onClick={() => setView('new-guide')}>+</button>
      </div>

      <Sidebar
        view={view}
        onView={setView}
        isEnterprise={isEnterprise}
        initials={initials}
        email={email}
        guideCount={guides.length}
        guidesUsed={guidesUsed}
        guidesLimit={guidesLimit === Infinity ? 999 : guidesLimit}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main className="ds-main">
        {view === 'guides' && (
          <GuidesView
            guides={guides}
            loading={loading}
            error={error}
            submitting={submitting}
            guideError={guideError}
            vehicles={vehicles}
            analytics={analytics}
            onCreateGuide={createGuide}
            onDeleteGuide={deleteGuide}
            onNewGuide={() => setView('new-guide')}
            deleting={deleting}
            isEnterprise={isEnterprise}
          />
        )}
        {view === 'garage' && <GarageView vehicles={vehicles} loading={loading} />}
        {view === 'jobs' && isEnterprise && <JobsView vehicles={vehicles} />}
        {view === 'requests' && isEnterprise && <RequestsView />}
        {view === 'manuals' && isEnterprise && <ManualsView />}
        {view === 'settings' && (
          <SettingsView email={email} isEnterprise={isEnterprise} guidesUsed={guidesUsed} guidesLimit={guidesLimit === Infinity ? 9999 : guidesLimit} />
        )}
      </main>
    </div>
  );
}
