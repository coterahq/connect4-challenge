import { Connect4 } from '../game';
import { loadTemplate } from '../utils/template';
import { join } from 'path';

export async function handleGamesList(): Promise<Response> {
  // Get all games
  const games = await Connect4.listGames();

  // Load template
  const template = await loadTemplate(join(import.meta.dir, '../templates/games-list.html'));

  // Generate HTML for each game
  const gamesHtml = games.length > 0 
    ? games.map(game => `
        <div class="game-card">
          <div class="game-info">
            <div class="game-id">Game #${game.id}</div>
            <div class="game-meta">
              Created: ${new Date(game.created_at).toLocaleString()}
              ${game.updated_at ? `<br>Last Move: ${new Date(game.updated_at).toLocaleString()}` : ''}
            </div>
          </div>
          <div class="moves-count">${game.moves_count} moves</div>
        </div>
      `).join('\n')
    : '<div class="empty-state">No games found. Start a new game!</div>';

  // Replace placeholder in template
  const html = template.replace('<!-- GAMES_LIST_PLACEHOLDER -->', gamesHtml);
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
} 