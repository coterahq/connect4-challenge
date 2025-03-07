import { describe, expect, test, beforeEach } from "bun:test";
import { Connect4 } from "../game";
import { handleGamesList } from "./games";
import { loadTemplate } from "../utils/template";
import { join } from "path";
import db from "../../db/config";

describe("Route Handlers", () => {
  // Clean up the database before each test
  beforeEach(() => {
    db.prepare('DELETE FROM moves').run();
    db.prepare('DELETE FROM games').run();
  });

  describe("Index Route", () => {
    test("should render homepage with navigation links", async () => {
      // Load the homepage template
      const html = await loadTemplate(join(import.meta.dir, '../index.html'));

      // Check basic structure
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html lang=\"en\">");
      expect(html).toContain("<title>Connect 4</title>");

      // Check content
      expect(html).toContain("<h1>Connect 4</h1>");
      
      // Check navigation links
      expect(html).toContain("<a href=\"/\" class=\"nav-link\">New Game</a>");
      expect(html).toContain("<a href=\"/games\" class=\"nav-link secondary\">View All Games</a>");

      // Check styling
      expect(html).toContain("font-family");
      expect(html).toContain("background-color: #f5f5f5");
    });
  });

  describe("Games List Route", () => {
    test("should render empty state when no games exist", async () => {
      const response = await handleGamesList();
      const html = await response.text();

      // Check response headers
      expect(response.headers.get("Content-Type")).toBe("text/html");

      // Check content
      expect(html).toContain("<h1>Connect 4 Games</h1>");
      expect(html).toContain("No games found");
      expect(html).toContain("<a href=\"/\" class=\"new-game-btn\">Start New Game</a>");
    });

    test("should render games list when games exist", async () => {
      // Create some test games
      const game1 = new Connect4();
      await game1.makeMove(3); // One move
      const game1Id = await game1.save();

      const game2 = new Connect4();
      await game2.makeMove(4);
      await game2.makeMove(3); // Two moves
      const game2Id = await game2.save();

      const response = await handleGamesList();
      const html = await response.text();

      // Check basic content
      expect(html).toContain(`Game #${game2Id}`); // Most recent game first
      expect(html).toContain(`Game #${game1Id}`);
      expect(html).toContain("1 moves");
      expect(html).toContain("2 moves");

      // Check timestamps are present
      expect(html).toContain("Created:");
      expect(html).toContain("Last Move:");

      // Verify game cards structure
      expect(html).toContain("class=\"game-card\"");
      expect(html).toContain("class=\"game-info\"");
      expect(html).toContain("class=\"moves-count\"");
    });

    test("should format dates correctly", async () => {
      // Create a game
      const game = new Connect4();
      await game.makeMove(3);
      await game.save();

      const response = await handleGamesList();
      const html = await response.text();

      // Check that dates are formatted as strings
      const today = new Date().toLocaleDateString();
      expect(html).toContain(today);
    });
  });
}); 