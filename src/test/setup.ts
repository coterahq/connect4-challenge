import { beforeAll } from "bun:test";
import { runMigrations } from "../../db/migrate";

beforeAll(async () => {
  // Run all migrations before tests
  await runMigrations();
}); 