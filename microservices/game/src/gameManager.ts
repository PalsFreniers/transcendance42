import { Game } from './game.js';
import { Paddle } from './gameObjects/Paddle.js';

export class GameManager {
  private games = new Map<string, Game>();

  private gameKey(a: string, b: string) {
    return [a, b].sort().join('-');
  }

  registerGame(p1: string, p2: string): boolean {
    const key = this.gameKey(p1, p2);
    if (this.games.has(key)) return false;
    if ([...this.games.keys()].some(k =>
      k.includes(p1) || k.includes(p2)
    )) return false;

    this.games.set(key,
      new Game()
        .joinTeam(new Paddle(p1), 'left')
        .joinTeam(new Paddle(p2), 'right')
    );
    return true;
  }

  async startGame(p1: string, p2: string): Promise<number[]> {
    const key = this.gameKey(p1, p2);
    const game = this.games.get(key);
    if (!game) return [];
    game.start();
    while (game.state !== 'ended') {
      await new Promise(res => setTimeout(res, 100));
    }
    const score = game.score;
    this.games.delete(key);
    return score;
  }

  getGameInfo(playerId: string): Game | undefined {
    return [...this.games.values()]
      .find(g =>
        g.leftTeam.concat(g.rightTeam)
          .some(p => p.playerID === playerId)
      );
  }

  receiveInput(playerId: string, key: string, action: 'keydown' | 'keyup'): boolean {
    const game = this.getGameInfo(playerId);
    if (!game) return false;
    game.handleClientInput(playerId, key, action);
    return true;
  }
}
