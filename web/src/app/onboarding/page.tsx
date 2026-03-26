'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { webApi } from '@/lib/api';
import { useT } from '@/lib/i18n';
import type { PlanType } from '@motixai/api-client';
import { storeAuthSession } from '@/lib/session';

export default function OnboardingPage() {
  const t = useT();

  const STEPS = [
    {
      icon: '🔧',
      heading: t.onboarding.welcomeHeading,
      sub: t.onboarding.welcomeSub,
      content: null,
    },
    {
      icon: '⚡',
      heading: t.onboarding.featuresHeading,
      sub: t.onboarding.featuresSub,
      content: (
        <div className="ob-features">
          {[
            { icon: '📋', title: t.onboarding.feat1title, desc: t.onboarding.feat1desc },
            { icon: '🖼️', title: t.onboarding.feat2title, desc: t.onboarding.feat2desc },
            { icon: '💬', title: t.onboarding.feat3title, desc: t.onboarding.feat3desc },
          ].map((f) => (
            <div className="ob-feature" key={f.title}>
              <span className="ob-feature-icon">{f.icon}</span>
              <div className="ob-feature-text">
                <strong>{f.title}</strong>
                <span>{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const PLANS: Array<{ id: PlanType; icon: string; name: string; desc: string; badge?: string; note?: string }> = [
    {
      id: 'trial',
      icon: '🚀',
      name: t.onboarding.planTrialName,
      desc: t.onboarding.planTrialDesc,
      badge: t.onboarding.planTrialBadge,
      note: t.onboarding.planTrialNote,
    },
  ];

  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('trial');
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const totalSteps = 3;

  async function finalizeActivatedAccount() {
    const refreshToken = localStorage.getItem('motix_refresh_token');
    if (!refreshToken) throw new Error(t.onboarding.somethingWentWrong);

    const refreshed = await webApi.refresh({ refreshToken });
    storeAuthSession(refreshed);
    if (refreshed.user.subscriptionStatus !== 'active') {
      throw new Error(t.onboarding.somethingWentWrong);
    }

    await webApi.completeOnboarding();
    storeAuthSession({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      user: {
        ...refreshed.user,
        hasCompletedOnboarding: true,
      },
    });
    router.push('/dashboard');
  }

  useEffect(() => {
    const billing = new URLSearchParams(window.location.search).get('billing');
    if (!billing) return;

    if (billing === 'cancelled') {
      setError(t.dashboard.billingCancelledNotice);
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (billing === 'trial-started' || billing === 'success') {
      setLoading(true);
      finalizeActivatedAccount()
        .catch((err) => {
          setError(err instanceof Error ? err.message : t.onboarding.somethingWentWrong);
          setLoading(false);
        })
        .finally(() => {
          window.history.replaceState({}, '', window.location.pathname);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFinish() {
    setLoading(true);
    setError(null);
    try {
      if (selectedPlan !== 'trial') {
        throw new Error(t.onboarding.somethingWentWrong);
      }
      const { url } = await webApi.createCheckoutSession({
        successUrl: `${window.location.origin}/onboarding?billing=trial-started`,
        cancelUrl: `${window.location.origin}/onboarding?billing=cancelled`,
        trial: true,
      });
      if (!url) throw new Error(t.onboarding.somethingWentWrong);
      window.location.href = url;
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : t.onboarding.somethingWentWrong);
      setLoading(false);
    }
  }

  async function handlePromoRedeem() {
    const trimmed = promoCode.trim();
    if (!trimmed) return;
    setPromoLoading(true);
    setError(null);
    try {
      await webApi.redeemPromo(trimmed);
      await finalizeActivatedAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.onboarding.somethingWentWrong);
    } finally {
      setPromoLoading(false);
    }
  }

  function next() {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleFinish();
  }

  const isLastStep = step === totalSteps - 1;

  return (
    <main className="ob-page">
      <Link href="/" className="auth-logo">Motixi</Link>

      <div className="ob-card">
        {/* Progress dots */}
        <div className="ob-steps">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`ob-step-dot${i === step ? ' active' : i < step ? ' done' : ''}`}
            />
          ))}
        </div>

        {/* Info screens (step 0 and 1) */}
        {step < 2 && (
          <>
            <div className="ob-icon">{STEPS[step].icon}</div>
            <div>
              <h1 className="ob-heading">{STEPS[step].heading}</h1>
              <p className="ob-sub">{STEPS[step].sub}</p>
            </div>
            {STEPS[step].content}
          </>
        )}

        {/* Plan selection (step 2) */}
        {step === 2 && (
          <>
            <div>
              <h1 className="ob-heading">{t.onboarding.choosePlanHeading}</h1>
              <p className="ob-sub">{t.onboarding.choosePlanSub}</p>
            </div>

            <div className="ob-plans">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  className={`ob-plan${selectedPlan === plan.id ? ' selected' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                  type="button"
                >
                  {plan.badge && <span className="ob-plan-badge">{plan.badge}</span>}
                  <span className="ob-plan-icon">{plan.icon}</span>
                  <div className="ob-plan-body">
                    <div className="ob-plan-name">{plan.name}</div>
                    <div className="ob-plan-desc">{plan.desc}</div>
                  </div>
                  <span className="ob-plan-check">
                    {selectedPlan === plan.id && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                </button>
              ))}
            </div>

            <p className="ob-trial-note">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M1 7a6 6 0 1112 0A6 6 0 011 7z" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M7 4.5v3M7 9.5v.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {t.onboarding.planTrialNote}
            </p>

            <div className="sett-promo-section" style={{ marginTop: 16 }}>
              <p className="sett-promo-label">{t.settingsView.havePromoCode}</p>
              <div className="sett-promo-row">
                <input
                  className="gen-input sett-promo-input"
                  placeholder={t.settingsView.enterCode}
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <button
                  type="button"
                  className="sett-promo-btn"
                  onClick={handlePromoRedeem}
                  disabled={promoLoading || !promoCode.trim()}
                >
                  {promoLoading ? <span className="gen-spinner" /> : t.settingsView.apply}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="ob-actions">
          <button
            type="button"
            className="auth-btn-primary"
            onClick={next}
            disabled={loading || promoLoading}
          >
            {loading ? (
              <><span className="gen-spinner" /> {t.onboarding.settingUp}</>
            ) : isLastStep ? (
              t.onboarding.startMyFreeTrial
            ) : (
              t.common.continue_
            )}
          </button>

          {!isLastStep && step > 0 && (
            <button type="button" className="ob-btn-skip" onClick={() => setStep(2)}>
              {t.onboarding.skipToPlanSelection}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
