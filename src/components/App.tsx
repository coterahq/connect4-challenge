import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { GamesList } from './GamesList';

export function App() {
  return (
    <div className="app">
      <h1>Connect 4</h1>
      <nav>
        <Link to="/" className="nav-link">New Game</Link>
        <Link to="/games" className="nav-link secondary">View All Games</Link>
      </nav>
      <Routes>
        <Route path="/" element={<div>Game Board Coming Soon</div>} />
        <Route path="/games" element={<GamesList />} />
      </Routes>
    </div>
  );
} 