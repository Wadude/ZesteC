import { useEffect, useState } from 'react';
import { CATEGORIES, CATEGORY_EMOJI, categoryOf, guessCategory } from './categories';
import type { Category, Item, Unit } from './types';
import type { ItemChanges } from './useList';
import {
  UNITS,
  convertQuantity,
  formatMoney,
  lineTotal,
  perLabel,
  stepFor,
  unitLabel,
  currencySymbol,
} from './units';
import { useI18n } from './useI18n';

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
  const { t } = useI18n();
  const [name, setName] = useState(item.name);
  const [unit, setUnit] = useState<Unit>(item.unit ?? 'pcs');
  const [qty, setQty] = useState(show(item.quantity));
  const [price, setPrice] = useState(show(item.price));
  const [isTotal, setIsTotal] = useState(item.priceIsTotal ?? false);
  const [category, setCategory] = useState<Category>(categoryOf(item));
  const [categoryPicked, setCategoryPicked] = useState(false);

  // Renaming re-guesses the category, unless one was picked by hand in this panel.
  const changeName = (next: string) => {
    setName(next);
    if (!categoryPicked) {
      const guess = guessCategory(next);
      if (guess !== 'other') setCategory(guess);
    }
  };

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
      category,
    });
    onClose();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t.editItem(item.name)}
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
      >
        <div className="sheet-handle" aria-hidden="true" />

        <label className="field">
          <span>{t.item}</span>
          <input value={name} onChange={(e) => changeName(e.target.value)} autoComplete="off" />
        </label>

        <div className="field">
          <span id="qty-label">{t.quantity}</span>
          <div className="qty-row">
            <button type="button" className="step" aria-label={t.less} onClick={() => step(-1)}>
              −
            </button>
            <input
              aria-labelledby="qty-label"
              inputMode="decimal"
              placeholder="—"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <button type="button" className="step" aria-label={t.more} onClick={() => step(1)}>
              +
            </button>
          </div>
          <div className="chips" role="radiogroup" aria-label={t.unit}>
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={unit === u}
                className={unit === u ? 'chip active' : 'chip'}
                onClick={() => changeUnit(u)}
              >
                {unitLabel(u, t)}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span id="price-label">{t.price}</span>
          <div className="price-row">
            <div className="price-input">
              <span aria-hidden="true">{currencySymbol()}</span>
              <input
                aria-labelledby="price-label"
                inputMode="decimal"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="segmented compact" role="radiogroup" aria-label={t.priceIs}>
              <button
                type="button"
                role="radio"
                aria-checked={!isTotal}
                className={!isTotal ? 'active' : ''}
                onClick={() => setIsTotal(false)}
              >
                {perLabel(unit, t)}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={isTotal}
                className={isTotal ? 'active' : ''}
                onClick={() => setIsTotal(true)}
              >
                {t.total}
              </button>
            </div>
          </div>
        </div>

        <div className="field">
          <span id="category-label">{t.category}</span>
          <div className="category-chips" role="radiogroup" aria-labelledby="category-label">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={category === c}
                className={category === c ? 'chip active' : 'chip'}
                onClick={() => {
                  setCategory(c);
                  setCategoryPicked(true);
                }}
              >
                <span aria-hidden="true">{CATEGORY_EMOJI[c]}</span> {t.categories[c]}
              </button>
            ))}
          </div>
        </div>

        <p className="sheet-total" aria-live="polite">
          {total != null ? (
            <>
              {t.total} <strong>{formatMoney(total)}</strong>
            </>
          ) : (
            t.addPriceHint
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
            {t.delete}
          </button>
          <span className="spacer" />
          <button type="button" className="secondary-button small" onClick={onClose}>
            {t.cancel}
          </button>
          <button type="submit" className="primary-button" disabled={!name.trim()}>
            {t.save}
          </button>
        </div>
      </form>
    </div>
  );
}
