import * as Vec2D from "vector2d";
import { Collidable } from "./Collidable.js";
import { Paddle } from "./Paddle.js";
import { clamp } from "../utils.js";

export class Ball {

    // Const member

    public get size() {
        return 0.15;
    };

    public get acceleration() {
        return 1 / 100
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
    ) { }

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
        console.log(console.log(this.speed));
    }

    public paddleReflect(paddle: Paddle) {
        const relativeY = (this.pos.y - (paddle.pos.y + paddle.length / 2)) / (paddle.length / 2);
        const dY = clamp(relativeY, -1, 1);

        const maxAngle = 75 * Math.PI / 180;
        const angle = dY * maxAngle;

        if (paddle.pos.x < 0)
            this.dir = new Vec2D.Vector(Math.cos(angle), Math.sin(angle)).unit();
        else 
            this.dir = new Vec2D.Vector(-Math.cos(angle), Math.sin(angle)).unit();
        this.advance();
    }


    public ballTouchPaddle(ballPos: Vec2D.AbstractVector, r: number, rectPos: Vec2D.AbstractVector, rectW: number, rectH: number): boolean {
        const halfW = rectW / 2;
        const halfH = rectH / 2;

        const closestX = clamp(ballPos.x, rectPos.x - halfW, rectPos.x + halfW);
        const closestY = clamp(ballPos.y, rectPos.y - halfH, rectPos.y + halfH);

        const dx = ballPos.x - closestX;
        const dy = ballPos.y - closestY;

        return (dx * dx + dy * dy) <= (r * r);
    }

    public collide(walls: Collidable[], paddles: Paddle[]): Collidable | null {
        for (const wall of walls) {
            switch (wall.name) {
                case ("mapRight"): if (this.pos.x + this.size > 10) return wall; else break;
                case ("mapLeft"): if (this.pos.x - this.size < -10) return wall; else break;
                case ("mapUp"): if (this.pos.y + this.size > 5) return wall; else break;
                case ("mapDown"): if (this.pos.y - this.size < -5) return wall; else break;
                default: break;
            }
        }
        for (const paddle of paddles) {
            if (this.ballTouchPaddle(this.pos, this.size, paddle.pos, paddle.width, paddle.length))
                return paddle.hitbox;
        }
        return null;
    }
}