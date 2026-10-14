import { useEffect, useState } from 'react';
import { onIdTokenChanged, signInAnonymously, type User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { Profile } from './types';

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

/** Signed-in user. Everyone starts as a guest (anonymous account) and can link Google later. */
export function useSession() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Save the name and photo so people on a shared list can see who's who.
  const { uid, name, photoURL } = profile ?? {};
  useEffect(() => {
    if (!uid || !name) return;
    setDoc(doc(db, 'users', uid), { name, photoURL: photoURL ?? null, updatedAt: serverTimestamp() }).catch(
      (e) => console.error('Could not save profile', e),
    );
  }, [uid, name, photoURL]);

  const refresh = () => {
    if (auth.currentUser) setProfile(toProfile(auth.currentUser));
  };

  return { profile, error, refresh };
}
