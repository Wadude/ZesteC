import { useEffect, useState } from 'react';
import type { Item, Unit } from './types';
import type { ItemChanges } from './useList';
import {
  UNITS,
  convertQuantity,
  formatRs,
  lineTotal,
  perLabel,
  stepFor,
} from './units';

interface Props {
  item: Item;
  onSave: (changes: ItemChanges) => void;
  onDelete: () => void;
  onClose: () => void;
}

/** Text box value → number, or null if blank or invalid. */
function parseNumber(s: string): number | null {
  const n = Number(s.replace(',', '.'));
  return s.trim() && Number.isFinite(n) && n >= 0 ? n : null;
}

const show = (n: number | undefined | null) => (n == null ? '' : String(Math.round(n * 1000) / 1000));

export function ItemSheet({ item, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(item.name);
  const [unit, setUnit] = useState<Unit>(item.unit ?? 'pcs');
  const [qty, setQty] = useState(show(item.quantity));
  const [price, setPrice] = useState(show(item.price));
  const [isTotal, setIsTotal] = useState(item.priceIsTotal ?? false);

  // Close with Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const quantity = parseNumber(qty);
  const priceValue = parseNumber(price);
  const total = lineTotal({
    quantity: quantity ?? undefined,
    unit,
    price: priceValue ?? undefined,
    priceIsTotal: isTotal,
  });

  const changeUnit = (next: Unit) => {
    if (quantity != null) setQty(show(convertQuantity(quantity, unit, next)));
    setUnit(next);
  };

  const step = (direction: 1 | -1) => {
    const s = stepFor(unit);
    const current = quantity ?? 0;
    const next = Math.max(0, Math.round((current + direction * s) / s) * s);
    setQty(next === 0 ? '' : show(next));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name,
      unit,
      quantity: quantity && quantity > 0 ? quantity : null,
      price: priceValue,
      priceIsTotal: isTotal,
    });
    onClose();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${item.name}`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
      >
        <div className="sheet-handle" aria-hidden="true" />

        <label className="field">
          <span>Item</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </label>

        <div className="field">
          <span id="qty-label">Quantity</span>
          <div className="qty-row">
            <button type="button" className="step" aria-label="Less" onClick={() => step(-1)}>
              −
            </button>
            <input
              aria-labelledby="qty-label"
              inputMode="decimal"
              placeholder="—"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <button type="button" className="step" aria-label="More" onClick={() => step(1)}>
              +
            </button>
          </div>
          <div className="chips" role="radiogroup" aria-label="Unit">
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={unit === u}
                className={unit === u ? 'chip active' : 'chip'}
                onClick={() => changeUnit(u)}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span id="price-label">Price</span>
          <div className="price-row">
            <div className="price-input">
              <span aria-hidden="true">Rs</span>
              <input
                aria-labelledby="price-label"
                inputMode="decimal"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="segmented compact" role="radiogroup" aria-label="Price is">
              <button
                type="button"
                role="radio"
                aria-checked={!isTotal}
                className={!isTotal ? 'active' : ''}
                onClick={() => setIsTotal(false)}
              >
                {perLabel(unit)}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={isTotal}
                className={isTotal ? 'active' : ''}
                onClick={() => setIsTotal(true)}
              >
                Total
              </button>
            </div>
          </div>
        </div>

        <p className="sheet-total" aria-live="polite">
          {total != null ? (
            <>
              Total <strong>{formatRs(total)}</strong>
            </>
          ) : (
            'Add a price to see the total'
          )}
        </p>

        <div className="sheet-actions">
          <button
            type="button"
            className="text-danger"
            onClick={() => {
              onDelete();
              onClose();
            }}
          >
            Delete
          </button>
          <span className="spacer" />
          <button type="button" className="secondary-button small" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={!name.trim()}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
