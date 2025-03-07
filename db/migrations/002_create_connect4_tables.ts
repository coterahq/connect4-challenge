import db from "../config";

export async function up() {
  // Create games table
  db.run(`
    CREATE TABLE games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create moves table to store move history
  db.run(`
    CREATE TABLE moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      player INTEGER NOT NULL CHECK (player IN (1, 2)),
      column INTEGER NOT NULL CHECK (column >= 0 AND column < 7),
      move_number INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
    )
  `);

  // Create index for better query performance
  db.run('CREATE INDEX idx_moves_game_id ON moves(game_id)');
}

export async function down() {
  db.run('DROP TABLE IF EXISTS moves');
  db.run('DROP TABLE IF EXISTS games');
} 