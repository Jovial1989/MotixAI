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
    <div className="lang-seg" role="radiogroup" aria-label="Language">
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          type="button"
          role="radio"
          aria-checked={lang.code === currentLocale}
          className={`lang-seg-btn${lang.code === currentLocale ? ' lang-seg-btn--on' : ''}`}
          onClick={() => switchTo(lang)}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
