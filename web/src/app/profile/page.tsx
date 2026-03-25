'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { webApi } from '@/lib/api';
import AuthGuard from '@/app/_auth-guard';
import VehicleSelector, { type VehicleSelection } from '../_vehicle-selector';
import { useT } from '@/lib/i18n';
import SettingsLanguageSelector from '../_settings-language-selector';

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

function formatMoney(amount: number | null, currency: string): string {
  if (amount == null) return '$39';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export default function ProfilePage() {
  return <AuthGuard><ProfileInner /></AuthGuard>;
}

function ProfileInner() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [profile, setProfile] = useState<ProfileData>(emptyProfile());
  const [billingSummary, setBillingSummary] = useState<{
    planType: string;
    subscriptionStatus: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    canManageSubscription: boolean;
    paymentMethodBrand: string | null;
    paymentMethodLast4: string | null;
    priceAmount: number | null;
    priceCurrency: string;
    priceInterval: string;
  }>({
    planType: 'free',
    subscriptionStatus: 'none',
    trialEndsAt: null,
    currentPeriodEnd: null,
    canManageSubscription: false,
    paymentMethodBrand: null,
    paymentMethodLast4: null,
    priceAmount: 3900,
    priceCurrency: 'USD',
    priceInterval: 'month',
  });
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

    webApi.getBillingSummary()
      .then((summary) => {
        setBillingSummary({
          planType: summary.planType,
          subscriptionStatus: summary.subscriptionStatus,
          trialEndsAt: summary.trialEndsAt,
          currentPeriodEnd: summary.currentPeriodEnd,
          canManageSubscription: summary.canManageSubscription,
          paymentMethodBrand: summary.paymentMethodBrand,
          paymentMethodLast4: summary.paymentMethodLast4,
          priceAmount: summary.priceAmount,
          priceCurrency: summary.priceCurrency,
          priceInterval: summary.priceInterval,
        });
      })
      .catch(() => {
        // Keep a stable fallback view even if billing summary is unreachable.
      });
  }, []);

  const activePlan: PlanTier = useMemo(() => {
    if (role === 'ENTERPRISE_ADMIN') return 'ENTERPRISE';
    return billingSummary.planType === 'premium' || billingSummary.planType === 'trial' ? 'PRO' : 'FREE';
  }, [billingSummary.planType, role]);

  const guideLimit = activePlan === 'FREE' ? 5 : Infinity;
  const imageLimit = activePlan === 'FREE' ? 25 : Infinity;
  const guidesUsed = profile.guidesUsedThisMonth;
  const imageUsed = profile.imageGenerationsThisMonth;
  const isTrial = billingSummary.planType === 'trial' && billingSummary.subscriptionStatus === 'active';
  const trialDaysLeft = isTrial && billingSummary.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(billingSummary.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  const priceText = formatMoney(billingSummary.priceAmount, billingSummary.priceCurrency);
  const cadenceText = `${priceText}/${billingSummary.priceInterval === 'month' ? t.profilePage.perMonthShort : billingSummary.priceInterval}`;

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
        <Link href="/dashboard" className="dash-logo">Motixi</Link>
        <div className="dash-nav-right">
          <Link href="/dashboard" className="dash-nav-link">← {t.common.dashboard}</Link>
          <button
            className="dash-nav-link dash-nav-link--logout"
            onClick={() => {
              localStorage.removeItem('motix_access_token');
              localStorage.removeItem('motix_refresh_token');
              location.href = '/auth/login';
            }}
          >
            {t.common.logOut}
          </button>
        </div>
      </header>

      <div className="dash-body" style={{ maxWidth: 680 }}>
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">{t.profilePage.title}</h1>
            <p className="dash-page-sub">{t.profilePage.sub}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="gen-form">
            <p className="profile-section-title">{t.profilePage.accountSection}</p>
            <div className="gen-inputs">
              <div className="gen-input-wrap">
                <label className="gen-label">{t.profilePage.firstName} <span className="gen-label-required">*</span></label>
                <input
                  value={profile.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="e.g. Alex"
                  required
                  className="gen-input"
                />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">{t.profilePage.lastName} <span className="gen-label-required">*</span></label>
                <input
                  value={profile.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="e.g. Johnson"
                  required
                  className="gen-input"
                />
              </div>
              <div className="gen-input-wrap" style={{ gridColumn: '1 / -1' }}>
                <label className="gen-label">{t.profilePage.emailLabel}</label>
                <div className="profile-email-val">{email || '—'}</div>
              </div>
              <div className="gen-input-wrap" style={{ gridColumn: '1 / -1' }}>
                <label className="gen-label">{t.profilePage.primaryVehicle} <span className="gen-label-required">*</span></label>
              </div>
              <VehicleSelector
                value={{ make: profile.vehicleMake, model: profile.vehicleModelName, year: profile.vehicleYear }}
                onChange={handleVehicleChange}
                required
              />
            </div>
          </div>

          <div className="gen-form">
            <p className="profile-section-title">{t.profilePage.yourPlan}</p>
            <div className="profile-plan-card" style={{ marginTop: 12 }}>
              {activePlan === 'FREE' && (
                <>
                  <div className="profile-plan-title-row">
                    <p className="profile-plan-title">{t.profilePage.freePlanTitle}</p>
                    <span className="profile-plan-badge">$0 {t.profilePage.perMonth}</span>
                  </div>
                  <p className="profile-usage-head">
                    <span>{t.profilePage.includesLabel}</span>
                    <span>{t.profilePage.freePlanIncludes}</span>
                  </p>

                  <div className="profile-usage-row">
                    <div className="profile-usage-head">
                      <span>{t.profilePage.guidesThisMonth}</span>
                      <span>{guidesUsed} / {guideLimit}</span>
                    </div>
                    <div className="profile-usage-track">
                      <div className="profile-usage-fill" style={{ width: usageWidth(guidesUsed, guideLimit) }} />
                    </div>
                  </div>

                  <div className="profile-usage-row">
                    <div className="profile-usage-head">
                      <span>{t.profilePage.imageGeneration}</span>
                      <span>{imageUsed} / {imageLimit}</span>
                    </div>
                    <div className="profile-usage-track">
                      <div className="profile-usage-fill" style={{ width: usageWidth(imageUsed, imageLimit) }} />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="gen-btn"
                    style={{ width: 'fit-content' }}
                    onClick={async () => {
                      try {
                        const { url } = await webApi.createCheckoutSession({
                          successUrl: `${window.location.origin}/profile?billing=success`,
                          cancelUrl: `${window.location.origin}/profile?billing=cancelled`,
                        });
                        if (url) window.location.href = url;
                      } catch { /* ignore */ }
                    }}
                  >
                    {t.profilePage.startTrialCta}
                  </button>
                </>
              )}

              {activePlan === 'PRO' && (
                <>
                  <div className="profile-plan-title-row">
                    <p className="profile-plan-title">{isTrial ? t.profilePage.trialPlanTitle : t.profilePage.proPlanTitle}</p>
                    <span className="profile-plan-badge">{isTrial ? t.profilePage.trialActive : t.profilePage.active}</span>
                  </div>
                  <ul className="profile-plan-list">
                    <li>{t.profilePage.unlimitedGuides}</li>
                    <li>{t.profilePage.priorityImageGeneration}</li>
                    <li>{t.profilePage.fullGuideHistory}</li>
                  </ul>
                  <p className="profile-usage-head">
                    <span>{isTrial ? t.profilePage.priceAfterTrial : t.profilePage.priceLabel}</span>
                    <span>{cadenceText}</span>
                  </p>
                  {isTrial ? (
                    <>
                      <p className="profile-usage-head">
                        <span>{t.profilePage.trialDaysLeft}</span>
                        <span>{trialDaysLeft ?? '—'}</span>
                      </p>
                      <p className="profile-usage-head">
                        <span>{t.profilePage.renewsOn}</span>
                        <span>{formatDate(billingSummary.trialEndsAt ?? '')}</span>
                      </p>
                    </>
                  ) : (
                    <p className="profile-usage-head">
                      <span>{t.profilePage.nextBilling}</span>
                      <span>{formatDate(billingSummary.currentPeriodEnd ?? '')}</span>
                    </p>
                  )}
                  <div className="profile-inline-actions">
                    {billingSummary.canManageSubscription ? (
                      <button
                        type="button"
                        className="gen-btn"
                        onClick={async () => {
                          try {
                            const { url } = await webApi.createPortalSession({
                              returnUrl: `${window.location.origin}/profile`,
                            });
                            if (url) window.location.href = url;
                          } catch { /* ignore */ }
                        }}
                      >
                        {t.profilePage.manageSubscription}
                      </button>
                    ) : (
                      <a href="mailto:hello@motixi.com?subject=Motixi billing support" className="gen-btn" style={{ width: 'fit-content', textDecoration: 'none' }}>
                        {t.profilePage.contactBillingSupport}
                      </a>
                    )}
                  </div>
                </>
              )}

              {activePlan === 'ENTERPRISE' && (
                <>
                  <div className="profile-plan-title-row">
                    <p className="profile-plan-title">{t.profilePage.enterprisePlan}</p>
                    <span className="profile-plan-badge">{t.profilePage.organization}</span>
                  </div>
                  <ul className="profile-plan-list">
                    <li>{t.common.guides}: {t.profilePage.unlimited}</li>
                    <li>{t.profilePage.teamMembers}</li>
                    <li>{t.profilePage.manualsUploaded}</li>
                    <li>{t.profilePage.customSla}</li>
                  </ul>
                  <p className="profile-usage-head">
                    <span>{t.profilePage.accountManager}</span>
                    <span>hello@motixai.com</span>
                  </p>
                  <a href="mailto:hello@motixai.com" className="gen-btn" style={{ width: 'fit-content', textDecoration: 'none' }}>
                    {t.profilePage.contactSupport}
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="gen-form">
            <p className="profile-section-title">{t.profilePage.preferences} <span className="gen-label-or">optional</span></p>
            <div className="gen-inputs">
              <div className="gen-input-wrap" style={{ gridColumn: '1 / -1' }}>
                <label className="gen-label">{t.profilePage.languageLabel}</label>
                <SettingsLanguageSelector />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">{t.profilePage.country}</label>
                <input
                  value={profile.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="e.g. United States"
                  className="gen-input"
                />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">{t.profilePage.preferredBrands}</label>
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
            <p className="profile-section-title">{t.profilePage.billingDetails}</p>
            <div className="gen-inputs" style={{ marginTop: 12 }}>
              <div className="gen-input-wrap">
                <label className="gen-label">{t.profilePage.currentPlan}</label>
                <input value={activePlan === 'FREE' ? `${t.profilePage.freePlanTitle} — $0${t.profilePage.perMonth}` : activePlan === 'PRO' ? `${isTrial ? t.profilePage.trialPlanTitle : t.profilePage.proPlanTitle} — ${cadenceText}` : 'Enterprise — Custom'} readOnly className="gen-input" />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">{t.profilePage.nextBillingDate}</label>
                <input value={activePlan === 'FREE' ? '—' : formatDate(isTrial ? (billingSummary.trialEndsAt ?? '') : (billingSummary.currentPeriodEnd ?? ''))} readOnly className="gen-input" />
              </div>
              <div className="gen-input-wrap" style={{ gridColumn: '1 / -1' }}>
                <label className="gen-label">{t.profilePage.paymentMethod}</label>
                <div className="profile-email-val">
                  {billingSummary.paymentMethodLast4 ? `${billingSummary.paymentMethodBrand ?? t.profilePage.cardLabel} •••• ${billingSummary.paymentMethodLast4}` : t.profilePage.noPaymentMethod}
                </div>
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">{t.profilePage.companyName}</label>
                <input value={profile.companyName} onChange={(e) => handleChange('companyName', e.target.value)} placeholder="e.g. AutoShop Ltd" className="gen-input" />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">{t.profilePage.billingEmail}</label>
                <input type="email" value={profile.billingEmail} onChange={(e) => handleChange('billingEmail', e.target.value)} placeholder="billing@company.com" className="gen-input" />
              </div>
              <div className="gen-input-wrap">
                <label className="gen-label">{t.profilePage.vatTaxId}</label>
                <input value={profile.vatId} onChange={(e) => handleChange('vatId', e.target.value)} placeholder="e.g. EU123456789" className="gen-input" />
              </div>
              <div className="gen-input-wrap" style={{ gridColumn: '1 / -1' }}>
                <label className="gen-label">{t.profilePage.billingAddress}</label>
                <input value={profile.billingAddress} onChange={(e) => handleChange('billingAddress', e.target.value)} placeholder="Street, City, Country" className="gen-input" />
              </div>
              <div className="profile-inline-actions" style={{ gridColumn: '1 / -1' }}>
                {activePlan === 'FREE' ? (
                  <button
                    type="button"
                    className="profile-inline-link"
                    style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer' }}
                    onClick={async () => {
                      try {
                        const { url } = await webApi.createCheckoutSession({
                          successUrl: `${window.location.origin}/profile?billing=success`,
                          cancelUrl: `${window.location.origin}/profile?billing=cancelled`,
                        });
                        if (url) window.location.href = url;
                      } catch { /* ignore */ }
                    }}
                  >
                    {t.profilePage.upgradeToPro}
                  </button>
                ) : billingSummary.canManageSubscription ? (
                  <button
                    type="button"
                    className="profile-inline-link"
                    style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer' }}
                    onClick={async () => {
                      try {
                        const { url } = await webApi.createPortalSession({
                          returnUrl: `${window.location.origin}/profile`,
                        });
                        if (url) window.location.href = url;
                      } catch { /* ignore */ }
                    }}
                  >
                    {t.profilePage.manageSubscription}
                  </button>
                ) : (
                  <a href="mailto:hello@motixi.com?subject=Motixi billing support" className="profile-inline-link">
                    {t.profilePage.contactBillingSupport}
                  </a>
                )}
              </div>
            </div>
          </div>

          <button type="submit" className="gen-btn">
            {saved ? t.profilePage.saved : t.profilePage.saveProfile}
          </button>
        </form>
      </div>
    </div>
  );
}
