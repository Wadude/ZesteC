import { useEffect, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

// Read by the small script in index.html too, so the right theme shows before React loads.
const STORAGE_KEY = 'zeste.theme';

function load(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(load);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'system') root.removeAttribute('data-theme');
    else root.dataset.theme = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore: the choice just won't be remembered.
    }
  }, [mode]);

  return [mode, setMode] as const;
}
