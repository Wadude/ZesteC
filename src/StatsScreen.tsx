import { useEffect, useState } from 'react';
import {
  Timestamp,
  collection,
  getCountFromServer,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { today } from './usage';

// The app owner's view of the closed test. Only readable by the owner (see isAdmin() in the rules).
// English only: it's an internal tool.

interface Props {
  onBack: () => void;
}

interface UsageDoc {
  uid: string;
  day: string;
  opens?: number;
  itemsAdded?: number;
  shops?: number;
  invitesSent?: number;
  joined?: number;
}

interface Stats {
  testers: number;
  activeToday: number;
  active7: number;
  active28: number;
  returning: { eligible: number; active: number };
  daily: { day: string; people: number }[];
  week: { itemsAdded: number; shops: number; invitesSent: number; joined: number };
  lists: number;
  shared: number;
  withBudget: number;
  feedback7: number;
  feedbackTotal: number;
}

const dayString = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

async function loadStats(): Promise<Stats> {
  const since28 = dayString(daysAgo(27));
  const since7 = dayString(daysAgo(6));

  const [usageSnap, testersSnap, listsSnap, feedbackTotal, feedback7] = await Promise.all([
    getDocs(query(collection(db, 'usage'), where('day', '>=', since28))),
    getDocs(collection(db, 'testers')),
    getDocs(collection(db, 'lists')),
    getCountFromServer(collection(db, 'feedback')),
    getCountFromServer(
      query(collection(db, 'feedback'), where('createdAt', '>=', Timestamp.fromDate(daysAgo(7)))),
    ),
  ]);

  const usage = usageSnap.docs.map((d) => d.data() as UsageDoc);
  const people = (filter: (u: UsageDoc) => boolean) => new Set(usage.filter(filter).map((u) => u.uid)).size;
  const last7 = usage.filter((u) => u.day >= since7);
  const sum = (key: keyof UsageDoc) => last7.reduce((n, u) => n + (Number(u[key]) || 0), 0);

  // Coming back: testers who joined over a week ago and used Zeste in the last 7 days.
  const weekAgo = daysAgo(7).getTime();
  const active7Set = new Set(last7.map((u) => u.uid));
  const eligible = testersSnap.docs.filter((d) => {
    const joined = d.data().joinedAt as Timestamp | undefined;
    return joined && joined.toMillis() < weekAgo;
  });

  const daily = Array.from({ length: 28 }, (_, i) => {
    const day = dayString(daysAgo(27 - i));
    return { day, people: people((u) => u.day === day) };
  });

  const lists = listsSnap.docs.map((d) => d.data());
  return {
    testers: testersSnap.size,
    activeToday: people((u) => u.day === today()),
    active7: active7Set.size,
    active28: people(() => true),
    returning: { eligible: eligible.length, active: eligible.filter((d) => active7Set.has(d.id)).length },
    daily,
    week: {
      itemsAdded: sum('itemsAdded'),
      shops: sum('shops'),
      invitesSent: sum('invitesSent'),
      joined: sum('joined'),
    },
    lists: lists.length,
    shared: lists.filter((l) => (l.memberIds as string[]).length > 1).length,
    withBudget: lists.filter((l) => l.monthlyBudget).length,
    feedback7: feedback7.data().count,
    feedbackTotal: feedbackTotal.data().count,
  };
}

const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : '–');

export function StatsScreen({ onBack }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats()
      .then(setStats)
      .catch((e) => {
        console.error(e);
        setError('Could not load the numbers. Are you signed in with the owner Google account?');
      });
  }, []);

  const maxDaily = Math.max(1, ...(stats?.daily.map((d) => d.people) ?? [1]));

  return (
    <div className="app">
      <header className="header header-row">
        <button className="icon-button" aria-label="Back" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="header-text">
          <h1>Usage numbers</h1>
          <p className="count">Closed test · only you can see this</p>
        </div>
      </header>

      {error && <p className="access-error">{error}</p>}
      {!stats && !error && <p className="loading">Loading…</p>}

      {stats && (
        <>
          <section className="card stats stats-4">
            <div>
              <span className="stat-number">{stats.testers}</span>
              <span className="muted small">Testers</span>
            </div>
            <div>
              <span className="stat-number">{stats.activeToday}</span>
              <span className="muted small">Active today</span>
            </div>
            <div>
              <span className="stat-number">{stats.active7}</span>
              <span className="muted small">Last 7 days</span>
            </div>
            <div>
              <span className="stat-number">{stats.active28}</span>
              <span className="muted small">Last 28 days</span>
            </div>
          </section>

          <section className="card">
            <h2>People using Zeste each day</h2>
            <div className="daily-chart" role="img" aria-label="Daily active people, last 28 days">
              {stats.daily.map((d) => (
                <div key={d.day} className="daily-bar" title={`${d.day}: ${d.people}`}>
                  <span style={{ height: `${(d.people / maxDaily) * 100}%` }} />
                </div>
              ))}
            </div>
            <p className="muted small chart-axis">
              <span>{stats.daily[0].day.slice(5)}</span>
              <span>Today</span>
            </p>
          </section>

          <section className="card">
            <h2>Success questions</h2>
            <ul className="store-list stats-list">
              <li>
                <span>Coming back weekly</span>
                <strong>
                  {pct(stats.returning.active, stats.returning.eligible)}
                  <span className="muted small"> of {stats.returning.eligible}</span>
                </strong>
              </li>
              <li>
                <span>Lists shared with someone</span>
                <strong>
                  {pct(stats.shared, stats.lists)}
                  <span className="muted small"> of {stats.lists}</span>
                </strong>
              </li>
              <li>
                <span>Lists with a budget</span>
                <strong>{pct(stats.withBudget, stats.lists)}</strong>
              </li>
            </ul>
            <p className="hint">Targets for the closed test: most testers come back weekly, ≥ 30% of lists shared.</p>
          </section>

          <section className="card">
            <h2>Last 7 days</h2>
            <ul className="store-list stats-list">
              <li><span>Items added</span><strong>{stats.week.itemsAdded}</strong></li>
              <li><span>Shops saved (Done shopping)</span><strong>{stats.week.shops}</strong></li>
              <li><span>Invites sent</span><strong>{stats.week.invitesSent}</strong></li>
              <li><span>People who joined a list</span><strong>{stats.week.joined}</strong></li>
              <li><span>Feedback messages</span><strong>{stats.feedback7} <span className="muted small">({stats.feedbackTotal} total)</span></strong></li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
