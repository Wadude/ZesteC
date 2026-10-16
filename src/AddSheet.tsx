import { useRef, useState } from 'react';
import { listName } from './i18n';
import { Sheet } from './Sheet';
import type { List } from './types';
import { addItem } from './useList';
import { useI18n } from './useI18n';

interface Props {
  list: List;
  uid: string;
  onNewList: () => void;
  onAddShop: () => void;
  onInvite: () => void;
  onClose: () => void;
}

/**
 * The + button's panel: type items straight away (the keyboard opens), add several in a row,
 * or pick another "add" action: new list, a shop for the budget, or inviting someone.
 */
export function AddSheet({ list, uid, onNewList, onAddShop, onInvite, onClose }: Props) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const [added, setAdded] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addItem(list.id, uid, text);
    setAdded((prev) => [text.trim(), ...prev].slice(0, 8));
    setText('');
    inputRef.current?.focus();
  };

  // The other actions open their own panel, so this one closes first.
  const then = (action: () => void) => () => {
    onClose();
    action();
  };

  return (
    <Sheet label={t.addSomething} onClose={onClose}>
      <form className="add-sheet-form" onSubmit={submit}>
        <span className="add-sheet-label">{t.addTo(listName(list.name, t))}</span>
        <div className="add-bar">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.addPlaceholder}
            aria-label={t.newItem}
            enterKeyHint="send"
            autoFocus
          />
          <button type="submit" disabled={!text.trim()} aria-label={t.add}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        {added.length > 0 && (
          <ul className="added-chips" aria-label={t.added}>
            {added.map((name, i) => (
              <li key={`${name}-${added.length - i}`}>✓ {name}</li>
            ))}
          </ul>
        )}
      </form>

      <div className="add-actions">
        <button type="button" onClick={then(onNewList)}>
          <span aria-hidden="true">📝</span>
          {t.newList}
        </button>
        <button type="button" onClick={then(onAddShop)}>
          <span aria-hidden="true">🧾</span>
          {t.addShop}
        </button>
        <button type="button" onClick={then(onInvite)}>
          <span aria-hidden="true">👥</span>
          {t.inviteSomeone}
        </button>
      </div>

      <button type="button" className="secondary-button" onClick={onClose}>
        {t.done}
      </button>
    </Sheet>
  );
}
