import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';


interface Game {
  id: number;
  created_at: string;
  updated_at: string;
  moves_count: number;
}

export function GamesList() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGames() {
      try {
        const gamesResponse = await fetch('/api/games').then(res => res.json());
        const gamesList = gamesResponse.games;

        setGames(gamesList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load games');
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  if (loading) {
    return <div className="loading">Loading games...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (games.length === 0) {
    return <div className="empty-state">No games found. Start a new game!</div>;
  }

  return (
    <div className="games-list">
      {games.map(game => (
        <div key={game.id} className="game-card">
          <div className="game-info">
            <div className="game-id">
              <Link to={`/games/${game.id}`}>Game #{game.id}</Link>
            </div>
            <div className="game-meta">
              Created: {new Date(game.created_at).toLocaleString()}
              {game.updated_at && (
                <>
                  <br />
                  Last Move: {new Date(game.updated_at).toLocaleString()}
                </>
              )}
            </div>
          </div>
          <div className="moves-count">{game.moves_count} moves</div>
        </div>
      ))}
    </div>
  );
} 