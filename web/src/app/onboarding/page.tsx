'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { webApi } from '@/lib/api';
import { useT } from '@/lib/i18n';
import type { PlanType } from '@motixai/api-client';

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const t = useT();

  // ── Step content ──────────────────────────────────────────────────────────
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

  const PLANS: Array<{ id: PlanType; icon: string; name: string; desc: string; badge?: string }> = [
    {
      id: 'trial',
      icon: '🚀',
      name: t.onboarding.planTrialName,
      desc: t.onboarding.planTrialDesc,
      badge: t.onboarding.planTrialBadge,
    },
    {
      id: 'free',
      icon: '🔓',
      name: t.onboarding.planFreeName,
      desc: t.onboarding.planFreeDesc,
    },
  ];

  const [step, setStep] = useState(0); // 0 and 1 are info screens, 2 is plan selection
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('trial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const totalSteps = 3; // 2 info + 1 plan

  async function handleFinish() {
    setLoading(true);
    setError(null);
    try {
      await webApi.selectPlan(selectedPlan);
      await webApi.completeOnboarding();
      localStorage.setItem('motix_onboarding_done', 'true');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.onboarding.somethingWentWrong);
      setLoading(false);
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
            disabled={loading}
          >
            {loading ? (
              <><span className="gen-spinner" /> {t.onboarding.settingUp}</>
            ) : isLastStep ? (
              selectedPlan === 'trial' ? t.onboarding.startMyFreeTrial :
              t.onboarding.continueFree
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
