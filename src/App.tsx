import { useEffect, useRef, useState } from 'react';
import { ItemRow } from './ItemRow';
import { useList } from './useList';
import type { Item } from './types';

const UNDO_MS = 5000;

export default function App() {
  const { toBuy, bought, add, toggle, rename, remove, restore } = useList();
  const [text, setText] = useState('');
  const [showBought, setShowBought] = useState(true);
  const [deleted, setDeleted] = useState<Item | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide the Undo bar after a few seconds.
  useEffect(() => {
    if (!deleted) return;
    const t = setTimeout(() => setDeleted(null), UNDO_MS);
    return () => clearTimeout(t);
  }, [deleted]);

  const handleDelete = (item: Item) => {
    remove(item.id);
    setDeleted(item);
  };

  const renderRow = (item: Item) => (
    <ItemRow
      key={item.id}
      item={item}
      onToggle={() => toggle(item.id)}
      onRename={(name) => rename(item.id, name)}
      onDelete={() => handleDelete(item)}
    />
  );

  return (
    <div className="app">
      <header className="header">
        <h1>My list</h1>
        <p className="count">
          {toBuy.length === 0 ? 'Nothing to buy' : `${toBuy.length} to buy`}
        </p>
      </header>

      <main>
        {toBuy.length === 0 && bought.length === 0 ? (
          <div className="empty">
            <p className="empty-title">Your list is empty</p>
            <p>Add your first item below.</p>
          </div>
        ) : (
          <ul className="list">{toBuy.map(renderRow)}</ul>
        )}

        {bought.length > 0 && (
          <section className="bought">
            <button
              className="bought-toggle"
              aria-expanded={showBought}
              onClick={() => setShowBought((s) => !s)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className={showBought ? 'open' : ''}>
                <path d="M9 6l6 6-6 6" />
              </svg>
              Bought ({bought.length})
            </button>
            {showBought && <ul className="list">{bought.map(renderRow)}</ul>}
          </section>
        )}
      </main>

      <div className="bottom">
        {deleted && (
          <div className="toast" role="status">
            <span>
              Deleted <strong>{deleted.name}</strong>
            </span>
            <button
              onClick={() => {
                restore(deleted);
                setDeleted(null);
              }}
            >
              Undo
            </button>
          </div>
        )}
        <form
          className="add-bar"
          onSubmit={(e) => {
            e.preventDefault();
            add(text);
            setText('');
            inputRef.current?.focus();
          }}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add an item…"
            aria-label="New item"
            enterKeyHint="done"
          />
          <button type="submit" disabled={!text.trim()}>
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
