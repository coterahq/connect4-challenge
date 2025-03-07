import { runMigrations } from './db/migrate';
import { join } from 'path';

const PORT = 3000;

// Run migrations before starting the server
await runMigrations();

// Load index.html template
const indexHtml = await Bun.file(join(import.meta.dir, 'public/index.html')).text();

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // Serve static files from src directory
    if (url.pathname.startsWith('/src/')) {
      const filePath = join(import.meta.dir, url.pathname);
      const file = Bun.file(filePath);
      const exists = await file.exists();
      
      if (exists) {
        return new Response(file);
      }
    }

    // For all other routes, serve the React app
    return new Response(indexHtml, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
});

console.log(`Listening on port ${PORT}`);
