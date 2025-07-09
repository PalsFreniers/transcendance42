import * as Vec2D from "vector2d";
import {Collidable} from "./Collidable";
import {Paddle} from "./Paddle";
import {clamp} from "../utils.ts";

export class Ball {

// Const member

    public get size() {
        return 0.1;
    };

    public get acceleration() {
        return 1/100 // this much of its own speed is added to the ball's speed
    }

    public get baseSpeed() {
        return 0.2;
    }
    public get maxSpeed() {
        return this.baseSpeed * 10;
    }

    public get dV() {
        return 0.05;
    }

// Constructor

    constructor(
        private _pos: Vec2D.AbstractVector = new Vec2D.Vector(0, 0),
        private _dir: Vec2D.AbstractVector = new Vec2D.Vector(0, 0),
        public speed: number = this.baseSpeed
    ) {}

// Accessors

    public get pos() {
        return this._pos;
    }

    public set pos(newPos: Vec2D.AbstractVector) {
        this._pos = newPos;
    }

    public get dir() {
        return this._dir;
    }

    public set dir(newDir: Vec2D.AbstractVector) {
        this._dir = newDir;
    }

// Methods

    public advance() {
        this._pos.add(this._dir.clone().unit().mulS(this.dV));
    }

    public accelerate() {
        this.speed = Math.round(this.speed * (1 + this.acceleration) * 1e8) / 1e8;
        this.speed = Math.min(this.maxSpeed, this.speed);
    }

    public paddleReflect(paddle: Paddle) {
        // this.dir.x = -this.dir.x;
        const dY = clamp(this.pos.y / paddle.midPos.y, 0, 0.5);

        let theta = 75 * (0.5 + dY) * (Math.PI / 180.0);
        if (paddle.pos.x < 0)
            theta = -theta
        this.dir = this.dir.reverse().setY(0).rotate(theta).unit();
        this.advance();
    }

    public collide(walls: Collidable[], paddles: Paddle[]): Collidable | null {
        for (const wall of walls) {
            switch (wall.name) {
                case ("mapRight"): if (this.pos.x > 10)  return wall; else break;
                case ("mapLeft"):  if (this.pos.x < -10) return wall; else break;
                case ("mapUp"):    if (this.pos.y > 5)   return wall; else break;
                case ("mapDown"):  if (this.pos.y < -5)  return wall; else break;
                default: break;
            }
        }
        for (const paddle of paddles) {
            if (paddle.pos.x + paddle.width >= this.pos.x && this.pos.x >= paddle.pos.x
                && paddle.pos.y + paddle.length >= this.pos.y && this.pos.y >= paddle.pos.y)
                return paddle.hitbox;
        }
        return null;
    }
}