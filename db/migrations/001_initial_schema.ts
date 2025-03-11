import { Database } from 'bun:sqlite';

export async function up(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function down(db: Database) {
  db.run('DROP TABLE IF EXISTS migrations');
} 