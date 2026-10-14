import { useState } from 'react';
import { recentStores, type TripInput } from './budget';
import type { Messages } from './i18n';
import { Sheet } from './Sheet';
import type { Item, Trip } from './types';
import { formatQuantity, formatRs, listTotal } from './units';
import { useI18n } from './useI18n';

interface Props {
  /** done: from "Done shopping" · add: typed in by hand · edit: change a saved shop */
  mode: 'done' | 'add' | 'edit';
  trip?: Trip;
  /** Bought items, for "Done shopping". */
  bought?: Item[];
  onSave: (input: TripInput) => void;
  onDelete?: () => void;
  onClose: () => void;
}

/** yyyy-mm-dd for a date input, in local time. */
function toDateInput(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Noon on the chosen day, so time zones never push it into the next or previous day. */
function fromDateInput(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12).getTime();
}

/** "15 Oct" */
export function formatDay(ms: number, t: Messages): string {
  const d = new Date(ms);
  return `${d.getDate()} ${t.monthsShort[d.getMonth()]}`;
}

export function TripSheet({ mode, trip, bought = [], onSave, onDelete, onClose }: Props) {
  const { t } = useI18n();
  const estimate = mode === 'done' ? listTotal(bought) : null;
  const [amount, setAmount] = useState(
    trip ? String(trip.total) : estimate != null ? String(Math.round(estimate * 100) / 100) : '',
  );
  const [store, setStore] = useState(trip?.store ?? '');
  const [date, setDate] = useState(toDateInput(trip?.date ?? Date.now()));
  const stores = recentStores();

  const total = Number(amount.replace(',', '.'));
  const valid = amount.trim() !== '' && Number.isFinite(total) && total >= 0 && date !== '';

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSave({ total, store, date: fromDateInput(date) });
    onClose();
  };

  const title = mode === 'done' ? t.doneShopping : mode === 'add' ? t.addShop : t.editShop;

  return (
    <Sheet label={title} onClose={onClose}>
      <form className="sheet-form" onSubmit={save}>
        <h2 className="sheet-title">{title}</h2>

        <label className="field">
          <span>{t.amountPaid}</span>
          <div className="price-input">
            <span aria-hidden="true">Rs</span>
            <input
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus={mode !== 'edit'}
            />
          </div>
          {estimate != null && <span className="hint">{t.fromYourPrices(formatRs(estimate))}</span>}
        </label>

        <label className="field">
          <span>{t.store}</span>
          <input
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder={t.storePlaceholder}
            maxLength={60}
            autoComplete="off"
          />
          {stores.length > 0 && (
            <div className="category-chips">
              {stores.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={store === s ? 'chip active' : 'chip'}
                  onClick={() => setStore(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </label>

        <label className="field">
          <span>{t.date}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        {mode === 'edit' && trip && trip.items.length > 0 && (
          <div className="field">
            <span>{t.itemsBought}</span>
            <ul className="trip-items">
              {trip.items.map((i, n) => (
                <li key={n}>
                  <span>
                    {i.name}
                    {i.quantity != null && (
                      <span className="details"> · {formatQuantity(i.quantity, i.unit ?? 'pcs', t)}</span>
                    )}
                  </span>
                  {i.total != null && <span className="line-total">{formatRs(i.total)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {mode === 'done' && <p className="muted small">{t.clearsBought(bought.length)}</p>}

        <div className="sheet-actions">
          {onDelete && (
            <button
              type="button"
              className="text-danger"
              onClick={() => {
                if (!confirm(t.confirmDeleteShop)) return;
                onDelete();
                onClose();
              }}
            >
              {t.delete}
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="secondary-button small" onClick={onClose}>
            {t.cancel}
          </button>
          <button type="submit" className="primary-button" disabled={!valid}>
            {mode === 'edit' ? t.save : t.saveShop}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
