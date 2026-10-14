import { useRef, useState } from 'react';
import type { ReorderProps } from './ItemRow';

interface Drag {
  id: string;
  from: number;
  /** Pointer position (page coordinates) when the drag started. */
  startY: number;
  dy: number;
  /** Row positions measured when the drag started (page coordinates). */
  tops: number[];
  heights: number[];
  gap: number;
}

const EDGE_PX = 120;
const SCROLL_STEP = 14;

/** Where the dragged row would land: the number of other rows above its centre. */
function targetIndex(d: Drag): number {
  const centre = d.tops[d.from] + d.heights[d.from] / 2 + d.dy;
  let index = 0;
  d.tops.forEach((top, i) => {
    if (i !== d.from && top + d.heights[i] / 2 < centre) index++;
  });
  return index;
}

/**
 * Drag-to-reorder for a list of rows. Drag the grip with a finger or mouse,
 * or focus it and use the arrow keys.
 */
export function useReorder(count: number, onMove: (id: string, toIndex: number) => void) {
  const listRef = useRef<HTMLUListElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);

  const update = (d: Drag | null) => {
    dragRef.current = d;
    setDrag(d);
  };

  const propsFor = (id: string, index: number): ReorderProps => {
    let offsetY = 0;
    if (drag) {
      if (drag.id === id) {
        offsetY = drag.dy;
      } else {
        // Make room for the dragged row at its new spot.
        const to = targetIndex(drag);
        const shift = drag.heights[drag.from] + drag.gap;
        if (drag.from < index && index <= to) offsetY = -shift;
        else if (to <= index && index < drag.from) offsetY = shift;
      }
    }

    return {
      offsetY,
      dragging: drag?.id === id,

      onPointerDown: (e) => {
        if (e.button !== 0 || !listRef.current) return;
        e.preventDefault();
        try {
          // Keep receiving moves even when the finger leaves the grip.
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Not critical: the drag still works while over the grip.
        }
        const rects = [...listRef.current.children].map((el) => el.getBoundingClientRect());
        update({
          id,
          from: index,
          startY: e.clientY + scrollY,
          dy: 0,
          tops: rects.map((r) => r.top + scrollY),
          heights: rects.map((r) => r.height),
          gap: rects.length > 1 ? rects[1].top - rects[0].bottom : 0,
        });
      },

      onPointerMove: (e) => {
        const d = dragRef.current;
        if (!d || d.id !== id) return;
        // Scroll when dragging near the top or bottom of the screen.
        if (e.clientY > innerHeight - EDGE_PX) scrollBy(0, SCROLL_STEP);
        else if (e.clientY < EDGE_PX / 2) scrollBy(0, -SCROLL_STEP);
        update({ ...d, dy: e.clientY + scrollY - d.startY });
      },

      onPointerUp: () => {
        const d = dragRef.current;
        if (!d || d.id !== id) return;
        const to = targetIndex(d);
        update(null);
        if (to !== d.from) onMove(id, to);
      },

      onKeyDown: (e) => {
        if (e.key === 'ArrowUp' && index > 0) {
          e.preventDefault();
          onMove(id, index - 1);
        } else if (e.key === 'ArrowDown' && index < count - 1) {
          e.preventDefault();
          onMove(id, index + 1);
        }
      },
    };
  };

  return { listRef, propsFor, reordering: drag !== null };
}
