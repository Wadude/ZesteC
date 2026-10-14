import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getOrCreateInvite, inviteUrl, leaveList, renameList, resetInvite } from './lists';
import { Sheet } from './Sheet';
import type { List } from './types';
import { listName } from './i18n';
import { useI18n } from './useI18n';

interface Props {
  list: List;
  uid: string;
  onClose: () => void;
}

interface Member {
  uid: string;
  name: string | null;
  photoURL: string | null;
}

/** Names and photos of a list's members. Guests have no name. */
function useMembers(memberIds: string[]) {
  const [members, setMembers] = useState<Member[]>([]);
  const key = memberIds.join(',');
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      memberIds.map(async (uid) => {
        const snap = await getDoc(doc(db, 'users', uid)).catch(() => null);
        const data = snap?.data();
        return { uid, name: (data?.name as string) ?? null, photoURL: (data?.photoURL as string) ?? null };
      }),
    ).then((m) => !cancelled && setMembers(m));
    return () => {
      cancelled = true;
    };
  }, [key]); // memberIds is a new array each render; key captures its contents.
  return members;
}

export function ShareSheet({ list, uid, onClose }: Props) {
  const { t } = useI18n();
  const displayName = listName(list.name, t);
  const [name, setName] = useState(displayName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const members = useMembers(list.memberIds);
  const isOwner = list.ownerId === uid;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMessage(null);
    try {
      await fn();
    } catch (e) {
      console.error(e);
      setMessage(
        (e as Error).message === 'offline' ? t.needOnline : t.genericError,
      );
    } finally {
      setBusy(false);
    }
  };

  const share = () =>
    run(async () => {
      const url = inviteUrl(await getOrCreateInvite(list, uid));
      const text = t.inviteText(displayName);
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Zeste', text, url });
          return;
        } catch (e) {
          if ((e as Error).name === 'AbortError') return; // closed the share menu
        }
      }
      await navigator.clipboard.writeText(`${text}: ${url}`);
      setMessage(t.inviteCopied);
    });

  const copyLink = () =>
    run(async () => {
      const url = inviteUrl(await getOrCreateInvite(list, uid));
      await navigator.clipboard.writeText(url);
      setMessage(t.linkCopied);
    });

  const reset = () =>
    run(async () => {
      await resetInvite(list, uid);
      setMessage(t.newLinkMade);
    });

  const leave = () =>
    run(async () => {
      if (!confirm(t.confirmLeave(displayName))) return;
      await leaveList(list.id, uid);
      onClose();
    });

  const saveName = () => {
    if (name.trim() && name.trim() !== displayName) renameList(list.id, name);
  };

  return (
    <Sheet label={t.shareTitle(displayName)} onClose={onClose}>
      <label className="field">
        <span>{t.listName}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          autoComplete="off"
        />
      </label>

      <div className="field">
        <span>{t.shareThis}</span>
        <p className="muted small">{t.shareExplain}</p>
        <button type="button" className="primary-button wide" disabled={busy} onClick={share}>
          {busy ? t.pleaseWait : t.sendInvite}
        </button>
        {list.inviteCode && (
          <div className="invite-row">
            <span className="invite-code" aria-label={t.inviteCode}>
              {list.inviteCode}
            </span>
            <button type="button" className="link-button" disabled={busy} onClick={copyLink}>
              {t.copyLink}
            </button>
            <button type="button" className="link-button" disabled={busy} onClick={reset}>
              {t.newLink}
            </button>
          </div>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
      </div>

      <div className="field">
        <span>{t.people(list.memberIds.length)}</span>
        <ul className="members">
          {members.map((m) => (
            <li key={m.uid}>
              {m.photoURL ? (
                <img className="avatar small" src={m.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar small avatar-letter" aria-hidden="true">
                  {(m.name ?? t.guest).charAt(0).toUpperCase()}
                </span>
              )}
              <span className="member-name">
                {m.name ?? t.guest}
                {m.uid === uid && ` ${t.you}`}
              </span>
              {m.uid === list.ownerId && <span className="badge">{t.owner}</span>}
            </li>
          ))}
        </ul>
      </div>

      {!isOwner && (
        <button type="button" className="text-danger" disabled={busy} onClick={leave}>
          {t.leaveList}
        </button>
      )}
    </Sheet>
  );
}
