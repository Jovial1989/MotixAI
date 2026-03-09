'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { webApi } from '@/lib/api';

// Types returned by admin API endpoints (subset of full models)
interface AdminRequest {
  id: string;
  vehicleModel: string;
  repairType: string;
  partNumber: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  guide: { id: string; title: string } | null;
}

interface AdminGuide {
  id: string;
  title: string;
  status: string;
  difficulty: string;
  createdAt: string;
  vehicle: { model: string };
  part: { name: string };
  user: { email: string; fullName: string | null };
}

interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  createdAt: string;
}

type AdminTab = 'requests' | 'guides' | 'users';

// ── Request row ────────────────────────────────────────────────────────────────
function RequestRow({ req, onUpdate }: { req: AdminRequest; onUpdate: (updated: AdminRequest) => void }) {
  const [busy, setBusy] = useState(false);

  async function approve() {
    setBusy(true);
    try {
      const updated = await webApi.adminUpdateRequest(req.id, 'processing');
      onUpdate(updated as unknown as AdminRequest);
    } catch { /* ignore */ }
    finally { setBusy(false); }
  }

  async function reject() {
    setBusy(true);
    try {
      const updated = await webApi.adminUpdateRequest(req.id, 'rejected');
      onUpdate(updated as unknown as AdminRequest);
    } catch { /* ignore */ }
    finally { setBusy(false); }
  }

  const statusColor: Record<string, string> = {
    pending: 'badge--yellow', processing: 'badge--blue',
    completed: 'badge--green', rejected: 'badge--red',
  };

  return (
    <div className="admin-row">
      <div className="admin-row-main">
        <div className="guide-card-meta">
          <span className={`badge ${statusColor[req.status] ?? 'badge--yellow'}`}>{req.status}</span>
          <span className="guide-card-time">{req.vehicleModel}</span>
          <span className="guide-card-time">{new Date(req.createdAt).toLocaleDateString()}</span>
        </div>
        <p className="admin-row-title">{req.repairType}</p>
        <p className="guide-card-sub">
          {req.partNumber ? `Part: ${req.partNumber}` : 'No part number'}
          {req.notes ? ` · ${req.notes}` : ''}
        </p>
        {req.guide && (
          <Link href={`/guides/${req.guide.id}`} className="job-guide-link" style={{ fontSize: '0.82rem', marginTop: 2, display: 'inline-block' }}>
            Guide: {req.guide.title} →
          </Link>
        )}
      </div>
      {req.status === 'pending' && (
        <div className="admin-row-actions">
          <button className="job-status-btn job-status-btn--done" disabled={busy} onClick={approve}>Approve</button>
          <button className="admin-btn-reject" disabled={busy} onClick={reject}>Reject</button>
        </div>
      )}
    </div>
  );
}

// ── Guide row ─────────────────────────────────────────────────────────────────
function GuideRow({ guide, onUpdate }: { guide: AdminGuide; onUpdate: (updated: AdminGuide) => void }) {
  const [busy, setBusy] = useState(false);

  async function publish() {
    setBusy(true);
    try {
      const updated = await webApi.adminUpdateGuide(guide.id, { status: 'published' });
      onUpdate(updated as unknown as AdminGuide);
    } catch { /* ignore */ }
    finally { setBusy(false); }
  }

  async function archive() {
    setBusy(true);
    try {
      const updated = await webApi.adminUpdateGuide(guide.id, { status: 'archived' });
      onUpdate(updated as unknown as AdminGuide);
    } catch { /* ignore */ }
    finally { setBusy(false); }
  }

  const diffColor: Record<string, string> = {
    Beginner: 'badge--green', Intermediate: 'badge--yellow', Advanced: 'badge--orange', Expert: 'badge--red',
  };
  const statusColor: Record<string, string> = {
    draft: 'badge--yellow', published: 'badge--green', archived: 'badge--red',
  };

  return (
    <div className="admin-row">
      <div className="admin-row-main">
        <div className="guide-card-meta">
          <span className={`badge ${statusColor[guide.status] ?? 'badge--yellow'}`}>{guide.status}</span>
          <span className={`badge ${diffColor[guide.difficulty] ?? 'badge--yellow'}`}>{guide.difficulty}</span>
          <span className="guide-card-time">{new Date(guide.createdAt).toLocaleDateString()}</span>
        </div>
        <p className="admin-row-title">
          <Link href={`/guides/${guide.id}`} className="job-guide-link">{guide.title}</Link>
        </p>
        <p className="guide-card-sub">
          {guide.vehicle.model} · {guide.part.name}
          <span className="guide-card-dot">·</span>
          {guide.user.fullName ?? guide.user.email}
        </p>
      </div>
      <div className="admin-row-actions">
        {guide.status !== 'published' && (
          <button className="job-status-btn job-status-btn--done" disabled={busy} onClick={publish}>Publish</button>
        )}
        {guide.status !== 'archived' && (
          <button className="admin-btn-reject" disabled={busy} onClick={archive}>Archive</button>
        )}
      </div>
    </div>
  );
}

// ── User row ──────────────────────────────────────────────────────────────────
function UserRow({ user }: { user: AdminUser }) {
  const roleColor: Record<string, string> = {
    USER: 'badge--blue', ENTERPRISE_ADMIN: 'badge--orange', ADMIN: 'badge--red',
  };
  return (
    <div className="admin-row">
      <div className="admin-row-main">
        <div className="guide-card-meta">
          <span className={`badge ${roleColor[user.role] ?? 'badge--blue'}`}>{user.role}</span>
          <span className="guide-card-time">{new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
        <p className="admin-row-title">{user.fullName ?? '—'}</p>
        <p className="guide-card-sub">{user.email}</p>
      </div>
    </div>
  );
}

// ── Main admin page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('requests');
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [guides, setGuides] = useState<AdminGuide[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      webApi.adminListRequests().catch(() => [] as AdminRequest[]),
      webApi.adminListGuides().catch(() => [] as AdminGuide[]),
      webApi.adminListUsers().catch(() => [] as AdminUser[]),
    ]).then(([r, g, u]) => {
      setRequests(r as AdminRequest[]);
      setGuides(g as AdminGuide[]);
      setUsers(u as AdminUser[]);
    }).catch(() => {
      setError('Failed to load admin data. Make sure you have admin access.');
    }).finally(() => setLoading(false));
  }, []);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const tabs: Array<{ id: AdminTab; label: string; count?: number }> = [
    { id: 'requests', label: 'Guide Requests', count: pendingCount },
    { id: 'guides', label: 'All Guides', count: guides.length },
    { id: 'users', label: 'Users', count: users.length },
  ];

  return (
    <div className="dash-root">
      <header className="dash-nav">
        <Link href="/dashboard" className="dash-logo">MotixAI</Link>
        <div className="dash-nav-right">
          <Link href="/dashboard" className="dash-nav-link">← Dashboard</Link>
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
            <h1 className="dash-page-title">Admin Panel</h1>
            <p className="dash-page-sub">Manage guide requests, review guides, and oversee users.</p>
          </div>
          {pendingCount > 0 && (
            <span className="admin-pending-badge">{pendingCount} pending</span>
          )}
        </div>

        {error && (
          <div className="dash-error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <div className="tab-nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`tab-btn${tab === t.id ? ' tab-btn--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="tab-count">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="guide-list-empty">
            <span className="gen-spinner gen-spinner--lg" />
          </div>
        ) : (
          <div className="tab-content">
            {tab === 'requests' && (
              <section className="admin-list">
                {requests.length === 0 ? (
                  <div className="guide-list-empty">
                    <p className="guide-empty-title">No guide requests</p>
                    <p className="guide-empty-sub">Requests from users will appear here.</p>
                  </div>
                ) : (
                  requests.map((req) => (
                    <RequestRow
                      key={req.id}
                      req={req}
                      onUpdate={(updated) => setRequests((prev) => prev.map((r) => r.id === updated.id ? updated : r))}
                    />
                  ))
                )}
              </section>
            )}

            {tab === 'guides' && (
              <section className="admin-list">
                {guides.length === 0 ? (
                  <div className="guide-list-empty">
                    <p className="guide-empty-title">No guides</p>
                    <p className="guide-empty-sub">Generated guides will appear here.</p>
                  </div>
                ) : (
                  guides.map((g) => (
                    <GuideRow
                      key={g.id}
                      guide={g}
                      onUpdate={(updated) => setGuides((prev) => prev.map((x) => x.id === updated.id ? updated : x))}
                    />
                  ))
                )}
              </section>
            )}

            {tab === 'users' && (
              <section className="admin-list">
                {users.length === 0 ? (
                  <div className="guide-list-empty">
                    <p className="guide-empty-title">No users</p>
                    <p className="guide-empty-sub">Registered users will appear here.</p>
                  </div>
                ) : (
                  users.map((u) => <UserRow key={u.id} user={u} />)
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
