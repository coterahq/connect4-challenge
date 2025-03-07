import {
  Player,
  GameStatus,
  BOARD_ROWS,
  BOARD_COLS,
  DIRECTIONS,
  createInitialGameState
} from './types';

import type {
  GameState,
  Position,
  Move,
  MoveValidation
} from './types';

export class Connect4 {
  private state: GameState;

  constructor() {
    this.state = createInitialGameState();
  }

  /**
   * Get the current game state
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * Validate if a move is legal
   */
  validateMove(column: number): MoveValidation {
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

    // Check if game is still in progress
    if (this.state.status !== GameStatus.InProgress) {
      return {
        isValid: false,
        error: 'Game is already finished'
      };
    }

    return { isValid: true };
  }

  /**
   * Make a move in the specified column
   */
  makeMove(column: number): MoveValidation {
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
      return { isValid: true };
    }

    // Check for draw
    if (this.isDraw()) {
      this.state.status = GameStatus.Draw;
      return { isValid: true };
    }

    // Switch players
    this.state.currentPlayer = 
      this.state.currentPlayer === Player.Red ? Player.Yellow : Player.Red;

    return { isValid: true };
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
    return this.state.board[0].every(cell => cell !== Player.None);
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