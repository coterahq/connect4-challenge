import homepage from './src/index.html';
import { runMigrations } from './db/migrate';

const PORT = 3000;

// Run migrations before starting the server
await runMigrations();

Bun.serve({
  port: PORT,
  routes: {
    '/': homepage,
    "/health": new Response("OK"),
  },
});

console.log(`Listening on port ${PORT}`)
