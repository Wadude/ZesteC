import {
  GoogleAuthProvider,
  linkWithPopup,
  signInWithCredential,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { copyItems, ensureDefaultList } from './lists';
import type { Item } from './types';

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
