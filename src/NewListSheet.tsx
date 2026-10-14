import { useState } from 'react';
import { createList } from './lists';
import { Sheet } from './Sheet';
import { useI18n } from './useI18n';

interface Props {
  uid: string;
  onCreated: (listId: string) => void;
  onClose: () => void;
}

export function NewListSheet({ uid, onCreated, onClose }: Props) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    const id = await createList(uid, name);
    onCreated(id);
    onClose();
  };

  return (
    <Sheet label={t.newList} onClose={onClose}>
      <h2 className="sheet-title">{t.newList}</h2>
      <form className="add-bar" onSubmit={create}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.newListPlaceholder}
          aria-label={t.newListName}
          autoFocus
          enterKeyHint="done"
        />
        <button type="submit" disabled={!name.trim() || busy}>
          {t.create}
        </button>
      </form>
    </Sheet>
  );
}
