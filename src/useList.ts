import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { guessCategory } from './categories';
import type { Category, Item, Unit } from './types';
import { parseItemText } from './units';
import { track } from './usage';

export interface ItemChanges {
  name: string;
  quantity: number | null;
  unit: Unit;
  price: number | null;
  priceIsTotal: boolean;
  category: Category;
}

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

  /** Adds an item. Text like "Rice 5kg" or "2 eggs" fills in the quantity. */
  const add = (text: string) => {
    if (!text.trim()) return;
    const { name, quantity, unit } = parseItemText(text);
    const ref = doc(collection(db, 'lists', listId, 'items'));
    const now = Date.now();
    // New items go to the bottom: order uses the same scale as createdAt.
    setDoc(ref, {
      name,
      checked: false,
      createdAt: now,
      order: now,
      addedBy: uid,
      category: guessCategory(name),
      ...(quantity != null && { quantity, unit }),
    }).catch(logError('add item'));
    track('itemsAdded');
  };

  /** Saves the edit panel. Blank quantity or price removes it. */
  const save = (id: string, changes: ItemChanges) => {
    const name = changes.name.trim();
    if (!name) return;
    updateDoc(itemRef(id), {
      name,
      unit: changes.unit,
      quantity: changes.quantity ?? deleteField(),
      price: changes.price ?? deleteField(),
      priceIsTotal: changes.price != null && changes.priceIsTotal ? true : deleteField(),
      category: changes.category,
    }).catch(logError('save item'));
  };

  /** Moves an item to a new position among the items still to buy. */
  const move = (id: string, toIndex: number) => {
    const others = toBuy.filter((i) => i.id !== id);
    const before = others[toIndex - 1];
    const after = others[toIndex];
    // Place it halfway between its new neighbours, so only this one item changes.
    const order =
      before && after
        ? (position(before) + position(after)) / 2
        : before
          ? position(before) + 1000
          : after
            ? position(after) - 1000
            : Date.now();
    // Update the screen straight away so the item doesn't jump back while saving.
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, order } : i)));
    updateDoc(itemRef(id), { order }).catch(logError('move item'));
  };

  const toggle = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) updateDoc(itemRef(id), { checked: !item.checked }).catch(logError('update item'));
  };

  const remove = (id: string) => {
    deleteDoc(itemRef(id)).catch(logError('delete item'));
  };

  // Put a deleted item back (used by Undo).
  const restore = ({ id, ...data }: Item) => {
    setDoc(itemRef(id), data).catch(logError('restore item'));
  };

  const byPosition = (a: Item, b: Item) => position(a) - position(b);
  const toBuy = items.filter((i) => !i.checked).sort(byPosition);
  const bought = items.filter((i) => i.checked).sort(byPosition);

  return { loaded, items, toBuy, bought, add, save, toggle, remove, restore, move };
}

const position = (i: Item) => i.order ?? i.createdAt;
