import { beforeAll } from "bun:test";
import { runMigrations } from "../../../db/migrate";
import db from "../db/db";

beforeAll(async () => {
  // Run all migrations before tests
  await runMigrations(db);
}); 