import { useEffect, useRef, useState } from 'react';
import { ItemRow } from './ItemRow';
import { ItemSheet } from './ItemSheet';
import { ListsSheet } from './ListsSheet';
import { ShareSheet } from './ShareSheet';
import { useList } from './useList';
import { formatRs, listTotal } from './units';
import { useReorder } from './useReorder';
import type { Item, List } from './types';

const UNDO_MS = 5000;

interface Props {
  list: List;
  lists: List[];
  uid: string;
  onSelectList: (listId: string) => void;
  onOpenSettings: () => void;
}

export function ListScreen({ list, lists, uid, onSelectList, onOpenSettings }: Props) {
  const listId = list.id;
  const [panel, setPanel] = useState<'lists' | 'share' | null>(null);
  const shared = list.memberIds.length > 1;
  const { loaded, items, toBuy, bought, add, save, toggle, remove, restore, move } = useList(
    listId,
    uid,
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = items.find((i) => i.id === openId);
  const toBuyTotal = listTotal(toBuy);
  const boughtTotal = listTotal(bought);
  const { listRef, propsFor, reordering } = useReorder(toBuy.length, move);
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

  // Only items still to buy can be reordered.
  const renderRow = (item: Item, index: number, sortable: boolean) => (
    <ItemRow
      key={item.id}
      item={item}
      onToggle={() => toggle(item.id)}
      onOpen={() => setOpenId(item.id)}
      onDelete={() => handleDelete(item)}
      reorder={sortable ? propsFor(item.id, index) : undefined}
    />
  );

  return (
    <div className="app">
      <header className="header header-row">
        <div className="header-text">
          <button
            className="title-button"
            aria-label={`${list.name}. Switch list`}
            onClick={() => setPanel('lists')}
          >
            <h1>{list.name}</h1>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <p className="count">
            {!loaded
              ? ' '
              : toBuy.length === 0
                ? 'Nothing to buy'
                : `${toBuy.length} to buy`}
            {toBuyTotal != null && (
              <>
                {' · '}
                <span className="estimate">≈ {formatRs(toBuyTotal)}</span>
              </>
            )}
          </p>
        </div>
        <button
          className={`icon-button${shared ? ' shared' : ''}`}
          aria-label={shared ? `Shared with ${list.memberIds.length - 1} more. Share settings` : 'Share list'}
          onClick={() => setPanel('share')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="8" r="3.2" />
            <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
            <path d="M16 11.5a2.6 2.6 0 1 0 0-5.2M17.5 14c1.8.5 3 2.1 3.3 4.5" />
          </svg>
          {shared && <span className="share-count">{list.memberIds.length}</span>}
        </button>
        <button className="icon-button" aria-label="Settings" onClick={onOpenSettings}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>
      </header>

      <main>
        {!loaded ? (
          <p className="loading">Loading your list…</p>
        ) : toBuy.length === 0 && bought.length === 0 ? (
          <div className="empty">
            <p className="empty-title">Your list is empty</p>
            <p>Add your first item below.</p>
          </div>
        ) : (
          <ul ref={listRef} className={`list${reordering ? ' reordering' : ''}`}>
            {toBuy.map((item, i) => renderRow(item, i, true))}
          </ul>
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
              Bought ({bought.length}){boughtTotal != null && ` · ${formatRs(boughtTotal)}`}
            </button>
            {showBought && <ul className="list">{bought.map((item, i) => renderRow(item, i, false))}</ul>}
          </section>
        )}
      </main>

      {openItem && (
        <ItemSheet
          key={openItem.id}
          item={openItem}
          onSave={(changes) => save(openItem.id, changes)}
          onDelete={() => handleDelete(openItem)}
          onClose={() => setOpenId(null)}
        />
      )}

      {panel === 'lists' && (
        <ListsSheet
          lists={lists}
          currentId={listId}
          uid={uid}
          onSelect={onSelectList}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'share' && <ShareSheet list={list} uid={uid} onClose={() => setPanel(null)} />}

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
            placeholder="Add an item, e.g. Rice 5kg…"
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
