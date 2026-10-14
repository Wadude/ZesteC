import { useEffect, useRef, useState } from 'react';
import { BudgetScreen } from './BudgetScreen';
import { ListScreen } from './ListScreen';
import { SettingsScreen } from './SettingsScreen';
import { listName } from './i18n';
import { useI18n } from './useI18n';
import { useLists } from './useLists';
import { useSession } from './useSession';
import { useAccent, useTheme } from './useTheme';

type Screen = 'list' | 'settings' | 'budget';

const screenFromHash = (): Screen =>
  location.hash === '#settings' ? 'settings' : location.hash === '#budget' ? 'budget' : 'list';

/** Invite links look like /join/ABCD2345. Read the code once, then tidy the address bar. */
function takeJoinCode(): string | null {
  const m = location.pathname.match(/^\/join\/([A-Za-z0-9]{4,16})\/?$/);
  if (!m) return null;
  history.replaceState(null, '', '/');
  return m[1];
}
const initialJoinCode = takeJoinCode();

export default function App() {
  const { t } = useI18n();
  const { profile, error, refresh } = useSession();
  const { lists, current, ready, select, joinResult, clearJoinResult } = useLists(
    profile?.uid,
    initialJoinCode,
    t.defaultListName,
  );
  const [theme, setTheme] = useTheme();
  const [accent, setAccent] = useAccent();

  // Colour the phone's status bar to match the theme.
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const dark = matchMedia('(prefers-color-scheme: dark)');
    const sync = () => {
      if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    };
    sync();
    dark.addEventListener('change', sync);
    return () => dark.removeEventListener('change', sync);
  }, [theme, accent]);
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

  const open = (next: Exclude<Screen, 'list'>) => {
    openedInApp.current = true;
    location.hash = next;
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
        <p className="splash-title">{t.errorTitle}</p>
        <p>{t.errorConnect}</p>
        <button className="splash-button" onClick={() => location.reload()}>
          {t.tryAgain}
        </button>
      </div>
    );
  }

  if (!profile || !ready || !current) {
    return (
      <div className="splash">
        <p className="splash-title">Zeste</p>
        <p>{initialJoinCode ? t.joining : t.gettingReady}</p>
      </div>
    );
  }

  if (screen === 'budget') {
    return <BudgetScreen key={current.id} list={current} uid={profile.uid} onBack={goBack} />;
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        profile={profile}
        listId={current.id}
        theme={theme}
        onThemeChange={setTheme}
        accent={accent}
        onAccentChange={setAccent}
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
        onOpenSettings={() => open('settings')}
        onOpenBudget={() => open('budget')}
      />
      {joinResult && (
        <div className="banner" role="status" onClick={clearJoinResult}>
          {joinResult.status === 'joined'
            ? t.joined(listName(lists.find((l) => l.id === joinResult.listId)?.name ?? t.theList, t))
            : joinResult.reason === 'offline'
              ? t.joinOffline
              : t.joinInvalid}
        </div>
      )}
    </>
  );
}
