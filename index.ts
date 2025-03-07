import homepage from './src/index.html';

const PORT = 3000;

Bun.serve({
  port: PORT,
  routes: {
    '/': homepage,
    "/health": new Response("OK"),
  },
});

console.log(`Listening on port ${PORT}`)
