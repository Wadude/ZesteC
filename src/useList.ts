import { useEffect, useState } from 'react';
import type { Item } from './types';

// Step 1: the list lives in this browser only (localStorage).
// Step 3 replaces this hook with a Firestore-backed one that has the same shape,
// so the screens don't need to change.

const STORAGE_KEY = 'zeste.items.v1';

function load(): Item[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Item[]) : [];
  } catch {
    return [];
  }
}

export function useList() {
  const [items, setItems] = useState<Item[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked: keep working in memory.
    }
  }, [items]);

  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: trimmed, checked: false, createdAt: Date.now() },
    ]);
  };

  const toggle = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));

  const rename = (id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name: trimmed } : i)));
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  // Put a deleted item back (used by Undo).
  const restore = (item: Item) =>
    setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]));

  const toBuy = items.filter((i) => !i.checked).sort((a, b) => a.createdAt - b.createdAt);
  const bought = items.filter((i) => i.checked).sort((a, b) => a.createdAt - b.createdAt);

  return { toBuy, bought, add, toggle, rename, remove, restore };
}
