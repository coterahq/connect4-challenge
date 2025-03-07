import { describe, expect, test, beforeAll } from "bun:test";
import db from "./config";
import { runMigrations } from "./migrate";

interface TableInfo {
  name: string;
  sql: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

describe("Database Schema", () => {
  beforeAll(async () => {
    // Run migrations to ensure database is up to date
    await runMigrations();
  });

  test("migrations table exists", () => {
    const result = db.prepare(`
      SELECT name 
      FROM sqlite_master 
      WHERE type='table' AND name='migrations'
    `).get() as TableInfo | undefined;

    expect(result).toBeDefined();
    expect(result?.name).toBe("migrations");

    // Check migrations table structure
    const tableInfo = db.prepare("PRAGMA table_info(migrations)").all() as ColumnInfo[];
    expect(tableInfo).toHaveLength(3);
    
    const columnNames = tableInfo.map(col => col.name);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("name");
    expect(columnNames).toContain("created_at");
  });

  test("list all tables in database", () => {
    const tables = db.prepare(`
      SELECT name, sql
      FROM sqlite_master
      WHERE type='table'
      ORDER BY name
    `).all() as TableInfo[];

    console.log("\nDatabase Tables:");
    tables.forEach(table => {
      console.log(`\n--- ${table.name} ---`);
      console.log(table.sql);
      
      // Show table columns
      const columns = db.prepare(`PRAGMA table_info(${table.name})`).all() as ColumnInfo[];
      console.log("\nColumns:");
      columns.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
      });
    });

    // Ensure we have at least the migrations table
    expect(tables.length).toBeGreaterThanOrEqual(1);
  });
}); 