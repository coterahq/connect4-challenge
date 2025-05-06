import {
  Player,
  GameStatus,
  BOARD_ROWS,
  BOARD_COLS,
  DIRECTIONS,
  createInitialGameState
} from '../types';

import type {
  GameState,
  Position,
  Move,
  MoveValidation
} from '../types';

import { GameService } from './db/gameService';
import { Database } from 'bun:sqlite';

export class Connect4 {
  private state: GameState;
  private gameId: number | null = null;
  private gameService: GameService;

  constructor(gameId: number | null = null, private db: Database) {
    this.state = createInitialGameState();
    this.gameService = new GameService(db);
    this.gameId = gameId;
  }

  /**
   * Get the current game state
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * a function to "pretty print" the game state
   */
  toString(): string {
    return this.state.board.map(row => row.join(' ')).join('\n');
  }

  /**
   * Get the current game ID if it's stored in the database
   */
  getGameId(): number | null {
    return this.gameId;
  }

  /**
   * Validate if a move is legal
   */
  validateMove(column: number): MoveValidation {
    // Check if game is still in progress
    if (this.state.status !== GameStatus.InProgress) {
      return {
        isValid: false,
        error: 'Game is already finished'
      };
    }

    // Check if column is within bounds
    if (column < 0 || column >= BOARD_COLS) {
      return {
        isValid: false,
        error: `Column must be between 0 and ${BOARD_COLS - 1}`
      };
    }

    // Check if column is full
    if (this.state.board[0][column] !== Player.None) {
      return {
        isValid: false,
        error: 'Column is full'
      };
    }

    return { isValid: true };
  }

  /**
   * Make a move in the specified column
   */
  async makeMove(column: number, skipDbUpdate: boolean = false): Promise<MoveValidation> {
    const validation = this.validateMove(column);
    if (!validation.isValid) {
      return validation;
    }

    // Find the lowest empty position in the column
    const row = this.findLowestEmptyRow(column);
    if (row === -1) {
      return {
        isValid: false,
        error: 'Column is full'
      };
    }

    // Update the board
    this.state.board[row][column] = this.state.currentPlayer;
    
    // Record the move
    const move: Move = {
      player: this.state.currentPlayer,
      column,
      timestamp: new Date()
    };
    this.state.lastMove = move;

    // Check for win
    const winningPositions = this.checkWin(row, column);
    if (winningPositions) {
      this.state.status = GameStatus.Won;
      this.state.winner = this.state.currentPlayer;
      this.state.winningPositions = winningPositions;
    } else if (this.isDraw()) {
      // Check for draw
      this.state.status = GameStatus.Draw;
    }

    // If game isn't over, switch players
    if (this.state.status === GameStatus.InProgress) {
      this.state.currentPlayer = 
        this.state.currentPlayer === Player.Red ? Player.Yellow : Player.Red;
    }

    // If the game is stored in the database and we're not skipping updates, update it
    if (this.gameId !== null && !skipDbUpdate) {
      await this.gameService.addMove(this.gameId, column, move.player);
    }

    return { isValid: true };
  }

  /**
   * Save the current game state to the database
   */
  async save(): Promise<number> {
    const gameId = await this.gameService.saveGame(this);
    this.gameId = gameId;
    return gameId;
  }

  /**
   * Get move history for the current game
   */
  async getMoveHistory(): Promise<Move[]> {
    if (this.gameId === null) {
      return [];
    }
    const moves = await this.gameService.getMoveHistory(this.gameId);
    return moves.map(move => ({
      player: move.player,
      column: move.column,
      timestamp: new Date(move.created_at)
    }));
  }

  /**
   * Delete the current game from the database
   */
  async delete(): Promise<void> {
    if (this.gameId !== null) {
      await this.gameService.deleteGame(this.gameId);
      this.gameId = null;
    }
  }

  /**
   * Find the lowest empty row in a column
   */
  private findLowestEmptyRow(column: number): number {
    for (let row = BOARD_ROWS - 1; row >= 0; row--) {
      if (this.state.board[row][column] === Player.None) {
        return row;
      }
    }
    return -1;
  }

  /**
   * Check if the last move resulted in a win
   */
  private checkWin(row: number, col: number): Position[] | null {
    const player = this.state.board[row][col];

    for (const direction of DIRECTIONS) {
      const positions: Position[] = [{ row, col }];
      
      // Check in positive direction
      let count = 1;
      let r = row + direction.row;
      let c = col + direction.col;
      
      while (
        r >= 0 && r < BOARD_ROWS &&
        c >= 0 && c < BOARD_COLS &&
        this.state.board[r][c] === player
      ) {
        positions.push({ row: r, col: c });
        count++;
        r += direction.row;
        c += direction.col;
      }

      // Check in negative direction
      r = row - direction.row;
      c = col - direction.col;
      
      while (
        r >= 0 && r < BOARD_ROWS &&
        c >= 0 && c < BOARD_COLS &&
        this.state.board[r][c] === player
      ) {
        positions.push({ row: r, col: c });
        count++;
        r -= direction.row;
        c -= direction.col;
      }

      if (count >= 4) {
        return positions;
      }
    }

    return null;
  }

  /**
   * Check if the game is a draw
   */
  private isDraw(): boolean {
    for (let c = 0; c < BOARD_COLS; c++) {
      if (this.state.board[0][c] === Player.None) {
        return false;
      }
    }
    return true;
  }

  /**
   * Reset the game to initial state
   */
  reset(): void {
    this.state = createInitialGameState();
  }

  /**
   * Get the piece at a specific position
   */
  getPieceAt(row: number, col: number): Player {
    return this.state.board[row][col];
  }

  /**
   * Get available moves (non-full columns)
   */
  getAvailableMoves(): number[] {
    return this.state.board[0]
      .map((cell, index) => cell === Player.None ? index : -1)
      .filter(index => index !== -1);
  }
} 