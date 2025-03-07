import { runMigrations } from './db/migrate';
import { join } from 'path';
import { type BunFile } from 'bun';

const PORT = 3000;

// Run migrations before starting the server
await runMigrations();

// Load index.html template
const indexHtml = await Bun.file(join(import.meta.dir, 'public/index.html')).text();

// Create a build cache for transformed files
const buildCache = new Map<string, { code: string, timestamp: number }>();

async function transformFile(file: BunFile, filePath: string) {
  const stats = await file.stat();
  const cached = buildCache.get(filePath);

  // Return cached version if file hasn't changed
  if (cached && cached.timestamp === stats.mtimeMs) {
    return cached.code;
  }

  try {
    // Build the file
    const build = await Bun.build({
      entrypoints: [filePath],
      target: 'browser',
      splitting: false,
      format: 'esm',
      external: ['react', 'react-dom', 'react-router-dom'],
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'global': 'window'
      }
    });

    if (!build.success) {
      console.error('Build failed:', build.logs);
      throw new Error(`Build failed: ${build.logs}`);
    }

    const output = await build.outputs[0]?.text();
    if (!output) {
      throw new Error('No output from build');
    }

    // Cache the result
    buildCache.set(filePath, {
      code: output,
      timestamp: stats.mtimeMs
    });

    return output;
  } catch (error) {
    console.error('Transform error for file:', filePath);
    console.error(error);
    throw error;
  }
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    console.log('Request:', url.pathname);

    // Serve static files from src directory
    if (url.pathname.startsWith('/src/')) {
      const filePath = join(import.meta.dir, url.pathname);
      console.log('Serving file:', filePath);
      
      const file = Bun.file(filePath);
      const exists = await file.exists();
      
      if (exists) {
        const headers = new Headers();
        
        // Transform TypeScript and JSX files
        if (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts')) {
          headers.set('Content-Type', 'application/javascript');
          try {
            console.log('Transforming file:', filePath);
            const code = await transformFile(file, filePath);
            console.log('Transform successful');
            return new Response(code, { headers });
          } catch (error) {
            console.error('Transform error:', error);
            return new Response(`Build failed: ${error.message}`, { 
              status: 500,
              headers: { 'Content-Type': 'text/plain' }
            });
          }
        }

        // Set appropriate content type for other files
        if (url.pathname.endsWith('.js')) {
          headers.set('Content-Type', 'application/javascript');
        } else if (url.pathname.endsWith('.css')) {
          headers.set('Content-Type', 'text/css');
        }

        return new Response(file, { headers });
      }

      console.log('File not found:', filePath);
      return new Response('File not found', { status: 404 });
    }

    // For all other routes, serve the React app
    return new Response(indexHtml, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
});

console.log(`Listening on port ${PORT}`);
