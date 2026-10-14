import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getOrCreateInvite, inviteUrl, leaveList, renameList, resetInvite } from './lists';
import { Sheet } from './Sheet';
import type { List } from './types';

interface Props {
  list: List;
  uid: string;
  onClose: () => void;
}

interface Member {
  uid: string;
  name: string;
  photoURL: string | null;
}

/** Names and photos of a list's members. Guests show as "Guest". */
function useMembers(memberIds: string[]) {
  const [members, setMembers] = useState<Member[]>([]);
  const key = memberIds.join(',');
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      memberIds.map(async (uid) => {
        const snap = await getDoc(doc(db, 'users', uid)).catch(() => null);
        const data = snap?.data();
        return { uid, name: (data?.name as string) ?? 'Guest', photoURL: (data?.photoURL as string) ?? null };
      }),
    ).then((m) => !cancelled && setMembers(m));
    return () => {
      cancelled = true;
    };
  }, [key]); // memberIds is a new array each render; key captures its contents.
  return members;
}

export function ShareSheet({ list, uid, onClose }: Props) {
  const [name, setName] = useState(list.name);
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
        (e as Error).message === 'offline'
          ? "You need to be online for this. Try again when you're connected."
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const share = () =>
    run(async () => {
      const url = inviteUrl(await getOrCreateInvite(list, uid));
      const text = `Join my grocery list "${list.name}" on Zeste`;
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Zeste', text, url });
          return;
        } catch (e) {
          if ((e as Error).name === 'AbortError') return; // closed the share menu
        }
      }
      await navigator.clipboard.writeText(`${text}: ${url}`);
      setMessage('Invite link copied. Paste it into WhatsApp, SMS or email.');
    });

  const copyLink = () =>
    run(async () => {
      const url = inviteUrl(await getOrCreateInvite(list, uid));
      await navigator.clipboard.writeText(url);
      setMessage('Link copied.');
    });

  const reset = () =>
    run(async () => {
      await resetInvite(list, uid);
      setMessage('New link made. The old link no longer works.');
    });

  const leave = () =>
    run(async () => {
      if (!confirm(`Leave "${list.name}"? You'll need a new invite to join again.`)) return;
      await leaveList(list.id, uid);
      onClose();
    });

  const saveName = () => {
    if (name.trim() && name.trim() !== list.name) renameList(list.id, name);
  };

  return (
    <Sheet label={`Share ${list.name}`} onClose={onClose}>
      <label className="field">
        <span>List name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          autoComplete="off"
        />
      </label>

      <div className="field">
        <span>Share this list</span>
        <p className="muted small">
          Anyone with the link can see and change this list. Changes show up on everyone's phone straight
          away.
        </p>
        <button type="button" className="primary-button wide" disabled={busy} onClick={share}>
          {busy ? 'Please wait…' : 'Send invite link'}
        </button>
        {list.inviteCode && (
          <div className="invite-row">
            <span className="invite-code" aria-label="Invite code">
              {list.inviteCode}
            </span>
            <button type="button" className="link-button" disabled={busy} onClick={copyLink}>
              Copy link
            </button>
            <button type="button" className="link-button" disabled={busy} onClick={reset}>
              New link
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
        <span>People ({list.memberIds.length})</span>
        <ul className="members">
          {members.map((m) => (
            <li key={m.uid}>
              {m.photoURL ? (
                <img className="avatar small" src={m.photoURL} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="avatar small avatar-letter" aria-hidden="true">
                  {m.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="member-name">
                {m.name}
                {m.uid === uid && ' (you)'}
              </span>
              {m.uid === list.ownerId && <span className="badge">Owner</span>}
            </li>
          ))}
        </ul>
      </div>

      {!isOwner && (
        <button type="button" className="text-danger" disabled={busy} onClick={leave}>
          Leave this list
        </button>
      )}
    </Sheet>
  );
}
