import { useEffect, useState } from 'react';
import { onIdTokenChanged, signInAnonymously, type User } from 'firebase/auth';
import { auth } from './firebase';
import { copyItems, ensureDefaultList } from './lists';
import type { Item, Profile } from './types';

// Items saved by the first, browser-only version of the app.
const LEGACY_KEY = 'zeste.items.v1';

function migrateLegacyItems(listId: string, uid: string) {
  let items: Item[];
  try {
    items = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? '[]');
  } catch {
    return;
  }
  if (items.length === 0) return;
  // Only forget the old copy once the server has it.
  copyItems(items, listId, uid)
    .then(() => {
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        // Ignore.
      }
    })
    .catch((e) => console.error('Could not move old items', e));
}

export function toProfile(u: User): Profile {
  const google = u.providerData[0];
  return {
    uid: u.uid,
    isGuest: u.isAnonymous,
    name: u.displayName ?? google?.displayName ?? null,
    email: u.email ?? google?.email ?? null,
    photoURL: u.photoURL ?? google?.photoURL ?? null,
  };
}

export function useSession() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listId, setListId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Everyone starts as a guest (anonymous account) and can link Google later.
  // onIdTokenChanged also fires when a guest links Google, so the profile updates.
  useEffect(
    () =>
      onIdTokenChanged(auth, (u) => {
        if (u) {
          setProfile(toProfile(u));
        } else {
          setProfile(null);
          signInAnonymously(auth).catch(() =>
            setError('Could not connect. Check your internet connection and try again.'),
          );
        }
      }),
    [],
  );

  const uid = profile?.uid;
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setListId(null);
    ensureDefaultList(uid)
      .then((id) => {
        migrateLegacyItems(id, uid);
        if (!cancelled) setListId(id);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setError('Could not load your list.');
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const refresh = () => {
    if (auth.currentUser) setProfile(toProfile(auth.currentUser));
  };

  return { profile, listId, error, refresh };
}
