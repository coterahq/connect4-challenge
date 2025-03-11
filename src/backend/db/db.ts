import { Database } from "bun:sqlite";

const db = new Database("db/data.sqlite");

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

export default db;