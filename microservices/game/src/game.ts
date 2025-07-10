import * as Vec2D from 'vector2d';
import { Collidable, createRectangle } from './gameObjects/Collidable.js';
import { Ball } from './gameObjects/Ball.js';
import { Paddle } from './gameObjects/Paddle.js';

export class Game {
  map: Collidable[];
  ball: Ball;
  leftTeam: Paddle[] = [];
  rightTeam: Paddle[] = [];
  allTeams: Paddle[] = [];
  score: number[] = [0, 0];
  state: 'notStarted' | 'starting' | 'running' | 'idling' | 'ended' = 'notStarted';
  tickRate = 1000 / 60;

  constructor() {
    this.map = [
      createRectangle(new Vec2D.Vector(-10, -5), new Vec2D.Vector(20, -10), 'mapUp'),
      createRectangle(new Vec2D.Vector(10, -5), new Vec2D.Vector(20, 10), 'mapLeft'),
      createRectangle(new Vec2D.Vector(10, 5), new Vec2D.Vector(-20, 10), 'mapDown'),
      createRectangle(new Vec2D.Vector(-10, 5), new Vec2D.Vector(-20, -10), 'mapRight'),
    ];
    this.ball = new Ball();
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
