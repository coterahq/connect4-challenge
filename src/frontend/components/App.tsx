import { Routes, Route, Link, useParams } from 'react-router-dom';
import { GamesList } from './GamesList';
import { GameBoard } from './GameBoard';

export function App() {
  return (
    <div className="app">
      <h1>Connect 4</h1>
      <nav>
        <Link to="/games/new" className="nav-link">New Game</Link>
        <Link to="/games" className="nav-link secondary">View All Games</Link>
      </nav>
      <Routes>
        <Route path="/" element={<div>Game Board Coming Soon</div>} />
        <Route path='/games'>
          <Route index element={<GamesList />} />
          <Route path="new" element={<NewGameBoard />} />
          <Route path=":gameId" element={<ExistingGameBoard />} />
        </Route>
      </Routes>
    </div>
  );
} 

const NewGameBoard = () => {
  return <GameBoard gameId={undefined} />;
}

const ExistingGameBoard = () => {
  const { gameId } = useParams() as { gameId?: string };
  return <GameBoard gameId={gameId} />;
}