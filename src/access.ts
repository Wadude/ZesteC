import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Private testing: each account needs a testers/{uid} document, created with a valid
// tester code or an invite-link code. The security rules check the code, and every
// other read or write requires that document, so the gate can't be skipped.

const CODE_KEY = 'zeste.testerCode';
const okKey = (uid: string) => `zeste.tester.${uid}`;

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
    // Ignore: worst case the code is asked for again.
  }
}

export type ClaimResult = 'ok' | 'invalid' | 'offline';

async function hasAccess(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'testers', uid));
  return snap.exists();
}

async function claim(uid: string, code: string): Promise<ClaimResult> {
  const normalised = code.trim().toUpperCase();
  if (!normalised) return 'invalid';
  try {
    await Promise.race([
      setDoc(doc(db, 'testers', uid), { code: normalised, joinedAt: serverTimestamp() }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('offline')), 8000)),
    ]);
    return 'ok';
  } catch (e) {
    return (e as Error).message === 'offline' ? 'offline' : 'invalid';
  }
}

export type AccessState = 'checking' | 'needCode' | 'ok';

/**
 * Whether this account may use Zeste during private testing.
 * Tries, in order: remembered on this device, already a tester, the invite-link code,
 * then the tester code used before on this device (e.g. after signing out).
 */
export function useAccess(uid: string | undefined, inviteCode: string | null) {
  const [state, setState] = useState<AccessState>('checking');

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    const done = (ok: boolean) => {
      if (cancelled) return;
      if (ok) write(okKey(uid), '1');
      setState(ok ? 'ok' : 'needCode');
    };
    setState('checking');
    if (read(okKey(uid))) {
      done(true);
      return;
    }
    (async () => {
      if (await hasAccess(uid).catch(() => false)) return done(true);
      for (const code of [inviteCode, read(CODE_KEY)]) {
        if (code && (await claim(uid, code)) === 'ok') return done(true);
      }
      done(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, inviteCode]);

  /** Code typed on the access screen. */
  const submit = useCallback(
    async (code: string): Promise<ClaimResult> => {
      if (!uid) return 'offline';
      const result = await claim(uid, code);
      if (result === 'ok') {
        write(CODE_KEY, code.trim().toUpperCase());
        write(okKey(uid), '1');
        setState('ok');
      }
      return result;
    },
    [uid],
  );

  return { state, submit };
}
