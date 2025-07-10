import * as Vec2D from 'vector2d';
import { clamp } from '../utils.js';
import { createRectangle, Collidable } from './Collidable.js';

export class Paddle {
  readonly width = 0.5;
  readonly length = 2;
  readonly speed = 0.1;
  readonly hitbox: Collidable;
  private state: Record<'ArrowLeft' | 'ArrowRight', boolean> = { ArrowLeft: false, ArrowRight: false };

  constructor(public playerID: string) {
    this.hitbox = createRectangle(new Vec2D.Vector(0,0), new Vec2D.Vector(this.width, this.length), `paddle.${playerID}`);
  }

  updateMovement(key: string, action: 'keydown' | 'keyup') {
    if (key in this.state) this.state[key as any] = action === 'keydown';
  }

  move() {
    const delta = (this.state.ArrowRight ? this.speed : 0) - (this.state.ArrowLeft ? this.speed : 0);
    this.hitbox.pos.y = clamp(this.hitbox.pos.y + delta, -5, 5);
  }
}
