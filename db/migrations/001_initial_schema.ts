import db from "../config";

export async function up() {
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add your schema migrations here
  // Example:
  // db.run(`
  //   CREATE TABLE users (
  //     id INTEGER PRIMARY KEY AUTOINCREMENT,
  //     username TEXT NOT NULL UNIQUE,
  //     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  //   )
  // `);
}

export async function down() {
  // Add your rollback migrations here
  // Example:
  // db.run('DROP TABLE IF EXISTS users');
  
  db.run('DROP TABLE IF EXISTS migrations');
} 