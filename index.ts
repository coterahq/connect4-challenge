import { runMigrations } from './db/migrate';
import { handleGamesList } from './src/handlers/games';
import { loadTemplate } from './src/utils/template';
import { join } from 'path';

const PORT = 3000;

// Run migrations before starting the server
await runMigrations();

// Load homepage template
const homepage = await loadTemplate(join(import.meta.dir, 'src/index.html'));

Bun.serve({
  port: PORT,
  routes: {
    '/': () => new Response(homepage, {
      headers: { 'Content-Type': 'text/html' }
    }),
    '/games': handleGamesList,
    '/health': new Response('OK'),
  },
});

console.log(`Listening on port ${PORT}`);
