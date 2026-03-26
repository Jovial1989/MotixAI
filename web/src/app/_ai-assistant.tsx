'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { AssistantChatTurn } from '@motixai/api-client';
import { webApi } from '@/lib/api';
import { getLocale, useT } from '@/lib/i18n';

const STORAGE_PREFIX = 'motix_ai_assistant_history_v1';
const ESCALATION_PATTERN = /\b(contact human|support|manager|talk to person|talk to a person)\b/i;

function historyKey(locale: string): string {
  return `${STORAGE_PREFIX}:${locale}`;
}

function readSupportDefaults() {
  let name = '';
  let email = '';

  try {
    const profileRaw = localStorage.getItem('motix_profile');
    if (profileRaw) {
      const profile = JSON.parse(profileRaw) as { firstName?: string; lastName?: string };
      name = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
    }
  } catch {
    // Ignore malformed cached profile.
  }

  try {
    const token = localStorage.getItem('motix_access_token');
    if (token) {
      const body = token.split('.')[1];
      if (body) {
        const b64 = body.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(body.length / 4) * 4, '=');
        const payload = JSON.parse(atob(b64)) as { email?: string; sub?: string };
        email = payload.email ?? payload.sub ?? '';
      }
    }
  } catch {
    // Ignore invalid session tokens.
  }

  return { name, email };
}

function loadHistory(locale: string, welcomeMessage: string): AssistantChatTurn[] {
  try {
    const raw = localStorage.getItem(historyKey(locale));
    if (!raw) {
      return [{ role: 'assistant', content: welcomeMessage }];
    }
    const parsed = JSON.parse(raw) as AssistantChatTurn[];
    const valid = Array.isArray(parsed)
      ? parsed.filter((item) =>
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string' &&
        item.content.trim().length > 0,
      ).slice(-24)
      : [];
    return valid.length > 0 ? valid : [{ role: 'assistant', content: welcomeMessage }];
  } catch {
    return [{ role: 'assistant', content: welcomeMessage }];
  }
}

export default function AiAssistant() {
  const t = useT();
  const pathname = usePathname();
  const locale = getLocale();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<AssistantChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [escalationSent, setEscalationSent] = useState(false);
  const [escalationSubmitting, setEscalationSubmitting] = useState(false);
  const [escalationError, setEscalationError] = useState<string | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const welcomeMessage = useMemo(() => t.assistant.welcomeBody, [t.assistant.welcomeBody]);

  useEffect(() => {
    setHydrated(true);
    const defaults = readSupportDefaults();
    setContactName((prev) => prev || defaults.name);
    setContactEmail((prev) => prev || defaults.email);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setHistory(loadHistory(locale, welcomeMessage));
    setEscalationOpen(false);
    setEscalationSent(false);
    setEscalationError(null);
  }, [hydrated, locale, welcomeMessage]);

  useEffect(() => {
    if (!hydrated || history.length === 0) return;
    try {
      localStorage.setItem(historyKey(locale), JSON.stringify(history.slice(-24)));
    } catch {
      // Ignore storage quota and privacy mode failures.
    }
  }, [history, hydrated, locale]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [history, open, sending, escalationOpen, escalationSent]);

  function appendHistory(next: AssistantChatTurn[]) {
    setHistory(next.slice(-24));
  }

  function triggerEscalation(seedMessage: string, currentHistory: AssistantChatTurn[]) {
    const handoffMessage = { role: 'assistant', content: t.assistant.humanPromptBody } satisfies AssistantChatTurn;
    appendHistory([...currentHistory, handoffMessage]);
    setEscalationOpen(true);
    setEscalationSent(false);
    setEscalationError(null);
    setContactMessage((prev) => prev || seedMessage);
  }

  async function handleSend() {
    const value = draft.trim();
    if (!value || sending) return;

    const nextHistory = [...history, { role: 'user', content: value } satisfies AssistantChatTurn];
    appendHistory(nextHistory);
    setDraft('');

    if (ESCALATION_PATTERN.test(value)) {
      triggerEscalation(value, nextHistory);
      return;
    }

    setSending(true);
    try {
      const result = await webApi.sendAssistantMessage({
        messages: nextHistory,
        language: locale,
        pagePath: pathname,
        pageTitle: document.title,
      });
      appendHistory([
        ...nextHistory,
        {
          role: 'assistant',
          content: result.reply?.trim() || t.assistant.responseError,
        },
      ]);
      if (result.escalationSuggested) {
        setEscalationOpen(true);
      }
    } catch {
      appendHistory([
        ...nextHistory,
        { role: 'assistant', content: t.assistant.responseError },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleEscalationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (escalationSubmitting) return;

    setEscalationError(null);
    setEscalationSubmitting(true);
    try {
      await webApi.escalateSupport({
        name: contactName.trim(),
        email: contactEmail.trim(),
        message: contactMessage.trim(),
        language: locale,
        pagePath: pathname,
        pageTitle: document.title,
        transcript: history,
      });
      setEscalationSent(true);
      setEscalationOpen(false);
      appendHistory([
        ...history,
        { role: 'assistant', content: t.assistant.successBody },
      ]);
    } catch (error) {
      setEscalationError(error instanceof Error ? error.message : t.assistant.escalationError);
    } finally {
      setEscalationSubmitting(false);
    }
  }

  if (!hydrated) return null;

  return (
    <>
      <button
        type="button"
        className={`ai-assistant-launcher${open ? ' ai-assistant-launcher--open' : ''}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? t.assistant.close : t.assistant.open}
      >
        <span className="ai-assistant-launcher-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2.25l1.6 4.15 4.15 1.6-4.15 1.6L9 13.75l-1.6-4.15-4.15-1.6 4.15-1.6L9 2.25z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="ai-assistant-launcher-copy">
          <span className="ai-assistant-launcher-label">{t.assistant.label}</span>
        </span>
      </button>

      {open && (
        <div className="ai-assistant-shell" role="dialog" aria-modal="false" aria-label={t.assistant.title}>
          <div className="ai-assistant-header">
            <div>
              <p className="ai-assistant-eyebrow">{t.assistant.label}</p>
              <h2 className="ai-assistant-title">{t.assistant.title}</h2>
              <p className="ai-assistant-sub">{t.assistant.sub}</p>
            </div>
            <button
              type="button"
              className="ai-assistant-close"
              onClick={() => setOpen(false)}
              aria-label={t.assistant.close}
            >
              ✕
            </button>
          </div>

          <div className="ai-assistant-body">
            <div className="ai-assistant-thread" ref={scrollRef}>
              {history.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`ai-bubble ai-bubble--${message.role}`}
                >
                  <span className="ai-bubble-role">
                    {message.role === 'assistant' ? t.assistant.label : t.assistant.youLabel}
                  </span>
                  <p className="ai-bubble-copy">{message.content}</p>
                </div>
              ))}
              {sending && (
                <div className="ai-bubble ai-bubble--assistant ai-bubble--pending">
                  <span className="ai-bubble-role">{t.assistant.label}</span>
                  <p className="ai-bubble-copy">{t.assistant.thinking}</p>
                </div>
              )}
              {escalationSent && (
                <div className="ai-assistant-state ai-assistant-state--success">
                  <p className="ai-assistant-state-title">{t.assistant.successTitle}</p>
                  <p className="ai-assistant-state-copy">{t.assistant.successBody}</p>
                </div>
              )}
            </div>

            {(escalationOpen || escalationSent) && !escalationSent && (
              <form className="ai-escalation-card" onSubmit={handleEscalationSubmit}>
                <div className="ai-escalation-copy">
                  <p className="ai-escalation-title">{t.assistant.humanPromptTitle}</p>
                  <p className="ai-escalation-sub">{t.assistant.humanPromptBody}</p>
                </div>

                <label className="ai-escalation-field">
                  <span>{t.assistant.nameLabel}</span>
                  <input value={contactName} onChange={(event) => setContactName(event.target.value)} required />
                </label>

                <label className="ai-escalation-field">
                  <span>{t.assistant.emailLabel}</span>
                  <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} required />
                </label>

                <label className="ai-escalation-field">
                  <span>{t.assistant.messageLabel}</span>
                  <textarea value={contactMessage} onChange={(event) => setContactMessage(event.target.value)} rows={4} required />
                </label>

                {escalationError && <p className="ai-escalation-error">{escalationError}</p>}

                <div className="ai-escalation-actions">
                  <button
                    type="button"
                    className="ai-escalation-back"
                    onClick={() => {
                      setEscalationOpen(false);
                      setEscalationError(null);
                    }}
                  >
                    {t.assistant.backToChat}
                  </button>
                  <button type="submit" className="ai-escalation-submit" disabled={escalationSubmitting}>
                    {escalationSubmitting ? t.assistant.submittingRequest : t.assistant.submitRequest}
                  </button>
                </div>
              </form>
            )}

            {!escalationOpen && (
              <div className="ai-assistant-composer">
                <textarea
                  className="ai-assistant-input"
                  placeholder={t.assistant.inputPlaceholder}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  rows={2}
                />
                <button type="button" className="ai-assistant-send" onClick={() => void handleSend()} disabled={sending || !draft.trim()}>
                  {sending ? t.assistant.sending : t.assistant.send}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
