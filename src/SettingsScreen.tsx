import { useState } from 'react';
import { signInWithGoogle, signOut } from './account';
import { LANGUAGES } from './i18n';
import type { Profile } from './types';
import { useI18n } from './useI18n';
import type { ThemeMode } from './useTheme';

interface Props {
  profile: Profile;
  listId: string;
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onAccountChanged: () => void;
  onBack: () => void;
}

export function SettingsScreen({ profile, listId, theme, onThemeChange, onAccountChanged, onBack }: Props) {
  const { t, lang, setLang } = useI18n();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const themes: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t.themeSystem },
    { value: 'light', label: t.themeLight },
    { value: 'dark', label: t.themeDark },
  ];

  const handleSignIn = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await signInWithGoogle(listId, t.defaultListName);
      if (result === 'switched') {
        setMessage(t.welcomeBack);
      }
      onAccountChanged();
    } catch (e) {
      console.error(e);
      setMessage(t.signInFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      onBack();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app">
      <header className="header header-row">
        <button className="icon-button" aria-label={t.back} onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <h1>{t.settings}</h1>
      </header>

      <section className="card">
        <h2>{t.account}</h2>
        {profile.isGuest ? (
          <>
            <p className="muted">{t.guestText}</p>
            <button className="google-button" disabled={busy} onClick={handleSignIn}>
              <svg viewBox="0 0 48 48" aria-hidden="true" className="google-logo">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z" />
                <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
              </svg>
              {busy ? t.signingIn : t.signInGoogle}
            </button>
          </>
        ) : (
          <>
            <div className="account">
              {profile.photoURL ? (
                <img className="avatar" src={profile.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar avatar-letter" aria-hidden="true">
                  {(profile.name ?? profile.email ?? '?').charAt(0).toUpperCase()}
                </span>
              )}
              <div className="account-text">
                <p className="account-name">{profile.name ?? t.signedIn}</p>
                {profile.email && <p className="muted">{profile.email}</p>}
              </div>
            </div>
            <button className="secondary-button" disabled={busy} onClick={handleSignOut}>
              {t.signOut}
            </button>
          </>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
      </section>

      <section className="card">
        <h2>{t.appearance}</h2>
        <div className="segmented" role="radiogroup" aria-label={t.theme}>
          {themes.map((option) => (
            <button
              key={option.value}
              role="radio"
              aria-checked={theme === option.value}
              className={theme === option.value ? 'active' : ''}
              onClick={() => onThemeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>{t.language}</h2>
        <div className="segmented" role="radiogroup" aria-label={t.language}>
          {LANGUAGES.map((option) => (
            <button
              key={option.value}
              role="radio"
              lang={option.value}
              aria-checked={lang === option.value}
              className={lang === option.value ? 'active' : ''}
              onClick={() => setLang(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <p className="version">{t.version(__APP_VERSION__)}</p>
    </div>
  );
}
