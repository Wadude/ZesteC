import { useRef, useState } from 'react';
import type { Item } from './types';
import { formatRs, itemDetails, lineTotal } from './units';
import { useI18n } from './useI18n';

const SWIPE_DELETE_PX = 96;

/** Props for the grip handle, supplied by the list when reordering is allowed. */
export interface ReorderProps {
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  /** Vertical shift in px while a drag is in progress. */
  offsetY: number;
  dragging: boolean;
}

interface Props {
  item: Item;
  onToggle: () => void;
  onOpen: () => void;
  onDelete: () => void;
  reorder?: ReorderProps;
}

export function ItemRow({ item, onToggle, onOpen, onDelete, reorder }: Props) {
  const { t } = useI18n();
  const [dx, setDx] = useState(0);
  const startX = useRef<number | null>(null);
  const swiped = useRef(false);

  // Swipe left or right on touch screens to delete.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return;
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

  const details = itemDetails(item, t);
  const total = lineTotal(item);

  return (
    <li
      className={`row-wrap${reorder?.dragging ? ' lifted' : ''}`}
      style={reorder?.offsetY ? { transform: `translateY(${reorder.offsetY}px)` } : undefined}
    >
      <div className="row-bg" aria-hidden="true">
        <span>{t.swipeDelete}</span>
        <span>{t.swipeDelete}</span>
      </div>
      <div
        className={`row${item.checked ? ' checked' : ''}${dx ? ' dragging' : ''}`}
        style={{ transform: `translateX(${dx}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        {!reorder && <span className="grip-spacer" aria-hidden="true" />}
        {reorder && (
          <button
            className="grip"
            aria-label={t.moveItem(item.name)}
            onPointerDown={(e) => {
              // Keep this from also starting a swipe on the row.
              e.stopPropagation();
              reorder.onPointerDown(e);
            }}
            onPointerMove={(e) => {
              e.stopPropagation();
              reorder.onPointerMove(e);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              reorder.onPointerUp(e);
            }}
            onPointerCancel={(e) => {
              e.stopPropagation();
              reorder.onPointerUp(e);
            }}
            onKeyDown={reorder.onKeyDown}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="6" r="1.3" />
              <circle cx="15" cy="6" r="1.3" />
              <circle cx="9" cy="12" r="1.3" />
              <circle cx="15" cy="12" r="1.3" />
              <circle cx="9" cy="18" r="1.3" />
              <circle cx="15" cy="18" r="1.3" />
            </svg>
          </button>
        )}

        <button
          className="check"
          role="checkbox"
          aria-checked={item.checked}
          aria-label={item.checked ? t.markNotBought(item.name) : t.markBought(item.name)}
          onClick={unlessSwiped(onToggle)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </button>

        <button className="name" onClick={unlessSwiped(onOpen)}>
          <span className="name-text">{item.name}</span>
          {details && <span className="details">{details}</span>}
        </button>

        {total != null && <span className="line-total">{formatRs(total)}</span>}

        <button className="delete" aria-label={t.deleteItem(item.name)} onClick={unlessSwiped(onDelete)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </li>
  );
}
