'use client';

import { useEffect, useState } from 'react';
import { hasChosenCountry } from '@/lib/i18n';
import CountrySelector from './_country-selector';

export default function LocaleGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [needsCountry, setNeedsCountry] = useState(false);

  useEffect(() => {
    if (hasChosenCountry()) {
      setReady(true);
    } else {
      setNeedsCountry(true);
    }
  }, []);

  if (needsCountry) {
    return <CountrySelector onDone={() => { setNeedsCountry(false); setReady(true); }} />;
  }

  if (!ready) return null;

  return <>{children}</>;
}
