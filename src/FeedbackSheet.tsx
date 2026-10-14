import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Sheet } from './Sheet';
import type { Profile } from './types';
import { useI18n } from './useI18n';

type Kind = 'problem' | 'idea' | 'other';

interface Props {
  profile: Profile;
  /** Where feedback was opened from, e.g. "list" or "settings". */
  screen: string;
  onClose: () => void;
}

/** Testers' comments go to the "feedback" collection, readable in the Firebase console only. */
export function FeedbackSheet({ profile, screen, onClose }: Props) {
  const { t, lang } = useI18n();
  const [kind, setKind] = useState<Kind>('problem');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const kinds: { value: Kind; label: string }[] = [
    { value: 'problem', label: `🐞 ${t.feedbackProblem}` },
    { value: 'idea', label: `💡 ${t.feedbackIdea}` },
    { value: 'other', label: `💬 ${t.feedbackOther}` },
  ];

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    // Not awaited: it sends in the background, even if the connection is patchy.
    addDoc(collection(db, 'feedback'), {
      kind,
      message: text.slice(0, 2000),
      uid: profile.uid,
      name: profile.name ?? null,
      email: profile.email ?? null,
      screen,
      lang,
      appVersion: __APP_VERSION__,
      device: navigator.userAgent.slice(0, 300),
      createdAt: serverTimestamp(),
    }).catch((err) => console.error('Could not send feedback', err));
    setSent(true);
  };

  return (
    <Sheet label={t.feedbackTitle} onClose={onClose}>
      <h2 className="sheet-title">{t.feedbackTitle}</h2>
      {sent ? (
        <>
          <p className="feedback-thanks" role="status">
            {t.feedbackThanks}
          </p>
          <button type="button" className="primary-button wide" onClick={onClose}>
            OK
          </button>
        </>
      ) : (
        <form className="sheet-form" onSubmit={send}>
          <p className="muted small">{t.feedbackIntro}</p>
          <div className="segmented" role="radiogroup" aria-label={t.feedbackTitle}>
            {kinds.map((k) => (
              <button
                key={k.value}
                type="button"
                role="radio"
                aria-checked={kind === k.value}
                className={kind === k.value ? 'active' : ''}
                onClick={() => setKind(k.value)}
              >
                {k.label}
              </button>
            ))}
          </div>
          <textarea
            className="feedback-text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.feedbackPlaceholder}
            aria-label={t.feedbackTitle}
            maxLength={2000}
            rows={5}
            autoFocus
          />
          <p className="hint">{t.feedbackNote}</p>
          <div className="sheet-actions">
            <span className="spacer" />
            <button type="button" className="secondary-button small" onClick={onClose}>
              {t.cancel}
            </button>
            <button type="submit" className="primary-button" disabled={!message.trim()}>
              {t.feedbackSend}
            </button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
