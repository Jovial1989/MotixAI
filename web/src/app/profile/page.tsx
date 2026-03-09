'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

const KNOWN_VEHICLE_MODELS = [
  'Toyota Land Cruiser 200', 'Nissan Qashqai J10', 'BMW E90 3-Series',
  'Ford F-150', 'Honda Civic', 'Toyota Corolla', 'Volkswagen Golf',
  'Mercedes C-Class', 'Mercedes E-Class', 'BMW 5 Series',
  'Audi A4', 'Audi Q5', 'Nissan Patrol', 'Toyota Hilux',
  'Mitsubishi L200', 'CAT 320D', 'Komatsu PC200',
  'Volvo XC90', 'Range Rover Sport', 'Hyundai Tucson',
];

const PROFILE_KEY = 'motix_profile';

interface ProfileData {
  firstName: string;
  lastName: string;
  vehicleModel: string;
  country: string;
  preferredBrands: string;
  companyName: string;
  billingEmail: string;
  vatId: string;
  billingAddress: string;
}

function loadProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...emptyProfile(), ...JSON.parse(raw) as Partial<ProfileData> };
  } catch { /* ignore */ }
  return emptyProfile();
}

function emptyProfile(): ProfileData {
  return { firstName: '', lastName: '', vehicleModel: '', country: '', preferredBrands: '', companyName: '', billingEmail: '', vatId: '', billingAddress: '' };
}

function readEmail(): string {
  try {
    const token = localStorage.getItem('motix_access_token');
    if (!token) return '';
    const payload = JSON.parse(atob(token.split('.')[1])) as { email?: string; sub?: string };
    return payload.email ?? payload.sub ?? '';
  } catch { return ''; }
}

export default function ProfilePage() {
  const [email, setEmail]     = useState('');
  const [profile, setProfile] = useState<ProfileData>(emptyProfile());
  const [saved, setSaved]     = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);

  useEffect(() => {
    setEmail(readEmail());
    setProfile(loadProfile());
  }, []);

  function handleChange(field: keyof ProfileData, value: string) {
    setSaved(false);
    setProfile((p) => ({ ...p, [field]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch { /* ignore */ }
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
            onClick={() => { localStorage.removeItem('motix_access_token'); location.href = '/auth/login'; }}
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
          {/* ── Account info ── */}
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
                <label className="gen-label">Primary vehicle model <span className="gen-label-required">*</span></label>
                <select
                  value={profile.vehicleModel}
                  onChange={(e) => handleChange('vehicleModel', e.target.value)}
                  required
                  className="gen-input gen-input--select"
                >
                  <option value="">Select vehicle model…</option>
                  {KNOWN_VEHICLE_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Preferences ── */}
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

          {/* ── Billing ── */}
          <div className="gen-form">
            <button
              type="button"
              className="profile-section-title"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => setBillingOpen((o) => !o)}
            >
              <span>Billing details <span className="gen-label-or">optional</span></span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: billingOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {billingOpen && (
              <div className="gen-inputs" style={{ marginTop: 12 }}>
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
              </div>
            )}
          </div>

          <button type="submit" className="gen-btn">
            {saved ? '✓ Saved' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
