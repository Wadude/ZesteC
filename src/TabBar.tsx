import type { ReactNode } from 'react';
import { useI18n } from './useI18n';

export type Tab = 'list' | 'budget' | 'household' | 'settings';

interface Props {
  current: Tab;
  onChange: (tab: Tab) => void;
  /** People on the current list, shown as a small number on Household when it's shared. */
  members: number;
}

const ICONS: Record<Tab, ReactNode> = {
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
    </>
  ),
  budget: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5v8.5l6 6" />
    </>
  ),
  household: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <path d="M16 11.5a2.6 2.6 0 1 0 0-5.2M17.5 14c1.8.5 3 2.1 3.3 4.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </>
  ),
};

/** Bottom navigation, like most phone apps: within thumb reach. */
export function TabBar({ current, onChange, members }: Props) {
  const { t } = useI18n();
  const labels: Record<Tab, string> = {
    list: t.tabLists,
    budget: t.budget,
    household: t.household,
    settings: t.settings,
  };
  return (
    <nav className="tab-bar" aria-label="Zeste">
      {(Object.keys(ICONS) as Tab[]).map((tab) => (
        <button
          key={tab}
          className={`tab${current === tab ? ' active' : ''}`}
          aria-current={current === tab ? 'page' : undefined}
          onClick={() => onChange(tab)}
        >
          <span className="tab-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {ICONS[tab]}
            </svg>
            {tab === 'household' && members > 1 && <span className="tab-badge">{members}</span>}
          </span>
          <span className="tab-label">{labels[tab]}</span>
        </button>
      ))}
    </nav>
  );
}
