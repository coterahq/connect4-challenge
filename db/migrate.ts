import { readdirSync } from "fs";
import { join } from "path";
import { Database } from "bun:sqlite";

export async function runMigrations(db: Database) {
  // Create migrations table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get all migration files
  const migrationsDir = join(import.meta.dir, "migrations");
  const migrationFiles = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".ts"))
    .sort();

  // Get already run migrations
  const ranMigrations = db.prepare("SELECT name FROM migrations").all() as {
    name: string;
  }[];
  const ranMigrationNames = new Set(ranMigrations.map((m) => m.name));

  // Run pending migrations
  for (const migrationFile of migrationFiles) {
    if (!ranMigrationNames.has(migrationFile)) {
      console.log(`Running migration: ${migrationFile}`);

      const migration = await import(join(migrationsDir, migrationFile));
      await migration.up(db);

      db.prepare("INSERT INTO migrations (name) VALUES (?)").run(migrationFile);
      console.log(`Completed migration: ${migrationFile}`);
    }
  }
}

