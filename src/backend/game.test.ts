import { expect, describe, test, beforeEach } from "bun:test";
import { Connect4 } from "./game";
import db from "./db/db";
import { GameStatus } from "../types";
import { Player } from "../types";

describe("Connect4", () => {
  let game: Connect4;

  beforeEach(() => {
    game = new Connect4(undefined, db);
  });

  describe("Initial State", () => {
    test("should start with an empty board", () => {
      const state = game.getState();
      expect(state.board.flat().every(cell => cell === Player.None)).toBe(true);
    });

    test("should start with Red player", () => {
      expect(game.getState().currentPlayer).toBe(Player.Red);
    });

    test("should start with InProgress status", () => {
      expect(game.getState().status).toBe(GameStatus.InProgress);
    });
  });

  describe("Move Validation", () => {
    test("should reject moves outside board bounds", () => {
      expect(game.validateMove(-1).isValid).toBe(false);
      expect(game.validateMove(7).isValid).toBe(false);
    });

    test("should accept valid moves", () => {
      expect(game.validateMove(0).isValid).toBe(true);
      expect(game.validateMove(6).isValid).toBe(true);
    });

    test("should reject moves in full columns", () => {
      // Fill up column 0
      for (let i = 0; i < 6; i++) {
        game.makeMove(0);
      }
      expect(game.validateMove(0).isValid).toBe(false);
    });
  });

  describe("Making Moves", () => {
    test("should place piece at bottom of empty column", () => {
      game.makeMove(0);
      expect(game.getPieceAt(5, 0)).toBe(Player.Red);
    });

    test("should stack pieces in same column", () => {
      game.makeMove(0); // Red at bottom
      game.makeMove(0); // Yellow above
      expect(game.getPieceAt(5, 0)).toBe(Player.Red);
      expect(game.getPieceAt(4, 0)).toBe(Player.Yellow);
    });

    test("should alternate between players", () => {
      game.makeMove(0);
      expect(game.getState().currentPlayer).toBe(Player.Yellow);
      game.makeMove(1);
      expect(game.getState().currentPlayer).toBe(Player.Red);
    });
  });

  describe("Win Detection", () => {
    test("should detect horizontal win", () => {
      // Red plays winning move
      game.makeMove(0); // Red
      game.makeMove(0); // Yellow
      game.makeMove(1); // Red
      game.makeMove(1); // Yellow
      game.makeMove(2); // Red
      game.makeMove(2); // Yellow
      game.makeMove(3); // Red wins

      const state = game.getState();
      expect(state.status).toBe(GameStatus.Won);
      expect(state.winner).toBe(Player.Red);
      expect(state.winningPositions).toHaveLength(4);
    });

    test("should detect vertical win", () => {
      // Red plays in same column
      game.makeMove(0); // Red
      game.makeMove(1); // Yellow
      game.makeMove(0); // Red
      game.makeMove(1); // Yellow
      game.makeMove(0); // Red
      game.makeMove(1); // Yellow
      game.makeMove(0); // Red wins

      const state = game.getState();
      expect(state.status).toBe(GameStatus.Won);
      expect(state.winner).toBe(Player.Red);
      expect(state.winningPositions).toHaveLength(4);
    });

    test("should detect diagonal win (up-right)", () => {
      // Create diagonal win scenario
      game.makeMove(0); // Red
      game.makeMove(1); // Yellow
      game.makeMove(1); // Red
      game.makeMove(2); // Yellow
      game.makeMove(2); // Red
      game.makeMove(3); // Yellow
      game.makeMove(2); // Red
      game.makeMove(3); // Yellow
      game.makeMove(3); // Red
      game.makeMove(0); // Yellow
      game.makeMove(3); // Red wins

      const state = game.getState();
      expect(state.status).toBe(GameStatus.Won);
      expect(state.winner).toBe(Player.Red);
      expect(state.winningPositions).toHaveLength(4);
    });

    test("should detect diagonal win (up-left)", () => {
      // Create diagonal win scenario
      game.makeMove(6); // Red
      game.makeMove(5); // Yellow
      game.makeMove(5); // Red
      game.makeMove(4); // Yellow
      game.makeMove(4); // Red
      game.makeMove(3); // Yellow
      game.makeMove(4); // Red
      game.makeMove(3); // Yellow
      game.makeMove(3); // Red
      game.makeMove(6); // Yellow
      game.makeMove(3); // Red wins

      const state = game.getState();
      expect(state.status).toBe(GameStatus.Won);
      expect(state.winner).toBe(Player.Red);
      expect(state.winningPositions).toHaveLength(4);
    });
  });

  describe("Draw Detection", () => {
    test("should detect draw when board is full", async () => {
      // Fill the board in a checkerboard pattern to prevent any wins
      // We'll fill alternating columns from bottom to top
      const columnOrder = [0, 2, 4, 6, 1, 3, 5];
      
      // Fill each column
      for (const col of columnOrder) {
        for (let i = 0; i < 6; i++) {
          const result = await game.makeMove(col);
          if (!result.isValid) {
            console.log(`Move to column ${col} failed:`, result.error);
          }
          expect(result.isValid).toBe(true);
        }
      }
      
      const state = game.getState();
      expect(state.status).toBe(GameStatus.Draw);
      expect(state.winner).toBeNull();

      // Verify board is full
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
          expect(game.getPieceAt(row, col)).not.toBe(Player.None);
        }
      }

      // Verify no more moves are allowed
      for (let col = 0; col < 7; col++) {
        expect(game.validateMove(col).isValid).toBe(false);
      }
    });
  });

  describe("Game Reset", () => {
    test("should reset to initial state", () => {
      // Make some moves
      game.makeMove(0);
      game.makeMove(1);
      
      // Reset game
      game.reset();
      
      const state = game.getState();
      expect(state.board.flat().every(cell => cell === Player.None)).toBe(true);
      expect(state.currentPlayer).toBe(Player.Red);
      expect(state.status).toBe(GameStatus.InProgress);
      expect(state.winner).toBeNull();
      expect(state.lastMove).toBeNull();
      expect(state.winningPositions).toBeNull();
    });
  });

  describe("Available Moves", () => {
    test("should return all columns initially", () => {
      expect(game.getAvailableMoves()).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    test("should not include full columns", () => {
      // Fill column 0
      for (let i = 0; i < 6; i++) {
        game.makeMove(0);
      }
      expect(game.getAvailableMoves()).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });
}); 