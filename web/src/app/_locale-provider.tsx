'use client';

import { useEffect, useState } from 'react';
import { I18nContext, dictionaries, getLocale, getLocalePrefix, type Locale, type Translations } from '@/lib/i18n';

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [t, setT] = useState<Translations>(dictionaries.en);

  useEffect(() => {
    const locale = getLocale();
    setT(dictionaries[locale]);

    // Listen for locale changes from other parts of the app
    function onStorage(e: StorageEvent) {
      if (e.key === 'motix_locale') {
        const next = (e.newValue as Locale) || 'en';
        if (next in dictionaries) {
          setT(dictionaries[next]);
          // Navigate to the correct locale-prefixed URL
          const prefix = getLocalePrefix(next);
          const pathWithoutLocale = window.location.pathname
            .replace(/^\/(ua|bg)(\/|$)/, '/')
            .replace(/\/+$/, '') || '/';
          const target = prefix + pathWithoutLocale;
          if (window.location.pathname !== target) {
            window.location.href = target;
          }
        }
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <I18nContext.Provider value={t}>
      {children}
    </I18nContext.Provider>
  );
}
