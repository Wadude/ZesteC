import { useEffect, useRef, useState } from 'react';
import { useAccess } from './access';
import { AccessScreen } from './AccessScreen';
import { BudgetScreen } from './BudgetScreen';
import { FeedbackSheet } from './FeedbackSheet';
import { HouseholdScreen } from './HouseholdScreen';
import { ListScreen } from './ListScreen';
import { SettingsScreen } from './SettingsScreen';
import { StatsScreen } from './StatsScreen';
import { TabBar, type Tab } from './TabBar';
import { listName } from './i18n';
import { useI18n } from './useI18n';
import { useLists } from './useLists';
import { useSession } from './useSession';
import { useAccent, useTheme } from './useTheme';
import { startUsage } from './usage';

// The four tabs, plus the owner-only stats screen opened from Settings.
type Screen = Tab | 'stats';

const SCREENS: Screen[] = ['budget', 'household', 'settings', 'stats'];
const screenFromHash = (): Screen => {
  const h = location.hash.slice(1) as Screen;
  return SCREENS.includes(h) ? h : 'list';
};

/** Invite links look like /join/ABCD2345. Read the code once, then tidy the address bar. */
function takeJoinCode(): string | null {
  const m = location.pathname.match(/^\/join\/([A-Za-z0-9]{4,16})\/?$/);
  if (!m) return null;
  history.replaceState(null, '', '/');
  return m[1];
}
const initialJoinCode = takeJoinCode();

export default function App() {
  const { t, lang } = useI18n();
  const { profile, error, refresh } = useSession();
  // Private testing: lists load only once this account has been let in.
  const access = useAccess(profile?.uid, initialJoinCode);
  const { lists, current, ready, select, joinResult, clearJoinResult } = useLists(
    access.state === 'ok' ? profile?.uid : undefined,
    initialJoinCode,
    t.defaultListName,
  );
  const [theme, setTheme] = useTheme();
  const [accent, setAccent] = useAccent();

  // Usage numbers start once this person has been let in to the test.
  const uid = profile?.uid;
  useEffect(() => {
    if (uid && access.state === 'ok') startUsage(uid, lang);
  }, [uid, access.state, lang]);

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
  const [feedbackFrom, setFeedbackFrom] = useState<string | null>(null);

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

  // Switching tabs replaces the address (Back doesn't step through every tab you visited).
  const goTab = (tab: Tab) => {
    history.replaceState(null, '', tab === 'list' ? location.pathname + location.search : `#${tab}`);
    setScreen(tab);
    window.scrollTo(0, 0);
  };
  // Stats is a page on top of Settings, so Back returns to Settings.
  const openStats = () => {
    openedInApp.current = true;
    location.hash = 'stats';
  };
  const closeStats = () => {
    if (openedInApp.current) history.back();
    else history.replaceState(null, '', '#settings');
    openedInApp.current = false;
    setScreen('settings');
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

  if (profile && access.state === 'needCode') {
    return <AccessScreen onSubmit={access.submit} />;
  }

  if (!profile || !ready || !current) {
    return (
      <div className="splash">
        <p className="splash-title">Zeste</p>
        <p>{initialJoinCode ? t.joining : t.gettingReady}</p>
      </div>
    );
  }

  const feedback = feedbackFrom && (
    <FeedbackSheet profile={profile} screen={feedbackFrom} onClose={() => setFeedbackFrom(null)} />
  );

  if (screen === 'stats') {
    return <StatsScreen onBack={closeStats} />;
  }

  const tabs = <TabBar current={screen} onChange={goTab} members={current.memberIds.length} />;

  return (
    <>
      {screen === 'budget' && (
        <BudgetScreen key={current.id} list={current} uid={profile.uid} lists={lists} onSelectList={select} />
      )}
      {screen === 'household' && (
        <HouseholdScreen list={current} lists={lists} uid={profile.uid} onSelectList={select} />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          profile={profile}
          listId={current.id}
          theme={theme}
          onThemeChange={setTheme}
          accent={accent}
          onAccentChange={setAccent}
          onFeedback={() => setFeedbackFrom('settings')}
          onOpenStats={openStats}
          onAccountChanged={refresh}
        />
      )}
      {screen === 'list' && (
        <ListScreen
          key={current.id}
          list={current}
          lists={lists}
          profile={profile}
          onSelectList={select}
          onOpenBudget={() => goTab('budget')}
          onFeedback={() => setFeedbackFrom('list')}
        />
      )}
      {tabs}
      {feedback}
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
