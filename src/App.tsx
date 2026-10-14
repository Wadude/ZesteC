import { useEffect, useRef, useState } from 'react';
import { ListScreen } from './ListScreen';
import { SettingsScreen } from './SettingsScreen';
import { useLists } from './useLists';
import { useSession } from './useSession';
import { useTheme } from './useTheme';

type Screen = 'list' | 'settings';

const screenFromHash = (): Screen => (location.hash === '#settings' ? 'settings' : 'list');

/** Invite links look like /join/ABCD2345. Read the code once, then tidy the address bar. */
function takeJoinCode(): string | null {
  const m = location.pathname.match(/^\/join\/([A-Za-z0-9]{4,16})\/?$/);
  if (!m) return null;
  history.replaceState(null, '', '/');
  return m[1];
}
const initialJoinCode = takeJoinCode();

export default function App() {
  const { profile, error, refresh } = useSession();
  const { lists, current, ready, select, joinResult, clearJoinResult } = useLists(
    profile?.uid,
    initialJoinCode,
  );
  const [theme, setTheme] = useTheme();
  const [screen, setScreen] = useState<Screen>(screenFromHash);
  const openedInApp = useRef(false);

  // Screens use the URL hash so the phone's Back button works.
  useEffect(() => {
    const onHash = () => setScreen(screenFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Hide the "You joined…" message after a while.
  useEffect(() => {
    if (!joinResult) return;
    const t = setTimeout(clearJoinResult, 6000);
    return () => clearTimeout(t);
  }, [joinResult, clearJoinResult]);

  const openSettings = () => {
    openedInApp.current = true;
    location.hash = 'settings';
  };
  const goBack = () => {
    if (openedInApp.current) history.back();
    else history.replaceState(null, '', location.pathname + location.search);
    openedInApp.current = false;
    setScreen('list');
  };

  if (error) {
    return (
      <div className="splash">
        <p className="splash-title">Something went wrong</p>
        <p>{error}</p>
        <button className="splash-button" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  if (!profile || !ready || !current) {
    return (
      <div className="splash">
        <p className="splash-title">Zeste</p>
        <p>{initialJoinCode ? 'Joining the shared list…' : 'Getting your list ready…'}</p>
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        profile={profile}
        listId={current.id}
        theme={theme}
        onThemeChange={setTheme}
        onAccountChanged={refresh}
        onBack={goBack}
      />
    );
  }

  return (
    <>
      <ListScreen
        key={current.id}
        list={current}
        lists={lists}
        uid={profile.uid}
        onSelectList={select}
        onOpenSettings={openSettings}
      />
      {joinResult && (
        <div className="banner" role="status" onClick={clearJoinResult}>
          {joinResult.status === 'joined'
            ? `You joined "${lists.find((l) => l.id === joinResult.listId)?.name ?? 'the list'}". Changes sync live.`
            : joinResult.reason}
        </div>
      )}
    </>
  );
}
