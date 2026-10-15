import { useState } from 'react';
import { deleteAccount } from './account';
import { Sheet } from './Sheet';
import { useI18n } from './useI18n';

interface Props {
  isGuest: boolean;
  onClose: () => void;
}

/** Explains what will be deleted, then deletes the account and its data. */
export function DeleteAccountSheet({ isGuest, onClose }: Props) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await deleteAccount();
      if (result === 'cancelled') {
        setBusy(false);
        return;
      }
      alert(t.accountDeleted);
      // Start fresh: the app makes a new, empty guest session.
      location.replace('/');
    } catch (e) {
      console.error(e);
      setError(t.deleteAccountFailed);
      setBusy(false);
    }
  };

  return (
    <Sheet label={t.deleteAccountTitle} onClose={busy ? () => {} : onClose}>
      <h2 className="sheet-title">{t.deleteAccountTitle}</h2>
      <p className="delete-text">{t.deleteAccountText}</p>
      <p className="delete-text">{t.deleteAccountShared}</p>
      {!isGuest && <p className="delete-text">{t.deleteAccountGoogle}</p>}
      <p className="delete-warning">{t.deleteAccountWarning}</p>
      {error && (
        <p className="access-error" role="alert">
          {error}
        </p>
      )}
      <div className="sheet-actions">
        <span className="spacer" />
        <button type="button" className="secondary-button small" onClick={onClose} disabled={busy}>
          {t.cancel}
        </button>
        <button type="button" className="danger-button" onClick={confirmDelete} disabled={busy}>
          {busy ? t.deletingAccount : t.deleteAccountConfirm}
        </button>
      </div>
    </Sheet>
  );
}
