import { useState } from 'react';
import { createList, deleteList } from './lists';
import { Sheet } from './Sheet';
import type { List } from './types';

interface Props {
  lists: List[];
  currentId: string;
  uid: string;
  onSelect: (listId: string) => void;
  onClose: () => void;
}

export function ListsSheet({ lists, currentId, uid, onSelect, onClose }: Props) {
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    const id = await createList(uid, newName);
    setBusy(false);
    onSelect(id);
    onClose();
  };

  const remove = async (list: List) => {
    const shared = list.memberIds.length > 1 ? ' It will also disappear for everyone you shared it with.' : '';
    if (!confirm(`Delete "${list.name}" and everything on it?${shared}`)) return;
    setBusy(true);
    setMessage(null);
    try {
      await deleteList(list);
    } catch (err) {
      console.error(err);
      setMessage("Couldn't delete the list. You need to be online for this.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet label="Your lists" onClose={onClose}>
      <h2 className="sheet-title">Your lists</h2>
      <ul className="lists">
        {lists.map((l) => (
          <li key={l.id} className={l.id === currentId ? 'current' : ''}>
            <button
              type="button"
              className="list-choice"
              aria-current={l.id === currentId}
              onClick={() => {
                onSelect(l.id);
                onClose();
              }}
            >
              <span className="list-name">{l.name}</span>
              <span className="list-meta">
                {l.memberIds.length > 1 ? `Shared · ${l.memberIds.length} people` : 'Just you'}
              </span>
            </button>
            {l.ownerId === uid && lists.length > 1 && (
              <button
                type="button"
                className="delete"
                aria-label={`Delete ${l.name}`}
                disabled={busy}
                onClick={() => remove(l)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                </svg>
              </button>
            )}
          </li>
        ))}
      </ul>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}

      <form className="add-bar" onSubmit={create}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New list, e.g. Party"
          aria-label="New list name"
        />
        <button type="submit" disabled={!newName.trim() || busy}>
          Create
        </button>
      </form>
    </Sheet>
  );
}
