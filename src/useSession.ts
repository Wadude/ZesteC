import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Item } from './types';

// Items saved by the first, browser-only version of the app.
const LEGACY_KEY = 'zeste.items.v1';

// Note: Firestore writes are not awaited. They apply to the local cache straight away
// and sync in the background, so the app keeps working offline.

async function ensureDefaultList(uid: string): Promise<string> {
  const mine = await getDocs(
    query(collection(db, 'lists'), where('memberIds', 'array-contains', uid), limit(1)),
  );
  if (!mine.empty) return mine.docs[0].id;

  // Using the uid as the id makes this safe to run twice.
  const listId = uid;
  const created = setDoc(doc(db, 'lists', listId), {
    name: 'My list',
    ownerId: uid,
    memberIds: [uid],
    createdAt: serverTimestamp(),
  }).catch((e) => console.error('Could not create list', e));
  // Give the server a moment to confirm, so reading the items is allowed straight away.
  // Offline, carry on after the timeout; the list syncs later.
  await Promise.race([created, new Promise((r) => setTimeout(r, 4000))]);
  return listId;
}

function migrateLegacyItems(listId: string, uid: string) {
  let items: Item[];
  try {
    items = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? '[]');
  } catch {
    return;
  }
  if (items.length === 0) return;

  const batch = writeBatch(db);
  for (const { id, ...data } of items) {
    batch.set(doc(db, 'lists', listId, 'items', id), { ...data, addedBy: uid });
  }
  // Only forget the old copy once the server has it. Re-running is harmless (same ids).
  batch
    .commit()
    .then(() => {
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        // Ignore.
      }
    })
    .catch((e) => console.error('Could not move old items', e));
}

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [listId, setListId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Everyone starts as a guest (anonymous account). Google login comes next.
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        if (u) setUser(u);
        else
          signInAnonymously(auth).catch(() =>
            setError('Could not connect. Check your internet connection and try again.'),
          );
      }),
    [],
  );

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    ensureDefaultList(user.uid)
      .then((id) => {
        migrateLegacyItems(id, user.uid);
        if (!cancelled) setListId(id);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setError('Could not load your list.');
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { user, listId, error };
}
