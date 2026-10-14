import { useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Accent = 'green' | 'lagoon' | 'coral';

export const ACCENTS: Accent[] = ['green', 'lagoon', 'coral'];

// Both are read by the small script in index.html too, so the right look shows before React loads.
const THEME_KEY = 'zeste.theme';
const ACCENT_KEY = 'zeste.accent';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore: the choice just won't be remembered.
  }
}

/** Light, dark or follow the phone. Stored as data-theme on <html>. */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const v = read(THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'system') root.removeAttribute('data-theme');
    else root.dataset.theme = mode;
    write(THEME_KEY, mode);
  }, [mode]);

  return [mode, setMode] as const;
}

/** Accent colour. Green is the default and needs no attribute. */
export function useAccent() {
  const [accent, setAccent] = useState<Accent>(() => {
    const v = read(ACCENT_KEY);
    return v === 'lagoon' || v === 'coral' ? v : 'green';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (accent === 'green') root.removeAttribute('data-accent');
    else root.dataset.accent = accent;
    write(ACCENT_KEY, accent);
  }, [accent]);

  return [accent, setAccent] as const;
}
