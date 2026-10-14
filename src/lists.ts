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
import { db } from './firebase';
import type { Item } from './types';

// Note: Firestore writes are mostly not awaited. They apply to the local cache straight
// away and sync in the background, so the app keeps working offline.

/** Returns the user's first list, creating "My list" if they have none. */
export async function ensureDefaultList(uid: string): Promise<string> {
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

/** Writes items into a list, keeping their ids so running it twice is harmless. */
export function copyItems(items: Item[], listId: string, uid: string): Promise<void> {
  const batch = writeBatch(db);
  for (const { id, ...data } of items) {
    batch.set(doc(db, 'lists', listId, 'items', id), { ...data, addedBy: uid });
  }
  return batch.commit();
}
