'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ensureAppSession, hasValidStoredSession } from '@/lib/guest-access';
import { useT } from '@/lib/i18n';

export default function ProductHeroActions() {
  const t = useT();
  const router = useRouter();
  const timeoutRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
  }, []);

  function showToast(message: string) {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setToast(message);
    timeoutRef.current = window.setTimeout(() => {
      setToast(null);
      timeoutRef.current = null;
    }, 4000);
  }

  async function handleTryDemo() {
    if (loading) return;
    setLoading(true);

    try {
      if (!hasValidStoredSession()) await ensureAppSession();
      router.push('/app');
    } catch {
      showToast(t.productPage.guestAuthFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="product-hero-actions-wrap">
      <div className="cta-band-actions product-hero-actions">
        <Link href="/auth/signup" className="cta-primary">{t.productPage.startTrial}</Link>
        <button
          type="button"
          className="cta-secondary cta-secondary--orange"
          onClick={handleTryDemo}
          disabled={loading}
        >
          {loading ? t.authModal.guestLoadingText : t.productPage.tryDemo}
        </button>
      </div>

      <Link href="/contact" className="product-hero-link">{t.productPage.talkToFounder}</Link>

      {toast && (
        <div className="product-hero-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
