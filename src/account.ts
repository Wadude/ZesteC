import {
  GoogleAuthProvider,
  deleteUser,
  linkWithPopup,
  reauthenticateWithPopup,
  signInWithCredential,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import {
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { copyItems, deleteList, ensureDefaultList } from './lists';
import type { Item, List } from './types';
import { stopUsage } from './usage';

export type SignInResult = 'linked' | 'switched' | 'cancelled';

/**
 * Signs a guest in with Google.
 * - Normally the guest account is upgraded in place, so the list stays as it is.
 * - If that Google account already uses Zeste (e.g. on another phone), we switch to it
 *   and copy this device's guest items into its list, so nothing is lost.
 */
export async function signInWithGoogle(
  guestListId: string,
  defaultListName: string,
): Promise<SignInResult> {
  const guest = auth.currentUser;
  if (!guest) throw new Error('Not signed in');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    await linkWithPopup(guest, provider);
    return 'linked';
  } catch (e) {
    if (!(e instanceof FirebaseError)) throw e;
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
      return 'cancelled';
    }
    if (e.code !== 'auth/credential-already-in-use') throw e;

    const credential = GoogleAuthProvider.credentialFromError(e);
    if (!credential) throw e;

    const snap = await getDocs(collection(db, 'lists', guestListId, 'items'));
    const guestItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Item);

    const { user } = await signInWithCredential(auth, credential);
    if (guestItems.length > 0) {
      const target = await ensureDefaultList(user.uid, defaultListName);
      copyItems(guestItems, target, user.uid).catch((err) =>
        console.error('Could not copy guest items', err),
      );
    }
    return 'switched';
  }
}

/** Signing out starts a fresh guest session. */
export function signOut() {
  return firebaseSignOut(auth);
}

export type DeleteResult = 'deleted' | 'cancelled';

/**
 * Permanently deletes the account and its data:
 * - lists only this person uses: deleted with their items and shops
 * - lists shared with others: handed to another member (who becomes owner), so the
 *   household keeps its list; items this person added there stay with the list
 * - lists someone else owns: this person leaves them
 * - their profile, usage numbers, feedback and tester record
 * - finally the sign-in account itself
 * Google accounts are asked to sign in again first (Firebase requires a recent sign-in).
 */
export async function deleteAccount(): Promise<DeleteResult> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  if (!user.isAnonymous) {
    try {
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
    } catch (e) {
      if (
        e instanceof FirebaseError &&
        (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')
      ) {
        return 'cancelled';
      }
      throw e;
    }
  }
  const uid = user.uid;
  stopUsage();

  const mine = await getDocs(query(collection(db, 'lists'), where('memberIds', 'array-contains', uid)));
  for (const d of mine.docs) {
    const list = { id: d.id, ...d.data() } as List;
    const others = list.memberIds.filter((m) => m !== uid);
    if (list.ownerId !== uid) {
      await updateDoc(d.ref, { memberIds: arrayRemove(uid) });
    } else if (others.length > 0) {
      await updateDoc(d.ref, { ownerId: others[0], memberIds: arrayRemove(uid) });
    } else {
      await deleteList(list);
    }
  }

  for (const name of ['usage', 'feedback']) {
    const docs = (await getDocs(query(collection(db, name), where('uid', '==', uid)))).docs;
    for (let i = 0; i < docs.length; i += 450) {
      const batch = writeBatch(db);
      docs.slice(i, i + 450).forEach((x) => batch.delete(x.ref));
      await batch.commit();
    }
  }
  await deleteDoc(doc(db, 'users', uid)).catch(() => {});
  // Last, because the steps above need tester access.
  await deleteDoc(doc(db, 'testers', uid)).catch(() => {});

  // Forget this account on this device (display preferences like language are kept).
  try {
    Object.keys(localStorage)
      .filter((k) => /^zeste\.(currentList|tester|testerCode|opened|stores|items)/.test(k))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore.
  }

  await deleteUser(user);
  return 'deleted';
}
