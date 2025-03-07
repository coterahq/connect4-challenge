import db from "../../db/config";
import { Player } from "../types";
import { Connect4 } from "../game";

interface StoredMove {
  player: Player;
  column: number;
  move_number: number;
  created_at: string;
}

export class GameService {
  /**
   * Save a game state to the database
   */
  async saveGame(game: Connect4): Promise<number> {
    const state = game.getState();
    let gameId: number;
    
    // Start a transaction
    db.transaction(() => {
      // Create new game record
      const gameResult = db.prepare(`
        INSERT INTO games (created_at)
        VALUES (CURRENT_TIMESTAMP)
      `).run();

      gameId = Number(gameResult.lastInsertRowid);

      // Get all moves from the game state by checking the board
      const moves: { player: Player; column: number; }[] = [];
      
      // Reconstruct moves by scanning the board from bottom to top, left to right
      for (let row = state.board.length - 1; row >= 0; row--) {
        for (let col = 0; col < state.board[0].length; col++) {
          const player = state.board[row][col];
          if (player !== Player.None) {
            moves.push({ player, column: col });
          }
        }
      }

      // Save moves to the database
      const moveStmt = db.prepare(`
        INSERT INTO moves (game_id, player, column, move_number)
        VALUES (?, ?, ?, ?)
      `);

      moves.forEach((move, index) => {
        moveStmt.run(gameId, move.player, move.column, index + 1);
      });
    })();

    return gameId!;
  }

  /**
   * Load a game state from the database
   */
  async loadGame(gameId: number): Promise<Connect4 | null> {
    // Check if game exists
    const gameExists = db.prepare('SELECT 1 FROM games WHERE id = ?').get(gameId);
    if (!gameExists) {
      return null;
    }

    // Create new game instance
    const game = new Connect4(gameId);

    // Load all moves in order
    const moves = db.prepare(`
      SELECT player, column, move_number, created_at
      FROM moves
      WHERE game_id = ?
      ORDER BY move_number
    `).all(gameId) as StoredMove[];

    // Replay each move
    for (const move of moves) {
      const result = await game.makeMove(move.column, true); // Pass true to skip DB updates
      if (!result.isValid) {
        console.error(`Failed to replay move ${move.move_number}: ${result.error}`);
        return null;
      }
    }

    return game;
  }

  /**
   * Add a move to an existing game
   */
  async addMove(gameId: number, column: number, player: Player): Promise<void> {
    // Check if game exists first
    const gameExists = db.prepare('SELECT 1 FROM games WHERE id = ?').get(gameId);
    if (!gameExists) {
      throw new Error(`Game ${gameId} not found`);
    }

    const moveNumber = db.prepare(`
      SELECT COALESCE(MAX(move_number), 0) + 1 as next_move
      FROM moves
      WHERE game_id = ?
    `).get(gameId) as { next_move: number };

    db.prepare(`
      INSERT INTO moves (game_id, player, column, move_number)
      VALUES (?, ?, ?, ?)
    `).run(gameId, player, column, moveNumber.next_move);

    // Update game's updated_at timestamp
    db.prepare(`
      UPDATE games
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(gameId);
  }

  /**
   * Delete a game from the database
   */
  async deleteGame(gameId: number): Promise<void> {
    db.prepare('DELETE FROM games WHERE id = ?').run(gameId);
  }

  /**
   * List all games
   */
  async listGames(): Promise<Array<{ 
    id: number; 
    created_at: string;
    updated_at: string;
    moves_count: number;
  }>> {
    return db.prepare(`
      WITH move_counts AS (
        SELECT game_id, COUNT(*) as count
        FROM moves
        GROUP BY game_id
      )
      SELECT 
        g.id,
        g.created_at,
        g.updated_at,
        COALESCE(mc.count, 0) as moves_count
      FROM games g
      LEFT JOIN move_counts mc ON g.id = mc.game_id
      ORDER BY g.updated_at DESC
    `).all() as Array<{
      id: number;
      created_at: string;
      updated_at: string;
      moves_count: number;
    }>;
  }

  /**
   * Get move history for a game
   */
  async getMoveHistory(gameId: number): Promise<StoredMove[]> {
    return db.prepare(`
      SELECT player, column, move_number, created_at
      FROM moves
      WHERE game_id = ?
      ORDER BY move_number
    `).all(gameId) as StoredMove[];
  }
} 