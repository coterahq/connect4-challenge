import { Database } from "bun:sqlite";

// Initialize the database
const db = new Database("db/data.sqlite");

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

export default db; 