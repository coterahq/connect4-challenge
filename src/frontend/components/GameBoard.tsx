import { useState, useEffect } from 'react';
import { Player, type GameState } from '../../types';

export function GameBoard(props: { gameId?: string }) {
  const [game, setGame] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(props.gameId ?? null);
  const [waitingForMove, setWaitingForMove] = useState<boolean>(false);

  useEffect(() => {
    // Load the game state from the database
    const loadGame = async () => {
      let gameId = props.gameId;
      try {
        if (!gameId) {
          const gameResponse = await fetch('/api/games/create', { method: 'POST' }).then(res => res.json());
          gameId = gameResponse.game;
          setGameId(gameId!);
        }

        const gameResponse = await fetch(`/api/games/${gameId}`).then(res => res.json());

        const game = gameResponse.game.state as GameState;

        setGame(game);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game');
      }
    };

    loadGame();
  }, []);

  const makeMove = async (col: number) => {
    console.log("Making move", col);
    if (!gameId) {
      return;
    }

    setWaitingForMove(true);

    const gameResponse = await fetch(`/api/games/${gameId}/move`, {
      method: 'POST',
      body: JSON.stringify({ move: col }),
    }).then(res => res.json());
    
    setGame(gameResponse.game.state as GameState);
    setWaitingForMove(false);
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!game) {
    return <div className="loading">Loading game...</div>;
  }

  return (
    <div className="game-board">
      <div className="game-header">
        <h1>Connect 4</h1>
        <p>Current Player: {game.currentPlayer === Player.Red ? 'Red' : 'Yellow'}</p>
      </div>
      <Board gameState={game} onCellClick={makeMove} />
      {waitingForMove && <div className="waiting-for-move">Syncing with server...</div>}
    </div>
  );
}

interface BoardProps {
  gameState: GameState;
  onCellClick?: (col: number) => void;
}

export const Board: React.FC<BoardProps> = ({ gameState, onCellClick }) => {
  const cellSize = 50; // cell width and height in pixels

  // Helper to render a piece based on the cell value
  const renderCellContent = (cell: Player) => {
    switch (cell) {
      case Player.Red:
        return "🔴";
      case Player.Yellow:
        return "🟡";
      default:
        return "";
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gameState.board[0].length}, ${cellSize}px)`,
        gap: "5px",
        justifyContent: "center",
      }}
    >
      {gameState.board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            onClick={() => onCellClick && onCellClick(colIndex)}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              border: "1px solid #333",
              backgroundColor: "#eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: onCellClick ? "pointer" : "default",
              fontSize: "24px",
            }}
          >
            {renderCellContent(cell)}
          </div>
        ))
      )}
    </div>
  );
};