import { useEffect, useRef, useState } from 'react';
import { ItemRow } from './ItemRow';
import { ItemSheet } from './ItemSheet';
import { ListsSheet } from './ListsSheet';
import { NewListSheet } from './NewListSheet';
import { ShareSheet } from './ShareSheet';
import { listName } from './i18n';
import { useI18n } from './useI18n';
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
  const { t } = useI18n();
  const listId = list.id;
  const name = listName(list.name, t);
  const [panel, setPanel] = useState<'lists' | 'share' | 'new' | null>(null);
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
            aria-label={t.switchList(name)}
            onClick={() => setPanel('lists')}
          >
            <h1>{name}</h1>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <p className="count">
            {!loaded
              ? ' '
              : toBuy.length === 0
                ? t.nothingToBuy
                : t.toBuy(toBuy.length)}
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
          aria-label={shared ? t.sharedWith(list.memberIds.length - 1) : t.shareList}
          onClick={() => setPanel('share')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="8" r="3.2" />
            <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
            <path d="M16 11.5a2.6 2.6 0 1 0 0-5.2M17.5 14c1.8.5 3 2.1 3.3 4.5" />
          </svg>
          {shared && <span className="share-count">{list.memberIds.length}</span>}
        </button>
        <button className="icon-button" aria-label={t.settings} onClick={onOpenSettings}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>
      </header>

      {/* Quick switching between lists, and an easy way to start a new one. */}
      <nav className="list-tabs-row" aria-label={t.listTabs}>
        {lists.length > 1 && (
          <div className="list-tabs">
            {lists.map((l) => (
              <button
                key={l.id}
                className={`list-tab${l.id === listId ? ' active' : ''}`}
                aria-current={l.id === listId}
                onClick={() => l.id !== listId && onSelectList(l.id)}
              >
                {listName(l.name, t)}
              </button>
            ))}
          </div>
        )}
        {/* Always visible: just "+" when the tabs need the room. */}
        <button
          className={`list-tab new${lists.length > 1 ? ' compact' : ''}`}
          aria-label={t.newList}
          onClick={() => setPanel('new')}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {lists.length <= 1 && t.newList}
        </button>
      </nav>

      <main>
        {!loaded ? (
          <p className="loading">{t.loadingList}</p>
        ) : toBuy.length === 0 && bought.length === 0 ? (
          <div className="empty">
            <p className="empty-title">{t.emptyTitle}</p>
            <p>{t.emptyHint}</p>
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
              {t.bought(bought.length)}{boughtTotal != null && ` · ${formatRs(boughtTotal)}`}
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
      {panel === 'new' && (
        <NewListSheet uid={uid} onCreated={onSelectList} onClose={() => setPanel(null)} />
      )}

      <div className="bottom">
        {deleted && (
          <div className="toast" role="status">
            <span>
              {t.deleted} <strong>{deleted.name}</strong>
            </span>
            <button
              onClick={() => {
                restore(deleted);
                setDeleted(null);
              }}
            >
              {t.undo}
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
            placeholder={t.addPlaceholder}
            aria-label={t.newItem}
            enterKeyHint="done"
          />
          <button type="submit" disabled={!text.trim()}>
            {t.add}
          </button>
        </form>
      </div>
    </div>
  );
}
