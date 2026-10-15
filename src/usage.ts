import { doc, increment, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Privacy-friendly usage numbers for the closed test: one small document per person per day
// with counts only (never list contents). Only the app owner can read them (see firestore.rules).

type Counter = 'opens' | 'itemsAdded' | 'shops' | 'invitesSent' | 'joined';

let current: { uid: string; lang: string } | null = null;

/** Local date as yyyy-mm-dd. */
export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Called once the person has access. Counts one "open" per day per device. */
export function startUsage(uid: string, lang: string) {
  current = { uid, lang };
  const key = `zeste.opened.${uid}`;
  try {
    if (localStorage.getItem(key) === today()) return;
    localStorage.setItem(key, today());
  } catch {
    // Without storage we may count an extra open; that's fine.
  }
  track('opens');
}

export function stopUsage() {
  current = null;
}

/** Adds 1 to today's count. Fire-and-forget: works offline and never blocks the app. */
export function track(counter: Counter) {
  if (!current) return;
  const { uid, lang } = current;
  const day = today();
  setDoc(
    doc(db, 'usage', `${uid}_${day}`),
    { uid, day, lang, appVersion: __APP_VERSION__, [counter]: increment(1) },
    { merge: true },
  ).catch(() => {});
}
