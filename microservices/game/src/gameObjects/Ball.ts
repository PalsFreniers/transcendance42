import * as Vec2D from 'vector2d';
import { Paddle } from './Paddle.js';

export class Ball {
  pos = new Vec2D.Vector(0, 0);
  dir = new Vec2D.Vector(1, 0);
  speed = 0.2;
  readonly size = 0.1;
  readonly acceleration = 1 / 100;
  readonly baseSpeed = 0.2;
  readonly maxSpeed = 2;
  readonly dV = 0.05;

  advance() {
    this.pos.add(this.dir.clone().unit().mulS(this.dV));
  }
  accelerate() {
    this.speed = Math.min(this.maxSpeed, this.speed * (1 + this.acceleration));
  }
  update(map, paddles: Paddle[]) {
    const iter = this.speed / this.dV;
    for (let i = 0; i < iter; i++) {
      this.advance();
      const col = this.collide(map, paddles);
      if (!col) continue;
      if (/^paddle/.test(col.name)) {
        const paddle = paddles.find(p => p.hitbox.name === col.name)!;
        this.reflect(paddle);
      } else {
        this.bounceWall(col);
      }
      this.accelerate();
    }
  }
  reflect(p: Paddle) {
    this.dir.x = -this.dir.x;
    this.advance();
  }
  bounceWall(w) {
    this.dir.y = -this.dir.y;
    this.advance();
  }
  collide(map, paddles: Paddle[]) {
    for (const w of map) {
      if (Math.abs(this.pos.x) > 10 || Math.abs(this.pos.y) > 5) return w;
    }
    for (const p of paddles) {
      if (Math.abs(this.pos.x - p.hitbox.pos.x) < p.width &&
        Math.abs(this.pos.y - p.hitbox.pos.y) < p.length)
        {
            return p.hitbox;
        }
    }
    return null;
  }
}
