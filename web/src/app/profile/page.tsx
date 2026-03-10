'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { webApi } from '@/lib/api';
import VehicleSelector, { type VehicleSelection } from '../_vehicle-selector';

type PlanTier = 'FREE' | 'PRO' | 'ENTERPRISE';

const PROFILE_KEY = 'motix_profile';

interface ProfileData {
  firstName: string;
  lastName: string;
  vehicleMake: string;
  vehicleModelName: string;
  vehicleYear: string;
  vehicleModel: string;
  country: string;
  preferredBrands: string;
  companyName: string;
  billingEmail: string;
  vatId: string;
  billingAddress: string;
  plan: PlanTier;
  guidesUsedThisMonth: number;
  imageGenerationsThisMonth: number;
  paymentMethodLast4: string;
  nextBillingDate: string;
}

function emptyProfile(): ProfileData {
  return {
    firstName: '',
    lastName: '',
    vehicleMake: '',
    vehicleModelName: '',
    vehicleYear: '',
    vehicleModel: '',
    country: '',
    preferredBrands: '',
    companyName: '',
    billingEmail: '',
    vatId: '',
    billingAddress: '',
    plan: 'FREE',
    guidesUsedThisMonth: 0,
    imageGenerationsThisMonth: 0,
    paymentMethodLast4: '',
    nextBillingDate: '',
  };
}

function loadProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return emptyProfile();
    return { ...emptyProfile(), ...JSON.parse(raw) as Partial<ProfileData> };
  } catch {
    return emptyProfile();
  }
}

function readJwt(): { role: string; email: string } {
  try {
    const token = localStorage.getItem('motix_access_token');
    if (!token) return { role: 'USER', email: '' };
    const body = token.split('.')[1];
    if (!body) return { role: 'USER', email: '' };
    const b64 = body.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(body.length / 4) * 4, '=');
    const payload = JSON.parse(atob(b64)) as { role?: string; email?: string; sub?: string };
    return { role: payload.role ?? 'USER', email: payload.email ?? payload.sub ?? '' };
  } catch {
    return { role: 'USER', email: '' };
  }
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function ProfilePage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [profile, setProfile] = useState<ProfileData>(emptyProfile());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const user = readJwt();
    setEmail(user.email);
    setRole(user.role);

    const local = loadProfile();
    if (user.role === 'ENTERPRISE_ADMIN') local.plan = 'ENTERPRISE';
    setProfile(local);

    webApi.getAnalytics()
      .then((a) => {
        setProfile((p) => ({ ...p, guidesUsedThisMonth: a.guidesThisMonth }));
      })
      .catch(() => {
        // Keep locally stored values when analytics is not reachable.
      });
  }, []);

  const activePlan: PlanTier = useMemo(() => {
    if (role === 'ENTERPRISE_ADMIN') return 'ENTERPRISE';
    return profile.plan;
  }, [profile.plan, role]);

  const guideLimit = activePlan === 'FREE' ? 5 : Infinity;
  const imageLimit = activePlan === 'FREE' ? 25 : Infinity;
  const guidesUsed = profile.guidesUsedThisMonth;
  const imageUsed = profile.imageGenerationsThisMonth;

  function usageWidth(used: number, limit: number): string {
    if (!Number.isFinite(limit)) return '100%';
    if (limit <= 0) return '0%';
    return `${Math.min(100, Math.round((used / limit) * 100))}%`;
  }

  function handleChange(field: keyof ProfileData, value: string | number) {
    setSaved(false);
    setProfile((p) => ({ ...p, [field]: value }));
  }

  function handleVehicleChange(v: VehicleSelection) {
    setSaved(false);
    setProfile((p) => ({
      ...p,
      vehicleMake: v.make,
      vehicleModelName: v.model,
      vehicleYear: v.year,
      vehicleModel: [v.year, v.make, v.model].filter(Boolean).join(' '),
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="dash-root">
      <header className="dash-nav">
        <Link href="/dashboard" className="dash-logo">MotixAI</Link>
        <div className="dash-nav-right">
          <Link href="/dashboard" className="dash-nav-link">← Dashboard</Link>
          <button
            className="dash-nav-link dash-nav-link--logout"
            onClick={() => {
              localStorage.removeItem('motix_access_token');
              localStorage.removeItem('motix_refresh_token');
              location.href = '/auth/login';
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <div className="dash-body" style={{ maxWidth: 680 }}>
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">Your Profile</h1>
            <p className="dash-page-sub">Manage your account information and preferences.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="gen-form">
            <p className="profile-section-title">Account</p>
            <div className="gen-inputs">
              <div className="gen-input-wrap">
                <label className="gen-label">First name <span className="gen-label-required">*</span></label>
                <input
                  value={profile.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="e.g. Alex"
                  required
                  className="gen-input"
                />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">Last name <span className="gen-label-required">*</span></label>
                <input
                  value={profile.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="e.g. Johnson"
                  required
                  className="gen-input"
                />
              </div>
              <div className="gen-input-wrap" style={{ gridColumn: '1 / -1' }}>
                <label className="gen-label">Email</label>
                <div className="profile-email-val">{email || '—'}</div>
              </div>
              <div className="gen-input-wrap" style={{ gridColumn: '1 / -1' }}>
                <label className="gen-label">Primary vehicle <span className="gen-label-required">*</span></label>
              </div>
              <VehicleSelector
                value={{ make: profile.vehicleMake, model: profile.vehicleModelName, year: profile.vehicleYear }}
                onChange={handleVehicleChange}
                required
              />
            </div>
          </div>

          <div className="gen-form">
            <p className="profile-section-title">Your plan</p>
            <div className="profile-plan-card" style={{ marginTop: 12 }}>
              {activePlan === 'FREE' && (
                <>
                  <div className="profile-plan-title-row">
                    <p className="profile-plan-title">⚡ Free Plan</p>
                    <span className="profile-plan-badge">$0 / mo</span>
                  </div>

                  <div className="profile-usage-row">
                    <div className="profile-usage-head">
                      <span>Guides this month</span>
                      <span>{guidesUsed} / {guideLimit}</span>
                    </div>
                    <div className="profile-usage-track">
                      <div className="profile-usage-fill" style={{ width: usageWidth(guidesUsed, guideLimit) }} />
                    </div>
                  </div>

                  <div className="profile-usage-row">
                    <div className="profile-usage-head">
                      <span>Image generation</span>
                      <span>{imageUsed} / {imageLimit}</span>
                    </div>
                    <div className="profile-usage-track">
                      <div className="profile-usage-fill" style={{ width: usageWidth(imageUsed, imageLimit) }} />
                    </div>
                  </div>

                  <Link href="/auth/signup" className="gen-btn" style={{ width: 'fit-content', textDecoration: 'none' }}>
                    Upgrade to Pro — $39/mo →
                  </Link>
                </>
              )}

              {activePlan === 'PRO' && (
                <>
                  <div className="profile-plan-title-row">
                    <p className="profile-plan-title">⚡ Pro Plan — $39/mo</p>
                    <span className="profile-plan-badge">Active</span>
                  </div>
                  <ul className="profile-plan-list">
                    <li>Guides: Unlimited</li>
                    <li>Image generation: Priority</li>
                    <li>Mobile app: Enabled</li>
                    <li>API access: Enabled</li>
                  </ul>
                  <p className="profile-usage-head">
                    <span>Next billing</span>
                    <span>{formatDate(profile.nextBillingDate)}</span>
                  </p>
                  <div className="profile-inline-actions">
                    <button type="button" className="gen-btn">Manage subscription</button>
                    <button type="button" className="gen-btn" style={{ background: 'var(--bg-subtle)', color: 'var(--text-sub)', border: '1px solid var(--border)' }}>Cancel</button>
                  </div>
                </>
              )}

              {activePlan === 'ENTERPRISE' && (
                <>
                  <div className="profile-plan-title-row">
                    <p className="profile-plan-title">🏢 Enterprise Plan</p>
                    <span className="profile-plan-badge">Organization</span>
                  </div>
                  <ul className="profile-plan-list">
                    <li>Guides: Unlimited</li>
                    <li>Team members: 4 / 10</li>
                    <li>Manuals uploaded: 2</li>
                    <li>Custom SLA: Enabled</li>
                  </ul>
                  <p className="profile-usage-head">
                    <span>Account manager</span>
                    <span>hello@motixai.com</span>
                  </p>
                  <a href="mailto:hello@motixai.com" className="gen-btn" style={{ width: 'fit-content', textDecoration: 'none' }}>
                    Contact support
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="gen-form">
            <p className="profile-section-title">Preferences <span className="gen-label-or">optional</span></p>
            <div className="gen-inputs">
              <div className="gen-input-wrap">
                <label className="gen-label">Country</label>
                <input
                  value={profile.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="e.g. United States"
                  className="gen-input"
                />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">Preferred brands</label>
                <input
                  value={profile.preferredBrands}
                  onChange={(e) => handleChange('preferredBrands', e.target.value)}
                  placeholder="e.g. Toyota, Ford, CAT"
                  className="gen-input"
                />
              </div>
            </div>
          </div>

          <div className="gen-form">
            <p className="profile-section-title">Billing details</p>
            <div className="gen-inputs" style={{ marginTop: 12 }}>
              <div className="gen-input-wrap">
                <label className="gen-label">Current plan</label>
                <input value={activePlan === 'FREE' ? 'Free — $0/mo' : activePlan === 'PRO' ? 'Pro — $39/mo' : 'Enterprise — Custom'} readOnly className="gen-input" />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">Next billing date</label>
                <input value={activePlan === 'FREE' ? '—' : formatDate(profile.nextBillingDate)} readOnly className="gen-input" />
              </div>
              <div className="gen-input-wrap" style={{ gridColumn: '1 / -1' }}>
                <label className="gen-label">Payment method on file</label>
                <div className="profile-email-val">
                  {profile.paymentMethodLast4 ? `Card ending in ${profile.paymentMethodLast4}` : 'No payment method added'}
                </div>
              </div>
              {!profile.paymentMethodLast4 && (
                <button type="button" className="gen-btn" style={{ width: 'fit-content', background: 'var(--bg-subtle)', color: 'var(--text-sub)', border: '1px solid var(--border)' }}>Add payment method</button>
              )}
              <div className="gen-input-wrap">
                <label className="gen-label">Company name</label>
                <input value={profile.companyName} onChange={(e) => handleChange('companyName', e.target.value)} placeholder="e.g. AutoShop Ltd" className="gen-input" />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">Billing email</label>
                <input type="email" value={profile.billingEmail} onChange={(e) => handleChange('billingEmail', e.target.value)} placeholder="billing@company.com" className="gen-input" />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">VAT / Tax ID</label>
                <input value={profile.vatId} onChange={(e) => handleChange('vatId', e.target.value)} placeholder="e.g. EU123456789" className="gen-input" />
              </div>
              <div className="gen-input-wrap" style={{ gridColumn: '1 / -1' }}>
                <label className="gen-label">Billing address</label>
                <input value={profile.billingAddress} onChange={(e) => handleChange('billingAddress', e.target.value)} placeholder="Street, City, Country" className="gen-input" />
              </div>
              <div className="profile-inline-actions" style={{ gridColumn: '1 / -1' }}>
                <a href="#" className="profile-inline-link">Billing history</a>
                {activePlan === 'FREE' ? (
                  <Link href="/auth/signup" className="profile-inline-link">Upgrade to Pro</Link>
                ) : (
                  <button type="button" className="profile-inline-link" style={{ border: 0, background: 'transparent', padding: 0 }}>Manage subscription</button>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="gen-btn">
            {saved ? '✓ Saved' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
