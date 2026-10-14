import { useEffect, useRef, useState } from 'react';
import { ListScreen } from './ListScreen';
import { SettingsScreen } from './SettingsScreen';
import { useSession } from './useSession';
import { useTheme } from './useTheme';

type Screen = 'list' | 'settings';

const screenFromHash = (): Screen => (location.hash === '#settings' ? 'settings' : 'list');

export default function App() {
  const { profile, listId, error, refresh } = useSession();
  const [theme, setTheme] = useTheme();
  const [screen, setScreen] = useState<Screen>(screenFromHash);
  const openedInApp = useRef(false);

  // Screens use the URL hash so the phone's Back button works.
  useEffect(() => {
    const onHash = () => setScreen(screenFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

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

  if (!profile || !listId) {
    return (
      <div className="splash">
        <p className="splash-title">Zeste</p>
        <p>Getting your list ready…</p>
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        profile={profile}
        listId={listId}
        theme={theme}
        onThemeChange={setTheme}
        onAccountChanged={refresh}
        onBack={goBack}
      />
    );
  }

  return <ListScreen listId={listId} uid={profile.uid} onOpenSettings={openSettings} />;
}
