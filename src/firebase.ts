import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

// These values identify the Firebase project; they are not secrets.
// Access to data is controlled by firestore.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyAX9wXMxLv8_NnaogCgCw_6wrgnEHgNguc',
  authDomain: 'zestec-3af1d.firebaseapp.com',
  projectId: 'zestec-3af1d',
  storageBucket: 'zestec-3af1d.firebasestorage.app',
  messagingSenderId: '889595149816',
  appId: '1:889595149816:web:c7582d50c4bb76bec42a0d',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// The local cache keeps lists usable offline and syncs when back online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
