import * as Vec2D from 'vector2d';
import { Collidable, createRectangle } from './gameObjects/Collidable.js';
import { Ball } from './gameObjects/Ball.js';
import { Paddle } from './gameObjects/Paddle.js';
import { io } from './index.js'

export class Game {
  map: Collidable[];
  ball: Ball;
  leftTeam: Paddle[] = [];
  rightTeam: Paddle[] = [];
  allTeams: Paddle[] = [];
  score: number[] = [0, 0];
  state: 'notStarted' | 'starting' | 'running' | 'idling' | 'ended' = 'notStarted';
  tickRate = 1000 / 60;
  gameId: number;

  constructor(gameId: number) {
    this.map = [
      createRectangle(new Vec2D.Vector(-10, -5), new Vec2D.Vector(20, -10), 'mapUp'),
      createRectangle(new Vec2D.Vector(10, -5), new Vec2D.Vector(20, 10), 'mapLeft'),
      createRectangle(new Vec2D.Vector(10, 5), new Vec2D.Vector(-20, 10), 'mapDown'),
      createRectangle(new Vec2D.Vector(-10, 5), new Vec2D.Vector(-20, -10), 'mapRight'),
    ];
    this.ball = new Ball();
    this.gameId = gameId;
  }

  get leftTeamPlayers() { return this.leftTeam; }
  get rightTeamPlayers() { return this.rightTeam; }

  joinTeam(player: Paddle, side: 'left' | 'right' | 'auto'): this {
    if (side === 'left') this.leftTeam.push(player);
    else if (side === 'right') this.rightTeam.push(player);
    else this[(this.leftTeam.length <= this.rightTeam.length ? 'leftTeam' : 'rightTeam')].push(player);
    return this;
  }

  start() {
    this.allTeams = [...this.leftTeam, ...this.rightTeam];
    this.ball.pos = new Vec2D.Vector(0, 0);
    this.ball.dir = new Vec2D.Vector(1, 0);
    this.state = 'starting';
    setTimeout(() => this.state = 'running', 2000);

    const loop = () => {
      const start = Date.now();
      this.update();
      if (this.state === 'ended') return;
      io.to(`game-${this.gameId}`).emit('game-update', {
        ball: {
          x: this.ball.pos.x,
          y: this.ball.pos.y,
        },
        paddle: this.allTeams.map( p =>({
          id: p.playerID,
          x: p.hitbox.pos.x,
          y: p.hitbox.pos.y,
        })),
        score: this.score,
        status: this.state,
      });
      const delay = Math.max(0, this.tickRate - (Date.now() - start));
      setTimeout(loop, delay);
    };
    loop();
  }

  update() {
    this.allTeams.forEach(p => p.move());
    if (this.state === 'running') this.ball.update(this.map, this.allTeams);
  }

  handleClientInput(playerId: string, key: string, action: 'keydown' | 'keyup') {
    const paddle = this.allTeams.find(p => p.playerID === playerId);
    paddle?.updateMovement(key, action);
  }
}
