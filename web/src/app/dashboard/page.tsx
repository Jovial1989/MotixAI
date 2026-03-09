'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import type { AnalyticsData, GuideRequest, RepairGuide, RepairJob, VehicleWithHistory } from '@motixai/shared';
import { webApi } from '@/lib/api';
import SmartGuideForm from './_guide-form';

// ── Tab type ──────────────────────────────────────────────────────────────────
type Tab = 'guides' | 'jobs' | 'vehicles' | 'requests';

// ── Analytics row ─────────────────────────────────────────────────────────────
function AnalyticsRow({ data }: { data: AnalyticsData }) {
  const hours = Math.round(data.timeSavedMinutes / 60);
  const widgets = [
    {
      label: 'Guides this month',
      value: String(data.guidesThisMonth),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="3" y="2" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M6 6h6M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Est. time saved',
      value: `${hours}h`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M9 5.5V9l2.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: 'Active vehicles',
      value: String(data.activeVehicles),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M3 11l2-5h8l2 5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          <rect x="2" y="11" width="14" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/>
          <circle cx="5.5" cy="15" r="1" fill="currentColor"/>
          <circle cx="12.5" cy="15" r="1" fill="currentColor"/>
        </svg>
      ),
    },
    {
      label: 'Top repair',
      value: data.mostCommonRepairs[0]?.partName ?? '—',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M14 4l-3 3M4 14l3-3M9 9l3-3-1-4-4 1-3 3 4 4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="analytics-row">
      {widgets.map((w) => (
        <div key={w.label} className="analytics-widget">
          <div className="analytics-icon">{w.icon}</div>
          <div>
            <p className="analytics-value">{w.value}</p>
            <p className="analytics-label">{w.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Jobs tab ──────────────────────────────────────────────────────────────────
function JobsTab({ vehicles }: { vehicles: VehicleWithHistory[] }) {
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
    setCreating(true);
    setError(null);
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
    } finally {
      setCreating(false);
    }
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
    <div className="tab-content">
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
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.model}{v.vin ? ` · ${v.vin}` : ''}</option>
              ))}
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

// ── Vehicles tab ──────────────────────────────────────────────────────────────
function VehiclesTab() {
  const [vehicles, setVehicles] = useState<VehicleWithHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    webApi.listVehicles().then(setVehicles).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="tab-content">
      {loading ? (
        <div className="guide-list-empty"><span className="gen-spinner gen-spinner--lg" /></div>
      ) : vehicles.length === 0 ? (
        <div className="guide-list-empty">
          <p className="guide-empty-title">No vehicles yet</p>
          <p className="guide-empty-sub">Generate a guide to register a vehicle automatically.</p>
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
                  {v.repairJobs.length > 0 && (
                    <span className="vehicle-count-pill">{v.repairJobs.length} job{v.repairJobs.length !== 1 ? 's' : ''}</span>
                  )}
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

// ── Requests tab ──────────────────────────────────────────────────────────────
function RequestsTab() {
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
    setCreating(true);
    setError(null);
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
    } finally {
      setCreating(false);
    }
  }

  const statusColor: Record<string, string> = { pending: 'badge--yellow', processing: 'badge--blue', completed: 'badge--green', rejected: 'badge--red' };

  return (
    <div className="tab-content">
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

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>('guides');
  const [guides, setGuides] = useState<RepairGuide[]>([]);
  const [vehicles, setVehicles] = useState<VehicleWithHistory[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [guideError, setGuideError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      webApi.listGuides(),
      webApi.listVehicles().catch(() => [] as VehicleWithHistory[]),
      webApi.getAnalytics().catch(() => null),
    ]).then(([g, v, a]) => {
      setGuides(g);
      setVehicles(v);
      setAnalytics(a);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }).finally(() => setLoading(false));
  }, []);

  async function createGuide(data: { vehicleModel: string; vin?: string; partName: string; oemNumber?: string }) {
    setSubmitting(true);
    setGuideError(null);
    try {
      const created = await webApi.createGuide({
        vin: data.vin ?? '',
        vehicleModel: data.vehicleModel,
        partName: data.partName,
        oemNumber: data.oemNumber ?? '',
      });
      setGuides((prev) => [created, ...prev]);
      webApi.listVehicles().then(setVehicles).catch(() => {});
      webApi.getAnalytics().then(setAnalytics).catch(() => {});
    } catch (err: unknown) {
      setGuideError(err instanceof Error ? err.message : 'Failed to create guide');
      throw err; // re-throw so SmartGuideForm stays on step 3
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
    Beginner: 'badge--green', Intermediate: 'badge--yellow', Advanced: 'badge--orange', Expert: 'badge--red',
  };

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'guides', label: 'Guides' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'vehicles', label: 'Vehicles' },
    { id: 'requests', label: 'Requests' },
  ];

  return (
    <div className="dash-root">
      <header className="dash-nav">
        <Link href="/dashboard" className="dash-logo">MotixAI</Link>
        <div className="dash-nav-right">
          <Link href="/enterprise" className="dash-nav-link">Enterprise</Link>
          <Link href="/admin" className="dash-nav-link">Admin</Link>
          <button
            className="dash-nav-link dash-nav-link--logout"
            onClick={() => { localStorage.removeItem('motix_access_token'); location.href = '/auth/login'; }}
          >
            Log out
          </button>
        </div>
      </header>

      <div className="dash-body">
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">Repair Intelligence</h1>
            <p className="dash-page-sub">Guides, jobs, vehicles, and requests in one place.</p>
          </div>
          <span className="dash-guide-count">{guides.length} guide{guides.length !== 1 ? 's' : ''}</span>
        </div>

        {analytics && <AnalyticsRow data={analytics} />}

        <div className="tab-nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`tab-btn${activeTab === t.id ? ' tab-btn--active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
              {t.id === 'guides' && guides.length > 0 && <span className="tab-count">{guides.length}</span>}
            </button>
          ))}
        </div>

        {activeTab === 'guides' && (
          <div className="tab-content">
            <SmartGuideForm onSubmit={createGuide} submitting={submitting} error={guideError} />

            {error && (
              <div className="dash-error">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

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
                        <span className={`badge ${difficultyColor[guide.difficulty] ?? 'badge--yellow'}`}>{guide.difficulty}</span>
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
                        {guide.vehicle.model}<span className="guide-card-dot">·</span>
                        {guide.part.name}<span className="guide-card-dot">·</span>
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
                ))
              )}
            </section>
          </div>
        )}

        {activeTab === 'jobs' && <JobsTab vehicles={vehicles} />}
        {activeTab === 'vehicles' && <VehiclesTab />}
        {activeTab === 'requests' && <RequestsTab />}
      </div>
    </div>
  );
}
