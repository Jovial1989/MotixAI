'use client';

import { useCallback } from 'react';
import { type Locale, getLocale, setLocale, setCountry, getLocalePrefix } from '@/lib/i18n';

const LANGS: { code: Locale; label: string; country: 'global' | 'ukraine' | 'bulgaria' }[] = [
  { code: 'en', label: 'EN', country: 'global' },
  { code: 'uk', label: 'UA', country: 'ukraine' },
  { code: 'bg', label: 'BG', country: 'bulgaria' },
];

export default function LangSwitcher() {
  const currentLocale = typeof window !== 'undefined' ? getLocale() : 'en';

  const switchTo = useCallback((lang: typeof LANGS[number]) => {
    if (lang.code === currentLocale) return;
    setCountry(lang.country);
    setLocale(lang.code);
    const prefix = getLocalePrefix(lang.code);
    const pathWithoutLocale = window.location.pathname
      .replace(/^\/(ua|bg)(\/|$)/, '/')
      .replace(/\/+$/, '') || '/';
    window.location.href = prefix + pathWithoutLocale;
  }, [currentLocale]);

  return (
    <div className="lang-switcher">
      {LANGS.map((lang, i) => (
        <span key={lang.code}>
          {i > 0 && <span className="lang-sep">/</span>}
          <button
            type="button"
            className={`lang-btn${lang.code === currentLocale ? ' lang-btn--active' : ''}`}
            onClick={() => switchTo(lang)}
            aria-label={`Switch to ${lang.label}`}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  );
}
