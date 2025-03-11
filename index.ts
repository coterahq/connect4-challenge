// start.ts
import { build } from "bun";
import { serve } from "bun";
import { readFileSync } from "fs";
import { join } from "path";
import { runMigrations } from "./db/migrate";
import { GameService } from "./src/backend/db/gameService";
import db from "./src/backend/db/db";

// Run migrations
await runMigrations(db);

const gameService = new GameService(db);

// 1. Build the React frontend (index.tsx -> index.js)
await build({
  entrypoints: ["src/frontend/index.tsx"],
  outdir: "dist",
  // You can add additional build options as needed
});

const html = readFileSync(join(process.cwd(), "index.html"), "utf8");

// 3. Create the Bun server to serve both API endpoints and static files
const server = serve({
  port: 3000,
  routes: {
    "/api/games/:id": async (request): Promise<Response> => {
      const game = await gameService.loadGame(
        parseInt((request.params as any).id)
      );
      return new Response(JSON.stringify({ game }), {
        headers: { "Content-Type": "application/json" },
      });
    },
    "/api/games/:id/move": async (request): Promise<Response> => {
      if (request.method === "POST") {
        try {
          const body = await request.json();

          const game = await gameService.loadGame(
            parseInt((request.params as any).id)
          );
          await game?.makeMove(body.move);
          return new Response(JSON.stringify({ game }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      return new Response("Send a POST request with a JSON body.");
    },
    "/api/games": async (request): Promise<Response> => {
      const games = await gameService.listGames();
      return new Response(JSON.stringify({ games }), {
        headers: { "Content-Type": "application/json" },
      });
    },
    "/api/games/create": async (request): Promise<Response> => {
      const game = await gameService.createGame();
      return new Response(JSON.stringify({ game }), {
        headers: { "Content-Type": "application/json" },
      });
    },
    "/index.js": async (request): Promise<Response> => {
      const js = readFileSync(join(process.cwd(), "dist/index.js"), "utf8");
      return new Response(js, {
        headers: { "Content-Type": "application/javascript" },
      });
    },
    "/": async (request): Promise<Response> => {
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    },
    "/*": async (request): Promise<Response> => {
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    },
  },
});

console.log("Server is running on http://localhost:3000");
