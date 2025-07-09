import * as Vec2D from "vector2d"
import {Ball} from "./gameObjects/Ball"
import {Collidable, createRectangle} from "./gameObjects/Collidable"
import {Paddle} from "./gameObjects/Paddle"

export class Game {

// Constructor

    constructor(
        private _map: Collidable[] = [
            createRectangle(new Vec2D.Vector(-10, -5), new Vec2D.Vector(20, -10), "mapUp"),
            createRectangle(new Vec2D.Vector(10, -5), new Vec2D.Vector(20, 10), "mapLeft"),
            createRectangle(new Vec2D.Vector(10, 5), new Vec2D.Vector(-20, 10), "mapDown"),
            createRectangle(new Vec2D.Vector(-10, 5), new Vec2D.Vector(-20, -10), "mapRight"),
        ],
        private _ball: Ball = new Ball(),
    ) {}
    private _leftTeam: Paddle[] = [];
    private _rightTeam: Paddle[] = [];
    private _allTeams: Paddle[] = [];
    private _score: number[] = [0, 0];
    private _tickRate = 1000 / 60; // 60 FPS
    private _state: string = "notStarted";

// Accessors

    public get ball() {
        return this._ball;
    }

    public get leftTeam() {
        return this._leftTeam;
    }

    public get rightTeam() {
        return this._rightTeam;
    }

    public get score() {
        return this._score;
    }

    public get state() {
        return this._state;
    }

    public set state(newState: string) {
        this._state = newState;
    }

    getPaddle(playerID: number) {
        const paddleName = "paddle." + playerID;
        for (const paddle of this._allTeams)
            if (paddle.hitbox.name === paddleName) return paddle;
    }

// Methods

    joinTeam(player: Paddle, team: string = "auto") {
        if (team === "left")
            this._leftTeam.push(player);
        else if (team === "right")
            this._rightTeam.push(player);
        else if (team === "auto")
            if (this._leftTeam.length > this._rightTeam.length)
                this._rightTeam.push(player);
            else
                this._leftTeam.push(player);
        else
            throw new Error(`joinTeam(): invalid team option ${team}, expected: 'left' / 'right' / 'auto'`)
        return this;
    }

    start() {
        this._leftTeam.forEach((paddle) => {this._allTeams.push(paddle)});
        this._rightTeam.forEach((paddle) => {this._allTeams.push(paddle)});
        this._ball.pos = new Vec2D.Vector(0, 0);
        this._ball.dir = new Vec2D.Vector(1, 0);
        this._state = "starting";

        const setRunning = () => {this.state = "running"};
        setTimeout(setRunning.bind(this), 2e3);

        const loop = () => {
            const start = Date.now();

            this.update();
            if (this._state === "ended")
                return ;

            const elapsed = Date.now() - start;
            const nextTick = Math.max(0, this._tickRate - elapsed);

            setTimeout(loop, nextTick);
        };
        loop();
    }

    update() {
        this.updatePaddles();
        if (this._state == "running")
            this.updateBall();
        else if (this._state == "idling")
            this.idlingBall();
        else if (this._state == "starting")
            this.idlingBall();
    }

    handleClientInput(playerID: string, info: boolean[]) {
        const paddleName = `paddle.${playerID}`;
        for (const paddle of this._allTeams) {
            if (paddle.hitbox.name !== paddleName) continue;
            paddle.shouldMove = info;
            return true;
        }
        return false;
    }

    private updateBall() {
        const iterNum = this.ball.speed / this.ball.dV;
        for (let i = 0; i < iterNum; i++) {
            this.ball.advance();
            const ballCollision = this.ball.collide(this._map, this._allTeams);
            if (ballCollision === null) continue;
            this.ball.accelerate();
            if (ballCollision.name.startsWith("paddle.")) {
                for (const paddle of this._allTeams) {
                    if (paddle.hitbox.name !== ballCollision.name) continue;
                    this.ball.paddleReflect(paddle);
                    break;
                }
            } else if (ballCollision.name.startsWith("map")) {
                switch (ballCollision.name) {
                    case "mapRight":
                        this.onScore(0);
                        return ;
                    case "mapLeft":
                        this.onScore(1);
                        return ;
                    default:
                        this.ball.dir.y = -this.ball.dir.y;
                        this.ball.advance();
                        i++;
                }
            }
        }
    }

    private idlingBall() {
        return ;
    }

    private updatePaddles() {
        for (const paddle of this._allTeams) {
            if (paddle.shouldMove) paddle.move();
        }
    }

    private onScore(scoringTeam: number) {
        this._ball.pos = new Vec2D.Vector(0, 0);
        this._ball.speed = 0;
        ++this._score[scoringTeam];
        console.log("goal goal goal goal goal")
        if (this._score[scoringTeam] == -1) {
            this._state = "ended";
        }
        else
            this._state = "idling";
        setTimeout(() => {
            this._ball.speed = this._ball.baseSpeed;
            this._ball.dir = new Vec2D.Vector(0.5 - scoringTeam, 0);
            this._state = "running";
        }, 2.5 * 1e3);
    }
}
