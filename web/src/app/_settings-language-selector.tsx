'use client';

import { useMemo } from 'react';
import { type Locale, getLocale, getLocalePrefix, setCountry, setLocale } from '@/lib/i18n';

const LANG_OPTIONS: Array<{
  code: Locale;
  label: string;
  country: 'global' | 'ukraine' | 'bulgaria';
}> = [
  { code: 'en', label: 'English', country: 'global' },
  { code: 'uk', label: 'Українська', country: 'ukraine' },
  { code: 'bg', label: 'Български', country: 'bulgaria' },
];

export default function SettingsLanguageSelector() {
  const currentLocale = useMemo(() => (typeof window === 'undefined' ? 'en' : getLocale()), []);

  function handleSelect(option: (typeof LANG_OPTIONS)[number]) {
    if (option.code === currentLocale) return;
    setCountry(option.country);
    setLocale(option.code);
    const prefix = getLocalePrefix(option.code);
    const pathWithoutLocale = window.location.pathname
      .replace(/^\/(ua|bg)(\/|$)/, '/')
      .replace(/\/+$/, '') || '/';
    window.location.href = `${prefix}${pathWithoutLocale}${window.location.search}`;
  }

  return (
    <div className="settings-language-list" role="radiogroup" aria-label="Language">
      {LANG_OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          role="radio"
          aria-checked={option.code === currentLocale}
          className={`settings-language-btn${option.code === currentLocale ? ' settings-language-btn--active' : ''}`}
          onClick={() => handleSelect(option)}
        >
          <span>{option.label}</span>
          {option.code === currentLocale ? <span className="settings-language-check">✓</span> : null}
        </button>
      ))}
    </div>
  );
}
