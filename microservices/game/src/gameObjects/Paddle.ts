import * as Vec2D from "vector2d";
import { clamp } from "../utils.js";
import { Collidable, createRectangle } from "./Collidable.js";

export class Paddle {

    // Const member

    public get length() {
        return 2;
    };

    public get width() {
        return 0.5;
    };

    public get speed() {
        return 0.15; // this is speed per move() call
    };

    // Constructor

    private readonly _hitbox: Collidable;
    constructor(
        _playerID: number,
        _pos: Vec2D.Vector
    ) {
        this._hitbox = createRectangle(_pos, new Vec2D.Vector(this.width, this.length), `paddle.${_playerID}`);
    }
    private _state = [false, false];

    // Accessors

    public get hitbox() {
        return this._hitbox;
    }

    public get pos() {
        return this._hitbox.pos;
    }

    public set pos(newPos: Vec2D.AbstractVector) {
        this._hitbox.pos = newPos;
    }

    public get shouldMove(): boolean {
        return (this._state[0] || this._state[1]);
    }

    public set shouldMove(shouldMove: boolean[]) {
        this._state = shouldMove;
    }

    public get dir(): Vec2D.AbstractVector {
        let newDir = new Vec2D.Vector(0, 0);
        if (this._state[0])
            newDir.y -= this.speed;
        if (this._state[1])
            newDir.y += this.speed;
        return newDir;
    }

    getState() {
        return this._state;
    }

    // Methods
    move() {
        let dY = this._hitbox.pos.y;
        this._hitbox.pos.y = clamp(this._hitbox.pos.y + this.dir.y, -5 + this.length / 2, 5 - this.length / 2);
        dY = this._hitbox.pos.y - dY;
        this._hitbox.getPoints().forEach((point) => { point.y += dY });
    }
}

