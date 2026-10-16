import { useEffect, useRef, useState } from 'react';
import { finishShopping, summarise, useTrips } from './budget';
import { BudgetRing } from './BudgetScreen';
import { CATEGORIES, CATEGORY_EMOJI, categoryOf } from './categories';
import { ItemRow } from './ItemRow';
import { ItemSheet } from './ItemSheet';
import { ListsSheet } from './ListsSheet';
import { NewListSheet } from './NewListSheet';
import { TripSheet } from './TripSheet';
import { listName } from './i18n';
import { useI18n } from './useI18n';
import { useList } from './useList';
import { formatMoney, listTotal } from './units';
import { useReorder } from './useReorder';
import type { Item, List, Profile } from './types';

const UNDO_MS = 5000;
const SORT_KEY = 'zeste.sort';

type SortMode = 'category' | 'custom';

function loadSort(): SortMode {
  try {
    return localStorage.getItem(SORT_KEY) === 'custom' ? 'custom' : 'category';
  } catch {
    return 'category';
  }
}

interface Props {
  list: List;
  lists: List[];
  profile: Profile;
  onSelectList: (listId: string) => void;
  onOpenBudget: () => void;
  onFeedback: () => void;
}

export function ListScreen({
  list,
  lists,
  profile,
  onSelectList,
  onOpenBudget,
  onFeedback,
}: Props) {
  const uid = profile.uid;
  const { t } = useI18n();
  const listId = list.id;
  const name = listName(list.name, t);
  const [panel, setPanel] = useState<'lists' | 'new' | 'done' | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const now = new Date();
  const { trips } = useTrips(list.id, now.getFullYear(), now.getMonth());
  const monthSpent = summarise(trips).spent;
  const budget = list.monthlyBudget;
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
  const [sort, setSortState] = useState<SortMode>(loadSort);
  const setSort = (mode: SortMode) => {
    setSortState(mode);
    try {
      localStorage.setItem(SORT_KEY, mode);
    } catch {
      // Ignore: the choice just won't be remembered.
    }
  };
  const [deleted, setDeleted] = useState<Item | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hide the Undo bar after a few seconds.
  useEffect(() => {
    if (!deleted) return;
    const t = setTimeout(() => setDeleted(null), UNDO_MS);
    return () => clearTimeout(t);
  }, [deleted]);

  // Hide the "Saved…" message after a few seconds.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [saved]);

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
                <span className="estimate">≈ {formatMoney(toBuyTotal)}</span>
              </>
            )}
          </p>
        </div>
        <button className="icon-button" aria-label={t.feedbackTitle} onClick={onFeedback}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 5h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
            <path d="M8.5 9.5h7M8.5 12.5h4.5" />
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

      {/* This month's spending; tap for the budget screen. */}
      <button className="budget-summary" onClick={onOpenBudget} aria-label={t.openBudget}>
        {budget ? (
          <BudgetRing spent={monthSpent} budget={budget} />
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" className="wallet">
            <path d="M4 7a2 2 0 0 1 2-2h11v4M4 7v10a2 2 0 0 0 2 2h13V9H6a2 2 0 0 1-2-2zM16 14h.01" />
          </svg>
        )}
        <span className="budget-summary-text">
          <span className="budget-summary-main">
            {budget
              ? t.spentOf(formatMoney(monthSpent), formatMoney(budget))
              : monthSpent > 0
                ? t.spentThisMonth(formatMoney(monthSpent))
                : t.tapToSetBudget}
          </span>
          {budget ? (
            <span className={`budget-summary-sub ${monthSpent > budget ? 'over' : ''}`}>
              {monthSpent > budget
                ? t.overBudget(formatMoney(monthSpent - budget))
                : t.leftToSpend(formatMoney(budget - monthSpent))}
            </span>
          ) : null}
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="chevron">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <main>
        {!loaded ? (
          <p className="loading">{t.loadingList}</p>
        ) : toBuy.length === 0 && bought.length === 0 ? (
          <div className="empty">
            <svg className="empty-art" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="64" r="40" className="lemon-rind" />
              <circle cx="60" cy="64" r="33" className="lemon-pith" />
              <circle cx="60" cy="64" r="28" className="lemon-flesh" />
              <g className="lemon-segments">
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                  <line key={a} x1="60" y1="64" x2="60" y2="38" transform={`rotate(${a + 22.5} 60 64)`} />
                ))}
              </g>
              <path d="M60 24c2-10 10-14 18-12-2 8-9 13-18 12z" className="lemon-leaf" />
            </svg>
            <p className="empty-title">{t.emptyTitle}</p>
            <p>{t.emptyHint}</p>
          </div>
        ) : (
          <>
            {toBuy.length > 1 && (
              <div className="list-toolbar">
                <div className="segmented compact" role="radiogroup" aria-label={t.sortLabel}>
                  {(['category', 'custom'] as const).map((mode) => (
                    <button
                      key={mode}
                      role="radio"
                      aria-checked={sort === mode}
                      className={sort === mode ? 'active' : ''}
                      onClick={() => setSort(mode)}
                    >
                      {mode === 'category' ? t.sortByCategory : t.sortMyOrder}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {sort === 'category' ? (
              // Grouped by category, in supermarket order. Drag to reorder is in "My order".
              CATEGORIES.map((c) => {
                const group = toBuy.filter((i) => categoryOf(i) === c);
                if (group.length === 0) return null;
                return (
                  <section key={c} className="group" data-cat={c} aria-label={t.categories[c]}>
                    <h2 className="group-title">
                      <span className="group-emoji" aria-hidden="true">{CATEGORY_EMOJI[c]}</span>
                      {t.categories[c]}
                      <span className="group-count">{group.length}</span>
                    </h2>
                    <ul className="list">{group.map((item, i) => renderRow(item, i, false))}</ul>
                  </section>
                );
              })
            ) : (
              <ul ref={listRef} className={`list${reordering ? ' reordering' : ''}`}>
                {toBuy.map((item, i) => renderRow(item, i, true))}
              </ul>
            )}
          </>
        )}

        {bought.length > 0 && (
          <section className="bought">
            <div className="bought-row">
              <button
                className="bought-toggle"
                aria-expanded={showBought}
                onClick={() => setShowBought((s) => !s)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className={showBought ? 'open' : ''}>
                  <path d="M9 6l6 6-6 6" />
                </svg>
                {t.bought(bought.length)}
                {boughtTotal != null && ` · ${formatMoney(boughtTotal)}`}
              </button>
              <button className="done-button" onClick={() => setPanel('done')}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                {t.doneShopping}
              </button>
            </div>
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
      {panel === 'done' && (
        <TripSheet
          mode="done"
          bought={bought}
          onSave={(input) => {
            finishShopping(listId, uid, bought, input);
            setSaved(t.shopSaved(formatMoney(input.total), input.store.trim()));
          }}
          onClose={() => setPanel(null)}
        />
      )}
      {panel === 'new' && (
        <NewListSheet uid={uid} onCreated={onSelectList} onClose={() => setPanel(null)} />
      )}

      <div className="bottom">
        {saved && !deleted && (
          <div className="toast" role="status">
            <span>{saved}</span>
            <button onClick={onOpenBudget}>{t.budget}</button>
          </div>
        )}
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
          <button type="submit" disabled={!text.trim()} aria-label={t.add}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
