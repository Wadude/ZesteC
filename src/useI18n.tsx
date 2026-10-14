import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { MESSAGES, detectLang, type Lang, type Messages } from './i18n';

const STORAGE_KEY = 'zeste.lang';

function load(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'fr' || v === 'mfe') return v;
  } catch {
    // Fall through to the phone's language.
  }
  return detectLang();
}

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Messages;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(load);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore: the choice just won't be remembered.
    }
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t: MESSAGES[lang] }}>{children}</I18nContext.Provider>
  );
}

/** The current language and its text: `const { t } = useI18n(); t.add` */
export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
