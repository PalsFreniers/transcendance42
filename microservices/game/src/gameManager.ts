import { Game } from './game.js';
import { Socket } from 'socket.io';
import { Paddle } from './gameObjects/Paddle.js';
import { io } from './index.js'

export class  GameManager {
  private games = new Map<string, Game>();
  private userSockets = new Map<number, string>();
  private socketToUser = new Map<string, number>();

  private gameKey(a: string, b: string) {
    return [a, b].sort().join('-');
  }

  registerGame(p1: string, p2: string, gameId: number): boolean {
    const key = this.gameKey(p1, p2);
    if (this.games.has(key)) 
      return false;
    if ([...this.games.keys()].some(k => k.includes(p1) || k.includes(p2))) 
      return false;
    this.games.set(key,
      new Game(gameId)
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

  registerSocket(userId: number, socketId: string): boolean {
    this.userSockets.set(userId, socketId);
    this.socketToUser.set(socketId, userId);
    return true;
  }

  unregisterSocket(socketId: string): boolean {
    const userId = this.socketToUser.get(socketId);
    if (userId !== undefined) {
      this.userSockets.delete(userId);
      this.socketToUser.delete(socketId);
      console.log(`Cleaned up socket for user ${userId}`);
      return true;
    }
    return false;
  }

  getSocketId(userId: number): string | undefined {
    return this.userSockets.get(userId);
  }

  getUserId(socketId: string): number | undefined {
    return this.socketToUser.get(socketId);
  }

  getSocket(userId: number): Socket | undefined {
  const socketId = this.userSockets.get(userId);
  if (!socketId) 
    return undefined;
  return io.sockets.sockets.get(socketId);
}
}
