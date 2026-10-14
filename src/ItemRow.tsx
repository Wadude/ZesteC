import { useRef, useState } from 'react';
import type { Item } from './types';

const SWIPE_DELETE_PX = 96;

interface Props {
  item: Item;
  onToggle: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function ItemRow({ item, onToggle, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);

  // Swipe left or right on touch screens to delete.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' || editing) return;
    startX.current = e.clientX;
    swiped.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 8) swiped.current = true;
    setDx(delta);
  };
  const onPointerEnd = () => {
    if (startX.current === null) return;
    startX.current = null;
    if (Math.abs(dx) > SWIPE_DELETE_PX) onDelete();
    else setDx(0);
  };
  // Ignore the tap that ends a swipe.
  const unlessSwiped = (fn: () => void) => () => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    fn();
  };

  const startEdit = () => {
    setDraft(item.name);
    setEditing(true);
  };
  const saveEdit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== item.name) onRename(draft);
  };

  return (
    <li className="row-wrap">
      <div className="row-bg" aria-hidden="true">
        <span>Delete</span>
        <span>Delete</span>
      </div>
      <div
        className={`row${item.checked ? ' checked' : ''}${dx ? ' dragging' : ''}`}
        style={{ transform: `translateX(${dx}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <button
          className="check"
          role="checkbox"
          aria-checked={item.checked}
          aria-label={item.checked ? `Mark ${item.name} as not bought` : `Mark ${item.name} as bought`}
          onClick={unlessSwiped(onToggle)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </button>

        {editing ? (
          <input
            className="edit"
            value={draft}
            autoFocus
            aria-label="Edit item"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') {
                setDraft(item.name);
                setEditing(false);
              }
            }}
          />
        ) : (
          <button className="name" onClick={unlessSwiped(startEdit)}>
            {item.name}
          </button>
        )}

        <button className="delete" aria-label={`Delete ${item.name}`} onClick={unlessSwiped(onDelete)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </li>
  );
}
