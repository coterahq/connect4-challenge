import "./test/setup";
import { expect, describe, test, beforeEach } from "bun:test";
import { Connect4 } from "./game";
import { Player, GameStatus } from "../types";
import { Database } from "bun:sqlite";
import { GameService } from "./db/gameService";

const db = new Database("db/data.sqlite");

const gameService = new GameService(db);

describe("Connect4 Database Integration", () => {
  // Clean up the database before each test
  beforeEach(() => {
    db.prepare('DELETE FROM moves').run();
    db.prepare('DELETE FROM games').run();
  });

  describe("Game Persistence", () => {
    
    test("should save and load a game", async () => {
      const game = new Connect4(undefined, db);
      
      // Make some moves
      await game.makeMove(3); // Red in column 3
      await game.makeMove(4); // Yellow in column 4
      
      // Save the game
      const gameId = await game.save();
      expect(gameId).toBeGreaterThan(0);
      expect(game.getGameId()).toBe(gameId);

      // Load the game
      const loadedGame = await gameService.loadGame(gameId);

      expect(loadedGame).not.toBeNull();
      
      // Verify game state
      const state = loadedGame!.getState();
      expect(state.board[5][3]).toBe(Player.Red);
      expect(state.board[5][4]).toBe(Player.Yellow);
      expect(state.currentPlayer).toBe(Player.Red);
      expect(state.status).toBe(GameStatus.InProgress);
    });

    test("should track move history", async () => {
      const game = new Connect4(undefined, db);
      
      // Make and save moves
      await game.makeMove(3);
      await game.makeMove(4);
      const gameId = await game.save();

      // Get move history
      const history = await game.getMoveHistory();
      expect(history).toHaveLength(2);
      expect(history[0].player).toBe(Player.Red);
      expect(history[0].column).toBe(3);
      expect(history[1].player).toBe(Player.Yellow);
      expect(history[1].column).toBe(4);
    });

    test("should automatically save new moves for saved games", async () => {
      const game = new Connect4(undefined, db);
      await game.makeMove(3);
      const gameId = await game.save();

      // Make additional move
      await game.makeMove(4);

      // Load game and verify moves
      const loadedGame = await gameService.loadGame(gameId);
      const history = await loadedGame!.getMoveHistory();
      expect(history).toHaveLength(2);
      expect(history[1].column).toBe(4);
    });
  });

  describe("Game Listing", () => {
    test("should list all saved games", async () => {
      // Create and save multiple games
      const game1 = new Connect4(undefined, db);
      await game1.makeMove(3);
      await game1.save();

      const game2 = new Connect4(undefined, db);
      await game2.makeMove(4);
      await game2.makeMove(3);
      await game2.save();

      // List games
      const games = await gameService.listGames();
      expect(games).toHaveLength(2);
      expect(games[0].moves_count).toBe(2); // game2
      expect(games[1].moves_count).toBe(1); // game1
    });
  });

  describe("Game Deletion", () => {
    test("should delete a saved game", async () => {
      const game = new Connect4(undefined, db);
      await game.makeMove(3);
      const gameId = await game.save();

      // Delete the game
      await game.delete();
      expect(game.getGameId()).toBeNull();

      // Try to load deleted game
      const loadedGame = await gameService.loadGame(gameId);
      expect(loadedGame).toBeNull();
    });
  });

  describe("Game State Management", () => {
    test("should save and load a winning game state", async () => {
      const game = new Connect4(undefined, db);
      
      // Create a winning position for Red
      await game.makeMove(0); // Red
      await game.makeMove(1); // Yellow
      await game.makeMove(0); // Red
      await game.makeMove(1); // Yellow
      await game.makeMove(0); // Red
      await game.makeMove(1); // Yellow
      await game.makeMove(0); // Red wins vertically

      const gameId = await game.save();
      const loadedGame = await gameService.loadGame(gameId);
      
      const state = loadedGame!.getState();
      expect(state.status).toBe(GameStatus.Won);
      expect(state.winner).toBe(Player.Red);
      expect(state.winningPositions).toHaveLength(4);
    });

    test("should save and load a drawn game state", async () => {
      const game = new Connect4(undefined, db);
      
      // Fill the board in a pattern that leads to a draw
      for (let col = 0; col < 7; col++) {
        for (let i = 0; i < 6; i++) {
          await game.makeMove(col);
        }
      }

      const gameId = await game.save();
      const loadedGame = await gameService.loadGame(gameId);
      
      const state = loadedGame!.getState();
      expect(state.status).toBe(GameStatus.Draw);
      expect(state.winner).toBeNull();
    });

    test("should handle invalid game IDs", async () => {
      const loadedGame = await gameService.loadGame(999999);
      expect(loadedGame).toBeNull();
    });
  });

  describe("Move Validation", () => {
    test("should prevent moves in finished games", async () => {
      const game = new Connect4(undefined, db);
      
      // Create a winning position
      await game.makeMove(0); // Red
      await game.makeMove(1); // Yellow
      await game.makeMove(0); // Red
      await game.makeMove(1); // Yellow
      await game.makeMove(0); // Red
      await game.makeMove(1); // Yellow
      await game.makeMove(0); // Red wins vertically

      const gameId = await game.save();
      const loadedGame = await gameService.loadGame(gameId);
      
      // Try to make a move in the finished game
      const result = await loadedGame!.makeMove(2);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Game is already finished');
    });
  });
}); 