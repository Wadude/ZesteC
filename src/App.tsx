import { ListScreen } from './ListScreen';
import { useSession } from './useSession';

export default function App() {
  const { user, listId, error } = useSession();

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

  if (!user || !listId) {
    return (
      <div className="splash">
        <p className="splash-title">Zeste</p>
        <p>Getting your list ready…</p>
      </div>
    );
  }

  return <ListScreen listId={listId} uid={user.uid} />;
}
