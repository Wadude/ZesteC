import { useState } from 'react';
import { createList, deleteList } from './lists';
import { Sheet } from './Sheet';
import type { List } from './types';
import { listName } from './i18n';
import { useI18n } from './useI18n';

interface Props {
  lists: List[];
  currentId: string;
  uid: string;
  onSelect: (listId: string) => void;
  onClose: () => void;
}

export function ListsSheet({ lists, currentId, uid, onSelect, onClose }: Props) {
  const { t } = useI18n();
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    const id = await createList(uid, newName.trim() || t.untitledList);
    setBusy(false);
    onSelect(id);
    onClose();
  };

  const remove = async (list: List) => {
    if (!confirm(t.confirmDeleteList(listName(list.name, t), list.memberIds.length > 1))) return;
    setBusy(true);
    setMessage(null);
    try {
      await deleteList(list);
    } catch (err) {
      console.error(err);
      setMessage(t.deleteListFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet label={t.yourLists} onClose={onClose}>
      <h2 className="sheet-title">{t.yourLists}</h2>
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
              <span className="list-name">{listName(l.name, t)}</span>
              <span className="list-meta">
                {l.memberIds.length > 1 ? t.sharedPeople(l.memberIds.length) : t.justYou}
              </span>
            </button>
            {l.ownerId === uid && lists.length > 1 && (
              <button
                type="button"
                className="delete"
                aria-label={t.deleteList(listName(l.name, t))}
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
          placeholder={t.newListPlaceholder}
          aria-label={t.newListName}
        />
        <button type="submit" disabled={!newName.trim() || busy}>
          {t.create}
        </button>
      </form>
    </Sheet>
  );
}
