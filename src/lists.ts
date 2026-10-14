import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Item, List } from './types';

// Note: most Firestore writes are not awaited. They apply to the local cache straight
// away and sync in the background, so the app keeps working offline.

const ONLINE_TIMEOUT_MS = 8000;

/** Waits for a write to reach the server, or gives up after a while (e.g. offline). */
function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ]);
}

/** Creating a list: give the server a moment to confirm, so reading its items is allowed. */
async function createListDoc(listId: string, uid: string, name: string) {
  const created = setDoc(doc(db, 'lists', listId), {
    name,
    ownerId: uid,
    memberIds: [uid],
    createdAt: serverTimestamp(),
  }).catch((e) => console.error('Could not create list', e));
  // Offline, carry on after the timeout; the list syncs later.
  await Promise.race([created, new Promise((r) => setTimeout(r, 4000))]);
}

/** Returns the user's first list, creating one (e.g. "My list") if they have none. */
export async function ensureDefaultList(uid: string, name: string): Promise<string> {
  const mine = await getDocs(
    query(collection(db, 'lists'), where('memberIds', 'array-contains', uid), limit(1)),
  );
  if (!mine.empty) return mine.docs[0].id;
  // Using the uid as the id makes this safe to run twice.
  await createListDoc(uid, uid, name);
  return uid;
}

export async function createList(uid: string, name: string): Promise<string> {
  const ref = doc(collection(db, 'lists'));
  await createListDoc(ref.id, uid, name.trim());
  return ref.id;
}

export function renameList(listId: string, name: string) {
  const trimmed = name.trim();
  if (trimmed) updateDoc(doc(db, 'lists', listId), { name: trimmed }).catch(console.error);
}

/** Owner only: deletes the list, its items and its invite link. Needs to be online. */
export async function deleteList(list: List) {
  const items = await getDocs(collection(db, 'lists', list.id, 'items'));
  const docs = items.docs;
  // A batch holds at most 500 writes.
  for (let i = 0; i < docs.length; i += 450) {
    const batch = writeBatch(db);
    docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  if (list.inviteCode) await deleteDoc(doc(db, 'invites', list.inviteCode)).catch(() => {});
  await deleteDoc(doc(db, 'lists', list.id));
}

/** Members other than the owner can leave a shared list. */
export function leaveList(listId: string, uid: string) {
  return withTimeout(
    updateDoc(doc(db, 'lists', listId), { memberIds: arrayRemove(uid) }),
    ONLINE_TIMEOUT_MS,
    'offline',
  );
}

// --- Invite links ---------------------------------------------------------

// No 0/O or 1/I, so codes are easy to read out loud.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return [...bytes].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

export function inviteUrl(code: string): string {
  return `${location.origin}/join/${code}`;
}

/** Returns the list's invite code, creating one if needed. Needs to be online. */
export async function getOrCreateInvite(list: List, uid: string): Promise<string> {
  if (list.inviteCode) return list.inviteCode;
  return createInvite(list.id, uid);
}

async function createInvite(listId: string, uid: string): Promise<string> {
  const code = newCode();
  await withTimeout(
    (async () => {
      await setDoc(doc(db, 'invites', code), { listId, createdBy: uid, createdAt: serverTimestamp() });
      await updateDoc(doc(db, 'lists', listId), { inviteCode: code });
    })(),
    ONLINE_TIMEOUT_MS,
    'offline',
  );
  return code;
}

/** Makes a new link; the old one stops working. */
export async function resetInvite(list: List, uid: string): Promise<string> {
  if (list.inviteCode) {
    await withTimeout(deleteDoc(doc(db, 'invites', list.inviteCode)), ONLINE_TIMEOUT_MS, 'offline');
  }
  return createInvite(list.id, uid);
}

export type JoinError = 'invalid' | 'offline';

/** Joins the list behind an invite code and returns its id. */
export async function joinWithCode(code: string, uid: string): Promise<string> {
  const normalised = code.toUpperCase();
  let invite;
  try {
    invite = await withTimeout(getDoc(doc(db, 'invites', normalised)), ONLINE_TIMEOUT_MS, 'offline');
  } catch {
    throw new Error('offline' satisfies JoinError);
  }
  if (!invite.exists()) throw new Error('invalid' satisfies JoinError);
  const listId = invite.data().listId as string;
  try {
    // The security rules check the code matches this list before letting us in.
    await withTimeout(
      updateDoc(doc(db, 'lists', listId), { memberIds: arrayUnion(uid), joinCode: normalised }),
      ONLINE_TIMEOUT_MS,
      'offline',
    );
  } catch (e) {
    // Already a member: the rules refuse the update, but that's fine.
    const already = await getDoc(doc(db, 'lists', listId)).catch(() => null);
    if (already?.exists() && (already.data().memberIds as string[]).includes(uid)) return listId;
    throw new Error((e as Error).message === 'offline' ? 'offline' : 'invalid');
  }
  return listId;
}

// --- Copying items -----------------------------------------------------------

/** Writes items into a list, keeping their ids so running it twice is harmless. */
export function copyItems(items: Item[], listId: string, uid: string): Promise<void> {
  const batch = writeBatch(db);
  for (const { id, ...data } of items) {
    batch.set(doc(db, 'lists', listId, 'items', id), { ...data, addedBy: uid });
  }
  return batch.commit();
}
