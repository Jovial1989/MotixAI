'use client';

import { useState } from 'react';
import { COUNTRIES, setCountry, type Country, dictionaries, COUNTRY_LOCALE_MAP, setLocale, getLocalePrefix } from '@/lib/i18n';

interface Props {
  onDone: () => void;
}

export default function CountrySelector({ onDone }: Props) {
  const [selected, setSelected] = useState<Country | null>(null);

  function handleConfirm() {
    if (!selected) return;
    setCountry(selected);
    // Navigate to the locale-prefixed URL
    const locale = COUNTRY_LOCALE_MAP[selected];
    const prefix = getLocalePrefix(locale);
    const pathWithoutLocale = window.location.pathname
      .replace(/^\/(ua|bg)(\/|$)/, '/')
      .replace(/\/+$/, '') || '/';
    window.location.href = prefix + pathWithoutLocale;
  }

  // Use English for the selector since user hasn't chosen yet
  // But show a preview of the selected language for the button text
  const previewLocale = selected ? COUNTRY_LOCALE_MAP[selected] : 'en';
  const previewDict = dictionaries[previewLocale];

  return (
    <div className="cs-overlay">
      <div className="cs-modal">
        <div className="cs-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.5"/>
            <ellipse cx="16" cy="16" rx="6" ry="12" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 16h24M5.5 10h21M5.5 22h21" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 className="cs-title">Choose your region</h2>
        <p className="cs-sub">This sets the language for the app. You can change it later in settings.</p>

        <div className="cs-options">
          {COUNTRIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`cs-option${selected === c.id ? ' cs-option--active' : ''}`}
              onClick={() => setSelected(c.id)}
            >
              <span className="cs-option-flag">{c.flag}</span>
              <span className="cs-option-label">{c.label}</span>
              {selected === c.id && (
                <svg className="cs-option-check" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="cs-confirm"
          disabled={!selected}
          onClick={handleConfirm}
        >
          {previewDict.countrySelector.confirm}
        </button>
      </div>
    </div>
  );
}
