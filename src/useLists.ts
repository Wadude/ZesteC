import { useCallback, useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { copyItems, ensureDefaultList, joinWithCode } from './lists';
import type { Item, List } from './types';
import { track } from './usage';

// Items saved by the first, browser-only version of the app.
const LEGACY_KEY = 'zeste.items.v1';
const currentKey = (uid: string) => `zeste.currentList.${uid}`;

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore: the choice just won't be remembered.
  }
}

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
    .then(() => localStorage.removeItem(LEGACY_KEY))
    .catch((e) => console.error('Could not move old items', e));
}

export type JoinResult =
  | { status: 'joined'; listId: string }
  | { status: 'failed'; reason: 'offline' | 'invalid' };

/**
 * All lists the user belongs to, which one is open, and joining via invite links.
 * `joinCode` comes from a /join/CODE link the app was opened with.
 */
export function useLists(uid: string | undefined, joinCode: string | null, defaultListName: string) {
  const [lists, setLists] = useState<List[]>([]);
  const [ready, setReady] = useState(false);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [joinResult, setJoinResult] = useState<JoinResult | null>(null);

  // First run for this user: join a list if invited, otherwise make sure they have one.
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setReady(false);
    setListsLoaded(false);
    setLists([]);
    setCurrentId(readStored(currentKey(uid)));

    (async () => {
      let joined: string | null = null;
      if (joinCode) {
        try {
          joined = await joinWithCode(joinCode, uid);
          if (!cancelled) setJoinResult({ status: 'joined', listId: joined });
          track('joined');
        } catch (e) {
          const reason = (e as Error).message === 'offline' ? 'offline' : 'invalid';
          if (!cancelled) setJoinResult({ status: 'failed', reason });
        }
      }
      // Someone joining a shared list doesn't need an empty list of their own.
      const listId = joined ?? (await ensureDefaultList(uid, defaultListName));
      migrateLegacyItems(listId, uid);
      if (cancelled) return;
      if (joined) {
        setCurrentId(joined);
        writeStored(currentKey(uid), joined);
      }
      setReady(true);
    })().catch((e) => {
      console.error(e);
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [uid, joinCode]);

  // Live list of lists (names, members, invite codes).
  useEffect(() => {
    if (!uid || !ready) return;
    return onSnapshot(
      query(collection(db, 'lists'), where('memberIds', 'array-contains', uid)),
      (snap) => {
        const next = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as List & { createdAt?: { seconds: number } })
          .sort((a, b) => (a.createdAt?.seconds ?? Infinity) - (b.createdAt?.seconds ?? Infinity));
        setLists(next);
        setListsLoaded(true);
      },
      (e) => console.error('Could not load lists', e),
    );
  }, [uid, ready]);

  // Never leave someone with no list at all (e.g. after deleting or leaving the last one).
  useEffect(() => {
    if (uid && listsLoaded && lists.length === 0) {
      ensureDefaultList(uid, defaultListName).catch(console.error);
    }
  }, [uid, listsLoaded, lists.length, defaultListName]);

  // Fall back to the first list if the remembered one is gone (deleted or left).
  const current = lists.find((l) => l.id === currentId) ?? lists[0] ?? null;

  const clearJoinResult = useCallback(() => setJoinResult(null), []);

  const select = (listId: string) => {
    setCurrentId(listId);
    if (uid) writeStored(currentKey(uid), listId);
  };

  return {
    lists,
    current,
    ready: ready && lists.length > 0,
    select,
    joinResult,
    clearJoinResult,
  };
}
