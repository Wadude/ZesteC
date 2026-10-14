import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Item, Trip, TripItem } from './types';
import { lineTotal } from './units';

// A "shop" (trip) is one visit to the shops: its total, store and the items bought.
// Writes are not awaited, so they work offline and sync later.

const logError = (action: string) => (e: unknown) => console.error(`Could not ${action}`, e);

/** First moment of a month, local time. month is 0-11 and may overflow (e.g. 12 → next January). */
export const monthStart = (year: number, month: number) => new Date(year, month, 1).getTime();

export function setMonthlyBudget(listId: string, amount: number | null) {
  updateDoc(doc(db, 'lists', listId), { monthlyBudget: amount ?? deleteField() }).catch(
    logError('save budget'),
  );
}

export interface TripInput {
  total: number;
  date: number;
  store: string;
}

function tripFields(input: TripInput) {
  const store = input.store.trim();
  return { total: input.total, date: input.date, store: store || deleteField() };
}

/** "Done shopping": saves a shop with the bought items, then clears them from the list. */
export function finishShopping(listId: string, uid: string, bought: Item[], input: TripInput) {
  const items: TripItem[] = bought.map((i) => {
    const total = lineTotal(i);
    return {
      name: i.name,
      ...(i.quantity != null && { quantity: i.quantity, unit: i.unit ?? 'pcs' }),
      ...(total != null && { total: Math.round(total * 100) / 100 }),
    };
  });
  const batch = writeBatch(db);
  const store = input.store.trim();
  batch.set(doc(collection(db, 'lists', listId, 'trips')), {
    total: input.total,
    date: input.date,
    ...(store && { store }),
    itemCount: items.length,
    items,
    enteredBy: uid,
    createdAt: Date.now(),
  });
  for (const i of bought) batch.delete(doc(db, 'lists', listId, 'items', i.id));
  batch.commit().catch(logError('save shop'));
  rememberStore(store);
}

/** A shop added by hand, without items. */
export function addTrip(listId: string, uid: string, input: TripInput) {
  const store = input.store.trim();
  setDoc(doc(collection(db, 'lists', listId, 'trips')), {
    total: input.total,
    date: input.date,
    ...(store && { store }),
    itemCount: 0,
    items: [],
    enteredBy: uid,
    createdAt: Date.now(),
  }).catch(logError('add shop'));
  rememberStore(store);
}

export function updateTrip(listId: string, tripId: string, input: TripInput) {
  updateDoc(doc(db, 'lists', listId, 'trips', tripId), tripFields(input)).catch(logError('update shop'));
  rememberStore(input.store.trim());
}

export function deleteTrip(listId: string, tripId: string) {
  deleteDoc(doc(db, 'lists', listId, 'trips', tripId)).catch(logError('delete shop'));
}

/** Live list of a month's shops, newest first. */
export function useTrips(listId: string, year: number, month: number) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    return onSnapshot(
      query(
        collection(db, 'lists', listId, 'trips'),
        where('date', '>=', monthStart(year, month)),
        where('date', '<', monthStart(year, month + 1)),
        orderBy('date', 'desc'),
      ),
      (snap) => {
        setTrips(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Trip));
        setLoaded(true);
      },
      logError('load shops'),
    );
  }, [listId, year, month]);

  return { trips, loaded };
}

/** Totals for the budget screen. */
export function summarise(trips: Trip[]) {
  const spent = trips.reduce((sum, t) => sum + t.total, 0);
  const byStore = new Map<string, number>();
  for (const t of trips) {
    const key = t.store?.trim() || '';
    byStore.set(key, (byStore.get(key) ?? 0) + t.total);
  }
  return {
    spent,
    count: trips.length,
    average: trips.length ? spent / trips.length : 0,
    byStore: [...byStore.entries()].sort((a, b) => b[1] - a[1]),
  };
}

// --- Recently used store names (per device), offered as quick choices ---

const STORES_KEY = 'zeste.stores';

export function recentStores(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function rememberStore(store: string) {
  if (!store) return;
  const next = [store, ...recentStores().filter((s) => s.toLowerCase() !== store.toLowerCase())].slice(0, 6);
  try {
    localStorage.setItem(STORES_KEY, JSON.stringify(next));
  } catch {
    // Ignore: suggestions just won't be remembered.
  }
}
