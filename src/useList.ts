import { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Item } from './types';

// Live view of one list's items. Changes from other devices arrive automatically.
// Writes are not awaited: they show instantly and sync in the background.

const logError = (action: string) => (e: unknown) => console.error(`Could not ${action}`, e);

export function useList(listId: string, uid: string) {
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let retry: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = onSnapshot(
      collection(db, 'lists', listId, 'items'),
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Item));
        setLoaded(true);
      },
      (e) => {
        // A brand-new list may not have reached the server yet, so the security
        // rules refuse the read. A failed listener stops, so start a new one shortly.
        logError('load items')(e);
        retry = setTimeout(() => setAttempt((n) => n + 1), Math.min(2000 * 2 ** attempt, 30000));
      },
    );
    return () => {
      unsubscribe();
      clearTimeout(retry);
    };
  }, [listId, attempt]);

  const itemRef = (id: string) => doc(db, 'lists', listId, 'items', id);

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const ref = doc(collection(db, 'lists', listId, 'items'));
    setDoc(ref, { name: trimmed, checked: false, createdAt: Date.now(), addedBy: uid }).catch(
      logError('add item'),
    );
  };

  const toggle = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) updateDoc(itemRef(id), { checked: !item.checked }).catch(logError('update item'));
  };

  const rename = (id: string, name: string) => {
    const trimmed = name.trim();
    if (trimmed) updateDoc(itemRef(id), { name: trimmed }).catch(logError('rename item'));
  };

  const remove = (id: string) => {
    deleteDoc(itemRef(id)).catch(logError('delete item'));
  };

  // Put a deleted item back (used by Undo).
  const restore = ({ id, ...data }: Item) => {
    setDoc(itemRef(id), data).catch(logError('restore item'));
  };

  const byCreated = (a: Item, b: Item) => a.createdAt - b.createdAt;
  const toBuy = items.filter((i) => !i.checked).sort(byCreated);
  const bought = items.filter((i) => i.checked).sort(byCreated);

  return { loaded, toBuy, bought, add, toggle, rename, remove, restore };
}
