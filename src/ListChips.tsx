import { listName } from './i18n';
import type { List } from './types';
import { useI18n } from './useI18n';

interface Props {
  lists: List[];
  currentId: string;
  onSelect: (listId: string) => void;
}

/** Small list switcher for the Budget and Household tabs. Hidden when there's only one list. */
export function ListChips({ lists, currentId, onSelect }: Props) {
  const { t } = useI18n();
  if (lists.length < 2) return null;
  return (
    <nav className="list-tabs-row" aria-label={t.listTabs}>
      <div className="list-tabs">
        {lists.map((l) => (
          <button
            key={l.id}
            className={`list-tab${l.id === currentId ? ' active' : ''}`}
            aria-current={l.id === currentId}
            onClick={() => l.id !== currentId && onSelect(l.id)}
          >
            {listName(l.name, t)}
          </button>
        ))}
      </div>
    </nav>
  );
}
