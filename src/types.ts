// Board dimensions
export const BOARD_ROWS = 6;
export const BOARD_COLS = 7;

// Player definitions
export enum Player {
  None = 0,
  Red = 1,
  Yellow = 2
}

// Represents a single position on the board
export interface Position {
  row: number;
  col: number;
}

// Represents a move made by a player
export interface Move {
  player: Player;
  column: number;
  timestamp: Date;
}

// Direction vectors for checking win conditions
export const DIRECTIONS = [
  { row: 0, col: 1 },  // horizontal
  { row: 1, col: 0 },  // vertical
  { row: 1, col: 1 },  // diagonal down-right
  { row: 1, col: -1 }, // diagonal down-left
] as const;

// Game state
export enum GameStatus {
  InProgress = "IN_PROGRESS",
  Won = "WON",
  Draw = "DRAW"
}

// Represents the current state of the game
export interface GameState {
  board: Player[][];
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  lastMove: Move | null;
  winningPositions: Position[] | null;
}

// Function to create a new empty board
export function createEmptyBoard(): Player[][] {
  return Array(BOARD_ROWS).fill(null)
    .map(() => Array(BOARD_COLS).fill(Player.None));
}

// Function to create initial game state
export function createInitialGameState(): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: Player.Red, // Red goes first
    status: GameStatus.InProgress,
    winner: null,
    lastMove: null,
    winningPositions: null
  };
}

// Type for game settings/configuration
export interface GameConfig {
  enableTimer: boolean;
  timePerMove?: number; // in seconds
  aiOpponent?: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
}

// Type for game statistics
export interface GameStats {
  movesPlayed: number;
  gameStartTime: Date;
  gameEndTime?: Date;
  winner?: Player;
  playerStats: {
    [Player.Red]: PlayerStats;
    [Player.Yellow]: PlayerStats;
  };
}

// Individual player statistics
export interface PlayerStats {
  movesPlayed: number;
  averageMoveTime: number; // in milliseconds
  totalMoveTime: number;   // in milliseconds
}

// Validation result type
export interface MoveValidation {
  isValid: boolean;
  error?: string;
} 