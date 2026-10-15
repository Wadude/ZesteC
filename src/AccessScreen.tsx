import { useState } from 'react';
import type { ClaimResult } from './access';
import { useI18n } from './useI18n';

interface Props {
  onSubmit: (code: string) => Promise<ClaimResult>;
}

/** Shown during private testing to people who don't have access yet. */
export function AccessScreen({ onSubmit }: Props) {
  const { t, lang } = useI18n();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    const result = await onSubmit(code);
    setBusy(false);
    if (result === 'invalid') setError(t.accessInvalid);
    if (result === 'offline') setError(t.accessOffline);
  };

  return (
    <div className="splash access">
      <img src="/icons/icon-192.png" alt="" width="72" height="72" className="access-icon" />
      <p className="splash-title">Zeste</p>
      <p className="access-heading">{t.accessTitle}</p>
      <p>{t.accessText}</p>
      <form className="access-form" onSubmit={submit}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ZESTE-XXXX"
          aria-label={t.testerCode}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          autoFocus
        />
        <button type="submit" className="primary-button" disabled={!code.trim() || busy}>
          {busy ? t.checkingAccess : t.accessButton}
        </button>
      </form>
      {error && (
        <p className="access-error" role="alert">
          {error}
        </p>
      )}
      <a className="access-privacy" href={`/privacy/?lang=${lang}`} target="_blank" rel="noopener">
        {t.privacyPolicy}
      </a>
    </div>
  );
}
