import { listName } from './i18n';
import { ListChips } from './ListChips';
import { ShareContent } from './ShareSheet';
import type { List } from './types';
import { useI18n } from './useI18n';

interface Props {
  list: List;
  lists: List[];
  uid: string;
  onSelectList: (listId: string) => void;
}

/** Household tab: who shares the current list, and inviting more people. */
export function HouseholdScreen({ list, lists, uid, onSelectList }: Props) {
  const { t } = useI18n();
  return (
    <div className="app">
      <header className="header">
        <h1>{t.household}</h1>
        <p className="count">{listName(list.name, t)}</p>
      </header>
      <ListChips lists={lists} currentId={list.id} onSelect={onSelectList} />
      <section className="card household-card">
        {/* key: start fresh (name field, messages) when switching lists. */}
        <ShareContent key={list.id} list={list} uid={uid} onLeft={() => onSelectList(lists[0]?.id ?? list.id)} />
      </section>
    </div>
  );
}
