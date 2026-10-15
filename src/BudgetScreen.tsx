import { useState } from 'react';
import { addTrip, deleteTrip, setMonthlyBudget, summarise, updateTrip, useTrips } from './budget';
import { listName } from './i18n';
import { formatDay, TripSheet } from './TripSheet';
import type { List, Trip } from './types';
import { formatMoney, currencySymbol } from './units';
import { useI18n } from './useI18n';

interface Props {
  list: List;
  uid: string;
  onBack: () => void;
}

/** Bar colour: normal, amber from 80%, red when over. */
export function budgetLevel(spent: number, budget: number | undefined): 'ok' | 'warn' | 'over' {
  if (!budget) return 'ok';
  const ratio = spent / budget;
  return ratio > 1 ? 'over' : ratio >= 0.8 ? 'warn' : 'ok';
}

export function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const level = budgetLevel(spent, budget);
  return (
    <div className={`progress ${level}`} aria-hidden="true">
      <div style={{ width: `${Math.min(100, (spent / budget) * 100)}%` }} />
    </div>
  );
}

/** Small donut showing how much of the month's budget is used. */
export function BudgetRing({ spent, budget, size = 44 }: { spent: number; budget: number; size?: number }) {
  const level = budgetLevel(spent, budget);
  const r = 17;
  const circumference = 2 * Math.PI * r;
  const used = Math.min(1, spent / budget);
  return (
    <svg className={`ring ${level}`} viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <circle className="ring-track" cx="20" cy="20" r={r} />
      <circle
        className="ring-value"
        cx="20"
        cy="20"
        r={r}
        strokeDasharray={`${used * circumference} ${circumference}`}
        transform="rotate(-90 20 20)"
      />
      <text x="20" y="20" textAnchor="middle" dominantBaseline="central">
        {Math.round((spent / budget) * 100)}%
      </text>
    </svg>
  );
}

export function BudgetScreen({ list, uid, onBack }: Props) {
  const { t } = useI18n();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { trips, loaded } = useTrips(list.id, year, month);
  const { spent, count, average, byStore } = summarise(trips);
  const budget = list.monthlyBudget;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetText, setBudgetText] = useState(budget ? String(budget) : '');
  const [sheet, setSheet] = useState<{ mode: 'add' } | { mode: 'edit'; trip: Trip } | null>(null);

  const goMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const saveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(budgetText.replace(',', '.'));
    setMonthlyBudget(list.id, budgetText.trim() && Number.isFinite(n) && n > 0 ? n : null);
    setEditingBudget(false);
  };

  const monthTitle = `${t.months[month].charAt(0).toUpperCase()}${t.months[month].slice(1)} ${year}`;

  return (
    <div className="app">
      <header className="header header-row">
        <button className="icon-button" aria-label={t.back} onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="header-text">
          <h1>{t.budget}</h1>
          <p className="count">{listName(list.name, t)}</p>
        </div>
      </header>

      <div className="month-nav">
        <button className="icon-button" aria-label={t.previousMonth} onClick={() => goMonth(-1)}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <span className="month-title">{monthTitle}</span>
        <button
          className="icon-button"
          aria-label={t.nextMonth}
          onClick={() => goMonth(1)}
          disabled={isCurrentMonth}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <section className="card budget-card">
        <h2>{t.spent}</h2>
        <p className="big-number">{formatMoney(spent)}</p>
        {budget ? (
          <>
            <p className="muted small">{t.spentOf(formatMoney(spent), formatMoney(budget))}</p>
            <BudgetBar spent={spent} budget={budget} />
            <p className={`budget-status ${budgetLevel(spent, budget)}`}>
              {spent > budget
                ? t.overBudget(formatMoney(spent - budget))
                : t.leftToSpend(formatMoney(budget - spent))}
            </p>
          </>
        ) : null}

        <div className="budget-setting">
          {editingBudget ? (
            <form className="add-bar" onSubmit={saveBudget}>
              <div className="price-input grow">
                <span aria-hidden="true">{currencySymbol()}</span>
                <input
                  inputMode="decimal"
                  placeholder="8000"
                  value={budgetText}
                  onChange={(e) => setBudgetText(e.target.value)}
                  aria-label={t.monthlyBudget}
                  autoFocus
                />
              </div>
              <button type="submit">{t.save}</button>
            </form>
          ) : (
            <>
              <span>
                {t.monthlyBudget}: <strong>{budget ? formatMoney(budget) : t.noBudget}</strong>
              </span>
              <span className="spacer" />
              {budget != null && (
                <button
                  className="link-button"
                  onClick={() => {
                    setMonthlyBudget(list.id, null);
                    setBudgetText('');
                  }}
                >
                  {t.removeBudget}
                </button>
              )}
              <button
                className="link-button"
                onClick={() => {
                  setBudgetText(budget ? String(budget) : '');
                  setEditingBudget(true);
                }}
              >
                {budget ? t.editBudget : t.setBudget}
              </button>
            </>
          )}
        </div>
      </section>

      {count > 0 && (
        <section className="card stats">
          <div>
            <span className="stat-number">{count}</span>
            <span className="muted small">{t.shops}</span>
          </div>
          <div>
            <span className="stat-number">{formatMoney(average)}</span>
            <span className="muted small">{t.averagePerShop}</span>
          </div>
        </section>
      )}

      {byStore.length > 0 && (
        <section className="card">
          <h2>{t.byStore}</h2>
          <ul className="store-list">
            {byStore.map(([name, total]) => (
              <li key={name}>
                <span>{name || t.otherStores}</span>
                <span className="store-bar">
                  <span style={{ width: `${(total / byStore[0][1]) * 100}%` }} />
                </span>
                <strong>{formatMoney(total)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="card-title-row">
          <h2>{t.shops}</h2>
          <button className="link-button" onClick={() => setSheet({ mode: 'add' })}>
            + {t.addShop}
          </button>
        </div>
        {loaded && trips.length === 0 ? (
          <p className="muted small">{t.noShops}</p>
        ) : (
          <ul className="trips">
            {trips.map((trip) => (
              <li key={trip.id}>
                <button className="trip" onClick={() => setSheet({ mode: 'edit', trip })}>
                  <span className="trip-date">{formatDay(trip.date, t)}</span>
                  <span className="trip-main">
                    <span className="trip-store">{trip.store || t.noStore}</span>
                    {trip.itemCount > 0 && (
                      <span className="details">{t.itemCount(trip.itemCount)}</span>
                    )}
                  </span>
                  <strong className="line-total">{formatMoney(trip.total)}</strong>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {sheet && (
        <TripSheet
          mode={sheet.mode}
          trip={sheet.mode === 'edit' ? sheet.trip : undefined}
          onSave={(input) =>
            sheet.mode === 'edit'
              ? updateTrip(list.id, sheet.trip.id, input)
              : addTrip(list.id, uid, input)
          }
          onDelete={sheet.mode === 'edit' ? () => deleteTrip(list.id, sheet.trip.id) : undefined}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}
