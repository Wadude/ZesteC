import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { MESSAGES, detectLang, type Lang, type Messages } from './i18n';
import { CURRENCIES, setCurrency as applyCurrency } from './units';

const STORAGE_KEY = 'zeste.lang';
const CURRENCY_KEY = 'zeste.currency';

function load(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'en' || v === 'fr' || v === 'mfe') return v;
  } catch {
    // Fall through to the phone's language.
  }
  return detectLang();
}

function loadCurrency(): string {
  try {
    const v = localStorage.getItem(CURRENCY_KEY);
    if (v && CURRENCIES.some((c) => c.code === v)) return v;
  } catch {
    // Fall through to the default.
  }
  return CURRENCIES[0].code;
}

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Messages;
  /** Currency code, e.g. "MUR". Amounts are shown with its symbol; they're never converted. */
  currency: string;
  setCurrency: (code: string) => void;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(load);
  const [currency, setCurrencyState] = useState<string>(() => {
    const code = loadCurrency();
    applyCurrency(code);
    return code;
  });

  const setCurrency = (code: string) => {
    applyCurrency(code);
    setCurrencyState(code);
    try {
      localStorage.setItem(CURRENCY_KEY, code);
    } catch {
      // Ignore: the choice just won't be remembered.
    }
  };

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
    <I18nContext.Provider value={{ lang, setLang, t: MESSAGES[lang], currency, setCurrency }}>
      {children}
    </I18nContext.Provider>
  );
}

/** The current language and its text: `const { t } = useI18n(); t.add` */
export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
