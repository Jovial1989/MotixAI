'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { AnalyticsData, GuideRequest, ManualDocument, RepairGuide, RepairJob, VehicleWithHistory } from '@motixai/shared';
import { webApi } from '@/lib/api';
import { useT, getLocale } from '@/lib/i18n';
import AuthGuard from '@/app/_auth-guard';
import SettingsLanguageSelector from '@/app/_settings-language-selector';
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

function relativeTime(iso: string, time: { justNow: string; minutesAgo: string; hoursAgo: string; yesterday: string; daysAgo: string }): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return time.justNow;
  if (m < 60) return `${m}${time.minutesAgo}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}${time.hoursAgo}`;
  const d = Math.floor(h / 24);
  if (d === 1) return time.yesterday;
  if (d < 7) return `${d}${time.daysAgo}`;
  return new Date(iso).toLocaleDateString();
}

function guideStatusDot(guide: RepairGuide): 'green' | 'yellow' | 'red' | null {
  const steps = (guide.steps ?? []).filter(Boolean);
  if (steps.length === 0) return null;
  if (steps.some((s) => s?.imageStatus === 'failed')) return 'red';
  if (steps.some((s) => s?.imageStatus !== 'ready' && s?.imageStatus !== 'none' && s?.imageStatus !== 'failed')) return 'yellow';
  // Only show green if at least one step has a ready image
  if (steps.some((s) => s?.imageStatus === 'ready')) return 'green';
  return null;
}

function difficultyBadgeClass(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (['beginner', 'початковий', 'начинаещ'].includes(normalized)) return 'badge--green';
  if (['intermediate', 'середній', 'средно ниво'].includes(normalized)) return 'badge--yellow';
  if (['advanced', 'просунутий', 'напреднал'].includes(normalized)) return 'badge--orange';
  if (['expert', 'експертний', 'експертно'].includes(normalized)) return 'badge--red';
  return 'badge--yellow';
}

function isPremiumGuideThumb(url: string | null | undefined): boolean {
  if (!url) return false;
  return !url.includes('/demo-guides/') && !url.includes('placehold.co') && !url.includes('fallback-illustration');
}

function detectVehicleType(model: string | undefined | null): 'suv' | 'truck' | 'van' | 'sedan' {
  if (!model) return 'sedan';
  const m = model.toLowerCase();
  if (/suv|land cruiser|4runner|rav4|qashqai|x3|x5|x7|tucson|sportage|cx-|tiguan|escape|explorer|cherokee|wrangler|outlander|forester|pilot|highlander|tahoe|suburban|blazer|bronco|defender|range rover|discovery|cayenne|q[357]|glc|gle|gls|xc[469]0/i.test(m)) return 'suv';
  if (/truck|pickup|f-150|f150|f-250|silverado|ram|tundra|tacoma|ranger|colorado|frontier|titan|ridgeline|maverick|gladiator|hilux|navara|amarok|l200|triton/i.test(m)) return 'truck';
  if (/van|transit|sprinter|metris|promaster|express|savana|caravan|sienna|odyssey|pacifica|carnival|staria|transporter|crafter|vito|ducato/i.test(m)) return 'van';
  return 'sedan';
}

type RepairCueType =
  | 'oil'
  | 'brakes'
  | 'turbo'
  | 'battery'
  | 'filter'
  | 'cooling'
  | 'suspension'
  | 'engine'
  | 'generic';

function classifyRepairCue(...parts: Array<string | null | undefined>): RepairCueType {
  const text = parts.filter(Boolean).join(' ').toLowerCase();
  if (/brake|гальм|спирач|колодк/.test(text)) return 'brakes';
  if (/turbo|турбо/.test(text)) return 'turbo';
  if (/battery|акум|батер/.test(text)) return 'battery';
  if (/filter|фільтр|филт/.test(text)) return 'filter';
  if (/cool|охолод|охлаж/.test(text)) return 'cooling';
  if (/suspension|shock|strut|підвіс|окач/.test(text)) return 'suspension';
  if (/oil|олив|маст|масл/.test(text)) return 'oil';
  if (/engine|двиг/.test(text)) return 'engine';
  return 'generic';
}

function RepairPartIcon({
  label,
  title,
  size = 18,
  className,
}: {
  label?: string | null;
  title?: string | null;
  size?: number;
  className?: string;
}) {
  const type = classifyRepairCue(label, title);

  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {type === 'oil' && (
        <>
          <path d="M10 2.8S6.3 7 6.3 10.2a3.7 3.7 0 1 0 7.4 0C13.7 7 10 2.8 10 2.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.4 11.5c.4.8 1.1 1.2 1.9 1.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {type === 'brakes' && (
        <>
          <circle cx="10" cy="10" r="5.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="10" cy="10" r="1.6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M14.7 6.8h1.3a1 1 0 0 1 1 1v4.4a1 1 0 0 1-1 1h-1.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {type === 'turbo' && (
        <>
          <path d="M10 4.3a5.7 5.7 0 1 0 5.7 5.7h-3.5A2.2 2.2 0 1 1 10 7.8V4.3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.2 10.1 14 6.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {type === 'battery' && (
        <>
          <rect x="3" y="6" width="12" height="8" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
          <path d="M15 8.5h1.7v3H15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.2 10h2.7M7.55 8.65v2.7M10.9 10h2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {type === 'filter' && (
        <path d="M4 5h12l-4.4 5v4.1l-3.2-1.8V10L4 5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {type === 'cooling' && (
        <>
          <circle cx="10" cy="10" r="1.4" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 4.3c1.7 0 2.4 2 1.4 3.2-.5.6-1.2.9-1.4 1.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M15 8.2c.8 1.5-.8 3-2.4 2.7-.8-.2-1.4-.7-1.8-1.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8.2 15.2c-1.7 0-2.4-2-1.4-3.2.5-.6 1.2-1 1.4-1.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {type === 'suspension' && (
        <>
          <path d="M7 4.2h6M7 15.8h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8.4 4.2v3.2l3.2 2.6-3.2 2.6v3.2M11.6 4.2v3.2L8.4 10l3.2 2.6v3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {type === 'engine' && (
        <>
          <path d="M5 7.2h7l1.6-2H16v8h-2.4L12 14.8H5V7.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 9H3.3M5 12H3.3M12 7.2V5.3M10.1 14.8v1.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {type === 'generic' && (
        <path d="M13.4 4.1a2.6 2.6 0 0 0-3.4 3.3l-4.6 4.6a1.2 1.2 0 1 0 1.6 1.7l4.6-4.6a2.6 2.6 0 0 0 3.3-3.4l-1.8 1.8-1.6-1.6 1.9-1.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

// Track in-flight image generation requests to avoid duplicates
const vehicleImageRequests = new Map<string, Promise<string | null>>();

function VehicleImage({ vehicleId, imageUrl, model }: { vehicleId?: string; imageUrl?: string | null; model?: string | null }) {
  const [src, setSrc] = useState<string | null>(imageUrl ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (src || !vehicleId || loading) return;
    // Lazily trigger image generation if no image exists
    const existing = vehicleImageRequests.get(vehicleId);
    if (existing) {
      existing.then((url) => { if (url) setSrc(url); });
      return;
    }
    setLoading(true);
    const promise = webApi.generateVehicleImage(vehicleId)
      .then((res) => { setSrc(res.imageUrl); return res.imageUrl; })
      .catch(() => null)
      .finally(() => { setLoading(false); vehicleImageRequests.delete(vehicleId); });
    vehicleImageRequests.set(vehicleId, promise);
  }, [vehicleId, src, loading]);

  if (src) {
    return (
      <div className="gcard-vehicle-icon">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={model ?? 'Vehicle'} className="gcard-vehicle-img" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gcard-vehicle-icon">
        <span className="gen-spinner" />
      </div>
    );
  }

  // Fallback: simple type-based SVG
  const type = detectVehicleType(model);
  return (
    <div className="gcard-vehicle-icon">
      <svg viewBox="0 0 48 28" fill="none" className="gcard-vehicle-svg">
        {type === 'suv' ? (
          <>
            <path d="M6 20h36M8 20l3-8h10l2 3h10l3-3h4l2 8" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <circle cx="14" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="36" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
          </>
        ) : type === 'truck' ? (
          <>
            <path d="M4 20h40M6 20l2-6h14v6M22 14h8l4 6h6" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <circle cx="12" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="38" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
          </>
        ) : type === 'van' ? (
          <>
            <path d="M5 20h38M7 20V10a2 2 0 012-2h18v12M27 8h6l4 5v7h4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <circle cx="13" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="37" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
          </>
        ) : (
          <>
            <path d="M5 20h38M8 20l2-5h6l3-5h10l3 5h6l2 5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            <circle cx="13" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="37" cy="22" r="3" stroke="currentColor" strokeWidth="1.3"/>
          </>
        )}
      </svg>
    </div>
  );
}

// ── Guide list with search + filter ──────────────────────────────────────────

function GuidesView({
  guides, loading, error, onDeleteGuide, onNewGuide, deleting, isEnterprise, isGuest, analytics,
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
  isGuest?: boolean;
}) {
  const t = useT();
  const [search, setSearch] = useState('');
  const [filterDiff, setFilterDiff] = useState('');
  const [sort, setSort] = useState<'recent' | 'alpha'>('recent');

  // For guests: derive difficulty chips from the actual demo guides only
  const demoDiffs = useMemo(
    () => (isGuest ? [...new Set(guides.map((g) => g.difficulty).filter(Boolean))] : []),
    [guides, isGuest],
  );

  const filtered = useMemo(() => {
    let list = [...guides];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((g) =>
        g.title.toLowerCase().includes(q) ||
        (g.vehicle?.model ?? '').toLowerCase().includes(q) ||
        (g.part?.name ?? '').toLowerCase().includes(q)
      );
    }
    if (filterDiff) list = list.filter((g) => g.difficulty === filterDiff);
    if (!isGuest && sort === 'alpha') list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [guides, search, filterDiff, isGuest, sort]);

  function clearFilters() { setSearch(''); setFilterDiff(''); }
  const guideHref = useCallback((guide: RepairGuide) => {
    if (!isGuest) return `/guides/${guide.id}`;
    return `/guides/${guide.canonicalGuideId ?? guide.id}?demo=1`;
  }, [isGuest]);

  return (
    <div className="dv-guides">
      {/* Header */}
      <div className="dv-header">
        <div>
          <h1 className="dv-title">{isGuest ? t.dash.sampleGuides : t.dash.guidesTitle}</h1>
          <p className="dv-sub">{isGuest ? t.dash.sampleGuidesSub : t.dash.guidesSub}</p>
        </div>
        {!isGuest && (
          <button className="dv-new-btn" onClick={onNewGuide}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {t.dash.newGuide}
          </button>
        )}
      </div>

      {/* Guest demo banner */}
      {isGuest && (
        <div className="guest-banner">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M7 4v3.5l2 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          {t.dash.guestBanner}{' '}
          <Link href="/auth/signup" className="guest-banner-link">{t.dash.guestBannerLink}</Link>
          {' '}{t.dash.guestBannerSuffix}
        </div>
      )}

      {/* Analytics widgets — authenticated only */}
      {!isGuest && analytics && (
        <div className="analytics-row">
          {[
            { label: t.dash.thisMonth, value: String(analytics.guidesThisMonth) },
            { label: t.dash.timeSaved, value: `${Math.round(analytics.timeSavedMinutes / 60)}h` },
            { label: t.common.vehicles, value: String(analytics.activeVehicles) },
            { label: t.dash.topRepair, value: analytics.mostCommonRepairs[0]?.partName ?? '—' },
          ].map((w) => (
            <div key={w.label} className="analytics-widget">
              <p className="analytics-value">{w.value}</p>
              <p className="analytics-label">{w.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar — guest: filter-only; auth: full search + sort */}
      <div className="glist-toolbar">
        <div className="glist-search-wrap">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="glist-search-icon">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            className="glist-search"
            placeholder={isGuest ? t.dash.filterSampleGuides : t.dash.searchGuides}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Guest: difficulty chips derived from demo guides */}
        {isGuest ? (
          <div className="glist-chips">
            <button
              className={`glist-chip${filterDiff === '' ? ' glist-chip--active' : ''}`}
              onClick={() => setFilterDiff('')}
            >{t.common.all}</button>
            {demoDiffs.map((d) => (
              <button
                key={d}
                className={`glist-chip${filterDiff === d ? ' glist-chip--active' : ''}`}
                onClick={() => setFilterDiff(filterDiff === d ? '' : d)}
              >{d}</button>
            ))}
          </div>
        ) : (
          <>
            <select className="glist-filter" value={filterDiff} onChange={(e) => setFilterDiff(e.target.value)}>
              <option value="">{t.dash.allDifficulties}</option>
              <option value="Beginner">{t.dash.beginner}</option>
              <option value="Intermediate">{t.dash.intermediate}</option>
              <option value="Advanced">{t.dash.advanced}</option>
              <option value="Expert">{t.dash.expert}</option>
            </select>
            <select className="glist-filter" value={sort} onChange={(e) => setSort(e.target.value as 'recent' | 'alpha')}>
              <option value="recent">{t.dash.mostRecent}</option>
              <option value="alpha">{t.dash.aToZ}</option>
            </select>
          </>
        )}
      </div>

      {/* Error — authenticated only */}
      {!isGuest && error && (
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
            <p>{t.dash.loadingGuides}</p>
          </div>
        ) : isGuest && filtered.length === 0 ? (
          /* Guest: filter returned nothing — show reset, never an empty state */
          <div className="guide-list-empty">
            <p className="guide-empty-title">{t.dash.noSampleMatch}</p>
            <p className="guide-empty-sub">{t.dash.noSampleMatchSub}</p>
            <button className="guest-empty-btn guest-empty-btn--ghost" onClick={clearFilters}>
              {t.dash.clearFilter}
            </button>
          </div>
        ) : !isGuest && filtered.length === 0 && search ? (
          <div className="guide-list-empty">
            <p className="guide-empty-title">{t.dash.noResultsFor} &ldquo;{search}&rdquo;</p>
            <p className="guide-empty-sub">{t.dash.noResultsSub}</p>
          </div>
        ) : !isGuest && guides.length === 0 && error ? (
          <div className="guide-list-empty">
            <div className="guide-empty-icon" style={{ color: 'var(--red)' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M16 10v8M16 22v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="guide-empty-title">{t.dash.couldNotLoadGuides}</p>
            <p className="guide-empty-sub">{error}</p>
            <button className="guest-empty-btn guest-empty-btn--ghost" onClick={() => window.location.reload()}>
              {t.common.retry}
            </button>
          </div>
        ) : !isGuest && guides.length === 0 ? (
          <div className="guide-list-empty">
            <div className="guide-empty-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="6" y="4" width="20" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11h10M11 16h10M11 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="guide-empty-title">{t.dash.noGuidesYet}</p>
            <p className="guide-empty-sub">{t.dash.noGuidesYetSub}</p>
          </div>
        ) : (
          filtered.map((guide) => {
            const dot = guideStatusDot(guide);
            const href = guideHref(guide);
            const vehicleModel = guide.vehicle?.model ?? '—';
            const partName = guide.part?.name ?? '—';
            const repairCue = classifyRepairCue(partName, guide.title);
            const statusTitle = dot === 'yellow'
              ? t.dash.imagesGenerating
              : dot === 'red'
                ? t.dash.imagesFailed
                : t.dash.ready;
            return (
              <div key={guide.id} className="guide-card guide-card--v4">
                {!isGuest && (
                  <button
                    className="guide-card-delete guide-card-delete--inline"
                    onClick={() => onDeleteGuide(guide.id)}
                    disabled={deleting === guide.id}
                    title={t.dash.deleteGuide}
                  >
                    {deleting === guide.id ? <span className="gen-spinner" /> : (
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path d="M2 4h11M6 4V2.5h3V4M5 4v8a1 1 0 001 1h3a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                )}
                <Link href={href} className="guide-card-shell guide-card-shell--grid">
                  <div className="guide-card-thumb-col">
                    <div className="guide-card-thumb-media">
                      <VehicleImage vehicleId={guide.vehicle?.id} imageUrl={guide.vehicle?.imageUrl} model={guide.vehicle?.model} />
                    </div>
                  </div>
                  <div className="guide-card-copy guide-card-copy--grid">
                    <div className="guide-card-meta">
                      <span className={`badge ${difficultyBadgeClass(guide.difficulty)}`}>{guide.difficulty}</span>
                      <span className="guide-card-time">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                          <path d="M6 3.5v2.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                        {guide.timeEstimate ?? '—'}
                      </span>
                      <span className="guide-card-time">{guide.steps?.length ?? 0} {t.common.steps}</span>
                      {!isGuest && dot && (
                        <span
                          className={`guide-card-status guide-card-status--${dot}`}
                          title={statusTitle}
                          aria-label={statusTitle}
                        />
                      )}
                    </div>
                    <div className="guide-card-title-block">
                      <h2 className="guide-card-vehicle-name">{vehicleModel}</h2>
                      <p className="guide-card-repair-title">{guide.title}</p>
                    </div>
                  </div>
                  <div className="guide-card-aside">
                    <span className="guide-card-repair-label">{t.guideForm.repairLabel}</span>
                    <div className="guide-card-repair-chip">
                      <span className={`guide-card-repair-icon guide-card-repair-icon--${repairCue}`}>
                        <RepairPartIcon label={partName} title={guide.title} />
                      </span>
                      <p className="guide-card-repair-name">{partName}</p>
                    </div>
                    {isGuest && isPremiumGuideThumb(guide.steps?.[0]?.imageUrl) && (
                      <span className="guide-card-inline-pill">{t.dash.sampleGuides}</span>
                    )}
                  </div>
                </Link>
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
  const t = useT();
  // Deduplicate vehicles by model+VIN — backend may create separate rows for same car
  const merged = useMemo(() => {
    const map = new Map<string, VehicleWithHistory>();
    for (const v of vehicles) {
      const key = `${v.model}__${v.vin ?? ''}`.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        // Merge guides from duplicate into the first occurrence
        const existingIds = new Set(existing.guides.map((g) => g.id));
        for (const g of v.guides) {
          if (!existingIds.has(g.id)) existing.guides.push(g);
        }
      } else {
        map.set(key, { ...v, guides: [...v.guides] });
      }
    }
    return Array.from(map.values());
  }, [vehicles]);

  return (
    <div className="dv-guides">
      <div className="dv-header">
        <div>
          <h1 className="dv-title">{t.garage.title}</h1>
          <p className="dv-sub">{t.garage.sub}</p>
        </div>
      </div>
      {loading ? (
        <div className="guide-list-empty"><span className="gen-spinner gen-spinner--lg" /></div>
      ) : merged.length === 0 ? (
        <div className="guide-list-empty">
          <div className="guide-empty-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M4 21l4-10h16l4 10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <rect x="3" y="21" width="26" height="7" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="9" cy="28" r="2" fill="currentColor"/>
              <circle cx="23" cy="28" r="2" fill="currentColor"/>
            </svg>
          </div>
          <p className="guide-empty-title">{t.garage.noVehiclesYet}</p>
          <p className="guide-empty-sub">{t.garage.noVehiclesSub}</p>
        </div>
      ) : (
        <div className="vehicle-list">
          {merged.map((v) => (
            <div key={v.id} className="vehicle-card vehicle-card--v2">
              <div className="vehicle-card-media">
                <VehicleImage vehicleId={v.id} imageUrl={v.imageUrl} model={v.model} />
              </div>
              <div className="vehicle-card-body">
                <div className="vehicle-card-head">
                  <div className="vehicle-card-copy vehicle-card-copy--v2">
                    <p className="vehicle-card-model">{v.model}</p>
                    {v.vin && <p className="vehicle-card-vin">VIN: {v.vin}</p>}
                  </div>
                  <div className="vehicle-card-counts">
                    <span className="vehicle-count-pill">{v.guides.length} {v.guides.length !== 1 ? t.garage.guidesCount : t.garage.guideCount}</span>
                  </div>
                </div>
                {v.guides[0] && (
                  <div className="vehicle-card-tags">
                    <span className="guide-card-tag">
                      <span className="guide-card-tag-label">{t.guideForm.repairLabel}</span>
                      <span className="guide-card-tag-value">{v.guides[0].part.name}</span>
                    </span>
                  </div>
                )}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Jobs view ─────────────────────────────────────────────────────────────────

function JobsView({ vehicles }: { vehicles: VehicleWithHistory[] }) {
  const t = useT();
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
  const statusLabel: Record<string, string> = { pending: t.jobs.pending, in_progress: t.jobs.inProgress, completed: t.jobs.completed };

  return (
    <div className="dv-guides">
      <div className="dv-header">
        <div><h1 className="dv-title">{t.jobs.title}</h1><p className="dv-sub">{t.jobs.sub}</p></div>
      </div>
      <form onSubmit={createJob} className="gen-form">
        <div className="gen-form-header">
          <div className="gen-form-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <span className="gen-form-title">{t.jobs.logRepairJob}</span>
        </div>
        <div className="gen-inputs">
          <div className="gen-input-wrap">
            <label className="gen-label">{t.common.vehicle} <span className="gen-label-required">*</span></label>
            <select name="vehicleId" required className="gen-input gen-input--select">
              <option value="">{t.jobs.selectVehicle}</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.model}{v.vin ? ` · ${v.vin}` : ''}</option>)}
            </select>
          </div>
          <div className="gen-input-wrap">
            <label className="gen-label">{t.jobs.problemDescription} <span className="gen-label-required">*</span></label>
            <input name="problemDescription" required placeholder="e.g. Hydraulic pump failure" className="gen-input" />
          </div>
          <div className="gen-input-wrap">
            <label className="gen-label">{t.jobs.notes} <span className="gen-label-or">optional</span></label>
            <input name="notes" placeholder={t.jobs.additionalContext} className="gen-input" />
          </div>
        </div>
        {error && <div className="dash-error">{error}</div>}
        <button type="submit" disabled={creating} className="gen-btn">
          {creating ? <><span className="gen-spinner" /> {t.jobs.creating}</> : t.jobs.createJob}
        </button>
      </form>
      <section className="guide-list" style={{ marginTop: 12 }}>
        {loading ? (
          <div className="guide-list-empty"><span className="gen-spinner gen-spinner--lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="guide-list-empty">
            <p className="guide-empty-title">{t.jobs.noJobsYet}</p>
            <p className="guide-empty-sub">{t.jobs.noJobsSub}</p>
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
                    {t.jobs.guideLabel} <Link href={`/guides/${job.guide.id}`} className="job-guide-link">{job.guide.title}</Link>
                  </p>
                )}
              </div>
              <div className="guide-card-actions">
                {job.status === 'pending' && (
                  <button className="job-status-btn job-status-btn--start" onClick={() => advanceStatus(job.id, 'in_progress')}>{t.jobs.start}</button>
                )}
                {job.status === 'in_progress' && (
                  <button className="job-status-btn job-status-btn--done" onClick={() => advanceStatus(job.id, 'completed')}>{t.jobs.complete}</button>
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
  const t = useT();
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
        <div><h1 className="dv-title">{t.requests.title}</h1><p className="dv-sub">{t.requests.sub}</p></div>
      </div>
      <form onSubmit={createRequest} className="gen-form">
        <div className="gen-form-header">
          <div className="gen-form-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <span className="gen-form-title">{t.requests.requestAGuide}</span>
        </div>
        <div className="gen-inputs">
          <div className="gen-input-wrap">
            <label className="gen-label">{t.requests.vehicleModel} <span className="gen-label-required">*</span></label>
            <input name="vehicleModel" required placeholder="e.g. CAT 320D" className="gen-input" />
          </div>
          <div className="gen-input-wrap">
            <label className="gen-label">{t.requests.repairType} <span className="gen-label-required">*</span></label>
            <input name="repairType" required placeholder="e.g. Hydraulic system overhaul" className="gen-input" />
          </div>
          <div className="gen-input-wrap">
            <label className="gen-label">{t.requests.partNumber} <span className="gen-label-or">optional</span></label>
            <input name="partNumber" placeholder="e.g. 4633891" className="gen-input" />
          </div>
          <div className="gen-input-wrap">
            <label className="gen-label">{t.requests.notes} <span className="gen-label-or">optional</span></label>
            <input name="notes" placeholder={t.requests.additionalContext} className="gen-input" />
          </div>
        </div>
        {error && <div className="dash-error">{error}</div>}
        <button type="submit" disabled={creating} className="gen-btn">
          {creating ? <><span className="gen-spinner" /> {t.requests.submitting}</> : t.requests.submitRequest}
        </button>
      </form>
      <section className="guide-list" style={{ marginTop: 12 }}>
        {loading ? (
          <div className="guide-list-empty"><span className="gen-spinner gen-spinner--lg" /></div>
        ) : requests.length === 0 ? (
          <div className="guide-list-empty">
            <p className="guide-empty-title">{t.requests.noRequestsYet}</p>
            <p className="guide-empty-sub">{t.requests.noRequestsSub}</p>
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
                    {t.requests.guideReady} {req.guide.title} →
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
  const t = useT();
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
          <h1 className="dv-title">{t.manuals.title}</h1>
          <p className="dv-sub">{t.manuals.sub}</p>
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
            <span className="gen-form-title">{t.manuals.uploadManual}</span>
          </div>
          <div className="gen-inputs gen-inputs--col">
            <div className="gen-input-wrap">
              <label className="gen-label">{t.manuals.titleField} <span className="gen-label-required">*</span></label>
              <input name="title" required placeholder="e.g. CAT 320D Service Manual" className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">{t.manuals.pdfUrl} <span className="gen-label-required">*</span></label>
              <input name="fileUrl" required placeholder="https://example.com/manual.pdf" className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">{t.manuals.vehicleModel} <span className="gen-label-or">optional</span></label>
              <input name="vehicleModel" placeholder="e.g. CAT 320D" className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">{t.manuals.extractedText} <span className="gen-label-or">optional</span></label>
              <textarea name="extractedText" placeholder="Paste relevant manual text…" className="gen-input gen-input--textarea" rows={4} />
            </div>
          </div>
          {uploadError && <div className="dash-error">{uploadError}</div>}
          <button type="submit" disabled={uploading} className="gen-btn">
            {uploading ? <><span className="gen-spinner" /> {t.manuals.saving}</> : t.manuals.saveManual}
          </button>
        </form>

        <form onSubmit={createFromManual} className="gen-form">
          <div className="gen-form-header">
            <div className="gen-form-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="gen-form-title">{t.manuals.generateFromManual}</span>
          </div>
          <div className="gen-inputs gen-inputs--col">
            <div className="gen-input-wrap">
              <label className="gen-label">{t.manuals.manual} <span className="gen-label-required">*</span></label>
              <select name="manualId" required className="gen-input gen-input--select">
                <option value="">{t.manuals.selectManual}</option>
                {manuals.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">{t.manuals.vehicleModel} <span className="gen-label-required">*</span></label>
              <input name="vehicleModel" required placeholder="e.g. CAT 320D" className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">{t.manuals.partName} <span className="gen-label-required">*</span></label>
              <input name="partName" required placeholder="e.g. Hydraulic Pump" className="gen-input" />
            </div>
            <div className="gen-input-wrap">
              <label className="gen-label">{t.manuals.oemNumber} <span className="gen-label-or">optional</span></label>
              <input name="oemNumber" placeholder="e.g. 4633891" className="gen-input" />
            </div>
          </div>
          {genError && <div className="dash-error">{genError}</div>}
          <button type="submit" disabled={generating} className="gen-btn">
            {generating ? <><span className="gen-spinner" /> {t.manuals.generating}</> : <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 8H3M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t.manuals.generateGuide}
            </>}
          </button>
          {generated && (
            <Link href={`/guides/${generated.id}`} className="ent-generated-link">
              {t.manuals.guideReady} {generated.title} →
            </Link>
          )}
        </form>
      </div>

      <section className="guide-list" style={{ marginTop: 24 }}>
        <p className="ent-section-title">{t.manuals.uploadedManuals} ({manuals.length})</p>
        {manuals.length === 0 ? (
          <div className="guide-list-empty">
            <p className="guide-empty-title">{t.manuals.noManualsUploaded}</p>
            <p className="guide-empty-sub">{t.manuals.noManualsSub}</p>
          </div>
        ) : (
          manuals.map((m) => (
            <div key={m.id} className="guide-card">
              <div className="guide-card-main">
                <div className="guide-card-meta">
                  <span className="badge badge--green">{t.manuals.manual}</span>
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
  const t = useT();
  const [planInfo, setPlanInfo] = useState<{
    planType: string;
    subscriptionStatus: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    canManageSubscription: boolean;
    paymentMethodLast4: string | null;
    paymentMethodBrand: string | null;
    priceAmount: number | null;
    priceCurrency: string;
    priceInterval: string;
  }>({
    planType: 'free',
    subscriptionStatus: 'none',
    trialEndsAt: null,
    currentPeriodEnd: null,
    canManageSubscription: false,
    paymentMethodLast4: null,
    paymentMethodBrand: null,
    priceAmount: 3900,
    priceCurrency: 'USD',
    priceInterval: 'month',
  });
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('motix_user');
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<typeof planInfo>;
        setPlanInfo((current) => ({ ...current, ...parsed }));
      }
    } catch { /* ignore */ }
    webApi.getBillingSummary()
      .then((summary) => {
        setPlanInfo({
          planType: summary.planType,
          subscriptionStatus: summary.subscriptionStatus,
          trialEndsAt: summary.trialEndsAt,
          currentPeriodEnd: summary.currentPeriodEnd,
          canManageSubscription: summary.canManageSubscription,
          paymentMethodLast4: summary.paymentMethodLast4,
          paymentMethodBrand: summary.paymentMethodBrand,
          priceAmount: summary.priceAmount,
          priceCurrency: summary.priceCurrency,
          priceInterval: summary.priceInterval,
        });
        localStorage.setItem('motix_user', JSON.stringify({
          planType: summary.planType,
          subscriptionStatus: summary.subscriptionStatus,
          trialEndsAt: summary.trialEndsAt,
        }));
      })
      .catch(() => {
        setBillingError(t.settingsView.billingSummaryUnavailable);
      });
  }, []);

  const isPremium = planInfo.planType === 'premium' || isEnterprise;
  const isTrial = planInfo.planType === 'trial' && planInfo.subscriptionStatus === 'active';

  const trialDaysLeft = isTrial && planInfo.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(planInfo.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  const priceText = planInfo.priceAmount
    ? new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: planInfo.priceCurrency || 'USD',
      maximumFractionDigits: 0,
    }).format(planInfo.priceAmount / 100)
    : '$39';
  const cadenceText = `${priceText}/${planInfo.priceInterval === 'month' ? t.settingsView.perMonthShort : planInfo.priceInterval}`;
  const renewalDate = planInfo.currentPeriodEnd
    ? new Date(planInfo.currentPeriodEnd).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';
  const trialEndDate = planInfo.trialEndsAt
    ? new Date(planInfo.trialEndsAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  async function handlePromoRedeem() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await webApi.redeemPromo(promoCode.trim());
      const updated = {
        planType: res.planType,
        subscriptionStatus: res.subscriptionStatus,
        trialEndsAt: null,
        currentPeriodEnd: null,
        canManageSubscription: false,
        paymentMethodLast4: null,
        paymentMethodBrand: null,
        priceAmount: planInfo.priceAmount,
        priceCurrency: planInfo.priceCurrency,
        priceInterval: planInfo.priceInterval,
      };
      setPlanInfo(updated);
      localStorage.setItem('motix_user', JSON.stringify({
        planType: updated.planType,
        subscriptionStatus: updated.subscriptionStatus,
        trialEndsAt: updated.trialEndsAt,
      }));
      setPromoSuccess(true);
      setPromoCode('');
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : t.settingsView.invalidPromoCode);
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleUpgrade(trial: boolean) {
    setBillingLoading(true);
    setPromoError(null);
    setBillingError(null);
    try {
      const { url } = await webApi.createCheckoutSession({
        successUrl: `${window.location.origin}/dashboard?billing=${trial ? 'trial-started' : 'success'}`,
        cancelUrl: `${window.location.origin}/dashboard?billing=cancelled`,
        trial,
      });
      if (url) {
        window.location.href = url;
        return; // navigating away
      }
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : t.settingsView.billingStartFailed);
    }
    setBillingLoading(false);
  }

  async function handleManageBilling() {
    setBillingLoading(true);
    setBillingError(null);
    try {
      const { url } = await webApi.createPortalSession({
        returnUrl: `${window.location.origin}/dashboard`,
      });
      if (url) window.location.href = url;
    } catch (err) {
      setBillingError(err instanceof Error ? err.message : t.settingsView.billingStartFailed);
    }
    setBillingLoading(false);
  }

  function handleBillingSupport() {
    window.location.href = `mailto:hello@motixi.com?subject=${encodeURIComponent('Motixi billing support')}`;
  }

  const planBadgeLabel = isEnterprise ? 'Enterprise' : isPremium ? 'Pro' : isTrial ? 'Pro Trial' : 'Free';
  const planBadgeClass = isEnterprise ? 'sett-plan-badge--enterprise' : isPremium ? 'sett-plan-badge--pro' : isTrial ? 'sett-plan-badge--trial' : 'sett-plan-badge--free';

  return (
    <div className="dv-guides">
      <div className="dv-header">
        <div><h1 className="dv-title">{t.settingsView.title}</h1><p className="dv-sub">{t.settingsView.sub}</p></div>
      </div>
      <div className="settings-grid">

        {/* Account card */}
        <div className="gen-form">
          <div className="gen-form-header">
            <div className="gen-form-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M3 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="gen-form-title">{t.settingsView.account}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">{t.settingsView.emailLabel}</span>
            <span className="settings-value">{email}</span>
          </div>
          <div className="settings-row">
            <span className="settings-label">{t.settingsView.planLabel}</span>
            <span className={`sett-plan-badge ${planBadgeClass}`}>{planBadgeLabel}</span>
          </div>
          <div className="settings-row settings-row--stack">
            <span className="settings-label">{t.settingsView.languageLabel}</span>
            <SettingsLanguageSelector />
          </div>
          {isTrial && trialDaysLeft !== null && (
            <div className="sett-trial-notice">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M7 4v3.5l2 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              {t.settingsView.trialEndsIn} {trialDaysLeft} {trialDaysLeft !== 1 ? t.settingsView.days : t.settingsView.day}
            </div>
          )}
        </div>

        {/* Plan / billing card */}
        <div className="gen-form">
          <div className="gen-form-header">
            <div className="gen-form-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 12l3-9 4 6 3-3 4 6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="gen-form-title">{isPremium || isTrial ? t.settingsView.planPro : t.settingsView.planAndUsage}</span>
          </div>

          {isPremium ? (
            <>
              <div className="sett-pro-banner">
                <div>
                  <p className="sett-pro-banner-title">{t.settingsView.proPlanTitle}</p>
                  <p className="sett-pro-banner-sub">{t.settingsView.proActiveDesc}</p>
                </div>
              </div>
              <div className="sett-detail-list">
                <div className="sett-detail-row"><span>{t.settingsView.priceLabel}</span><strong>{cadenceText}</strong></div>
                <div className="sett-detail-row"><span>{t.settingsView.nextBillingDate}</span><strong>{renewalDate}</strong></div>
                <div className="sett-detail-row"><span>{t.settingsView.paymentMethod}</span><strong>{planInfo.paymentMethodLast4 ? `${planInfo.paymentMethodBrand ?? t.settingsView.cardLabel} •••• ${planInfo.paymentMethodLast4}` : t.settingsView.noPaymentMethod}</strong></div>
              </div>
              <button
                className="sett-billing-btn"
                onClick={planInfo.canManageSubscription ? handleManageBilling : handleBillingSupport}
                disabled={billingLoading}
              >
                {planInfo.canManageSubscription ? t.settingsView.manageSubscription : t.settingsView.contactBillingSupport}
              </button>
            </>
          ) : isTrial ? (
            <>
              <div className="sett-pro-banner sett-pro-banner--trial">
                <div>
                  <p className="sett-pro-banner-title">{t.settingsView.trialPlanTitle}</p>
                  <p className="sett-pro-banner-sub">{t.settingsView.trialRenewsAs}</p>
                </div>
              </div>
              <div className="sett-detail-list">
                <div className="sett-detail-row"><span>{t.settingsView.priceAfterTrial}</span><strong>{cadenceText}</strong></div>
                <div className="sett-detail-row"><span>{t.settingsView.trialDaysLeft}</span><strong>{trialDaysLeft ?? '—'}</strong></div>
                <div className="sett-detail-row"><span>{t.settingsView.renewsOn}</span><strong>{trialEndDate}</strong></div>
              </div>
              <button
                className="sett-billing-btn"
                onClick={planInfo.canManageSubscription ? handleManageBilling : handleBillingSupport}
                disabled={billingLoading}
              >
                {planInfo.canManageSubscription ? t.settingsView.manageSubscription : t.settingsView.contactBillingSupport}
              </button>
            </>
          ) : (
            <>
              <div className="sett-free-summary">
                <div className="sett-detail-row"><span>{t.settingsView.planLabel}</span><strong>{t.settingsView.freePlanTitle}</strong></div>
                <div className="sett-detail-row"><span>{t.settingsView.includesLabel}</span><strong>{t.settingsView.freePlanIncludes}</strong></div>
                <div className="plan-usage-row">
                  <div className="plan-usage-labels">
                    <span>{t.settingsView.guidesThisMonth}</span>
                    <span>{guidesUsed} / {guidesLimit}</span>
                  </div>
                  <div className="plan-usage-track">
                    <div
                      className={`plan-usage-bar${guidesUsed >= guidesLimit ? ' plan-usage-bar--full' : ''}`}
                      style={{ width: `${Math.min(100, guidesUsed / guidesLimit * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <button
                className="sett-upgrade-btn"
                onClick={() => handleUpgrade(true)}
                disabled={billingLoading}
              >
                {t.settingsView.startTrialCta}
              </button>

              {promoSuccess ? (
                <div className="sett-promo-success">
                  {t.settingsView.promoApplied}
                </div>
              ) : (
                <div className="sett-promo-section">
                  <p className="sett-promo-label">{t.settingsView.havePromoCode}</p>
                  <div className="sett-promo-row">
                    <input
                      className="gen-input sett-promo-input"
                      placeholder={t.settingsView.enterCode}
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setPromoError(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && handlePromoRedeem()}
                    />
                    <button
                      className="sett-promo-btn"
                      onClick={handlePromoRedeem}
                      disabled={promoLoading || !promoCode.trim()}
                    >
                  {promoLoading ? <span className="gen-spinner" /> : t.settingsView.apply}
                    </button>
                  </div>
                  {promoError && <p className="sett-promo-error">{promoError}</p>}
                </div>
              )}
            </>
          )}
          {billingError && <p className="sett-promo-error">{billingError}</p>}
        </div>

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
  const t = useT();
  return (
    <div className="ng-root">
      <div className="ng-topbar">
        <button className="ng-back" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t.newGuide.backToGuides}
        </button>
        <span className="ng-topbar-logo">Motixi</span>
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
  return (
    <AuthGuard>
      <DashboardInner />
    </AuthGuard>
  );
}

function DashboardInner() {
  const t = useT();
  const locale = getLocale();
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

  const [billingNotice, setBillingNotice] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  // Handle URL params (?q= for search, ?billing= for Stripe return)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const billing = params.get('billing');

    if (q) {
      if (readJwt().role !== 'GUEST') {
        setInitialQuery(q);
        setView('new-guide');
      }
    }

    if (billing === 'trial-started' || billing === 'success') {
      setBillingNotice({ type: 'success', message: billing === 'trial-started' ? t.dashboard.trialStartedNotice : t.dashboard.proActivatedNotice });
      // Refresh user plan state from server via token refresh
      try {
        const rt = localStorage.getItem('motix_refresh_token');
        if (rt) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rt }),
          }).then(r => r.json()).then((data: { accessToken?: string; refreshToken?: string; user?: { planType?: string } }) => {
            if (data.accessToken) localStorage.setItem('motix_access_token', data.accessToken);
            if (data.refreshToken) localStorage.setItem('motix_refresh_token', data.refreshToken);
            if (data.user) {
              localStorage.setItem('motix_user', JSON.stringify(data.user));
              if (data.user.planType) setPlanType(data.user.planType);
            }
          }).catch(() => {});
        }
      } catch { /* ignore */ }
      setView('settings');
    } else if (billing === 'cancelled') {
      setBillingNotice({ type: 'info', message: t.dashboard.billingCancelledNotice });
    }

    // Clean the URL
    if (q || billing) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Read plan from JWT + localStorage
  const [userInfo, setUserInfo] = useState({ role: 'USER', email: '' });
  const [planType, setPlanType] = useState('free');
  useEffect(() => {
    setUserInfo(readJwt());
    try {
      const stored = localStorage.getItem('motix_user');
      if (stored) {
        const u = JSON.parse(stored) as { planType?: string };
        if (u.planType) setPlanType(u.planType);
      }
    } catch { /* ignore */ }
  }, []);

  const isEnterprise = userInfo.role === 'ENTERPRISE_ADMIN';
  const isGuest = userInfo.role === 'GUEST';
  const email = userInfo.email;
  const initials = email ? email[0].toUpperCase() : 'U';
  const guidesUsed = analytics?.guidesThisMonth ?? 0;
  const guidesLimit = isEnterprise ? Infinity : 5;

  useEffect(() => {
    setLoading(true);
    const guestMode = readJwt().role === 'GUEST';
    Promise.all([
      guestMode ? webApi.getDemoGuides(locale) : webApi.listGuides(locale),
      guestMode ? Promise.resolve([] as VehicleWithHistory[]) : webApi.listVehicles({ language: locale }).catch(() => [] as VehicleWithHistory[]),
      guestMode ? Promise.resolve(null) : webApi.getAnalytics(locale).catch(() => null),
    ]).then(([g, v, a]) => {
      setGuides(g); setVehicles(v); setAnalytics(a);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }).finally(() => setLoading(false));
  }, [locale]);

  // Guests are locked to guides view — redirect any other view
  useEffect(() => {
    if (isGuest && view !== 'guides') setView('guides');
  }, [isGuest, view]);

  async function createGuide(data: {
    vehicleModel: string;
    vin?: string;
    partName: string;
    oemNumber?: string;
  }) {
    setSubmitting(true);
    setGuideError(null);
    try {
      const created = await webApi.createGuide({
            vin: data.vin ?? '',
            vehicleModel: data.vehicleModel,
            partName: data.partName,
            oemNumber: data.oemNumber ?? '',
            language: getLocale(),
          });
      setGuides((prev) => [created, ...prev]);
      webApi.listVehicles({ language: getLocale() }).then(setVehicles).catch(() => {});
      webApi.getAnalytics(getLocale()).then(setAnalytics).catch(() => {});
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
  if (view === 'new-guide' && !isGuest) {
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
        <span className="ds-mobile-logo">Motixi</span>
        {!isGuest && <button className="ds-mobile-new" onClick={() => setView('new-guide')}>+</button>}
      </div>

      <Sidebar
        view={view}
        onView={setView}
        isEnterprise={isEnterprise}
        isGuest={isGuest}
        initials={initials}
        email={email}
        guideCount={guides.length}
        guidesUsed={guidesUsed}
        guidesLimit={guidesLimit === Infinity ? 999 : guidesLimit}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        planType={planType}
      />

      <main className="ds-main">
        {billingNotice && (
          <div className={`ds-billing-notice ds-billing-notice--${billingNotice.type}`}>
            <span>{billingNotice.message}</span>
            <button type="button" onClick={() => setBillingNotice(null)} aria-label="Dismiss">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
            </button>
          </div>
        )}
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
            isGuest={isGuest}
          />
        )}
        {view === 'garage' && <GarageView vehicles={vehicles} loading={loading} />}
        {view === 'jobs' && isEnterprise && <JobsView vehicles={vehicles} />}
        {view === 'requests' && isEnterprise && <RequestsView />}
        {/* Manuals upload view hidden — manual ingestion not available in this phase */}
        {view === 'settings' && (
          <SettingsView email={email} isEnterprise={isEnterprise} guidesUsed={guidesUsed} guidesLimit={guidesLimit === Infinity ? 9999 : guidesLimit} />
        )}
      </main>
    </div>
  );
}
