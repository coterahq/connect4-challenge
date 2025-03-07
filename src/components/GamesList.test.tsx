import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import React from 'react';
import { renderToString } from 'react-dom/server';
import { GamesList } from "./GamesList";
import { Connect4 } from "../game";
import db from "../../db/config";

// Mock the Connect4 class
const originalListGames = Connect4.listGames;
let mockListGames: any;

describe("GamesList", () => {
  beforeEach(() => {
    db.prepare('DELETE FROM moves').run();
    db.prepare('DELETE FROM games').run();
    
    // Setup mock
    mockListGames = mock(() => Promise.resolve([]));
    Connect4.listGames = mockListGames;
  });

  afterEach(() => {
    // Restore original method
    Connect4.listGames = originalListGames;
  });

  test("shows loading state initially", () => {
    mockListGames.mockImplementation(() => new Promise(() => {})); // Never resolves
    const html = renderToString(<GamesList />);
    expect(html).toContain('class="loading"');
    expect(html).toContain('Loading games...');
  });

  test("shows empty state when no games exist", async () => {
    mockListGames.mockReturnValue(Promise.resolve([]));
    const html = renderToString(<GamesList />);
    expect(html).toContain('class="loading"'); // Initial state is loading

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    const updatedHtml = renderToString(<GamesList />);
    expect(updatedHtml).toContain('class="empty-state"');
    expect(updatedHtml).toContain('No games found');
  });

  test("shows error state when loading fails", async () => {
    mockListGames.mockReturnValue(Promise.reject(new Error("Failed to load")));
    const html = renderToString(<GamesList />);
    expect(html).toContain('class="loading"'); // Initial state is loading

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    const updatedHtml = renderToString(<GamesList />);
    expect(updatedHtml).toContain('class="error"');
    expect(updatedHtml).toContain('Failed to load');
  });

  test("renders game list when games exist", async () => {
    const mockGames = [
      {
        id: 1,
        created_at: "2024-03-07T10:00:00Z",
        updated_at: "2024-03-07T10:05:00Z",
        moves_count: 3
      },
      {
        id: 2,
        created_at: "2024-03-07T11:00:00Z",
        updated_at: "2024-03-07T11:10:00Z",
        moves_count: 5
      }
    ];

    mockListGames.mockReturnValue(Promise.resolve(mockGames));
    const html = renderToString(<GamesList />);
    expect(html).toContain('class="loading"'); // Initial state is loading

    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    const updatedHtml = renderToString(<GamesList />);
    expect(updatedHtml).toContain('class="games-list"');
    expect(updatedHtml).toContain('Game #1');
    expect(updatedHtml).toContain('Game #2');
    expect(updatedHtml).toContain('3 moves');
    expect(updatedHtml).toContain('5 moves');
  });
}); 