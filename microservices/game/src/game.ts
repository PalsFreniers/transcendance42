import * as Vec2D from "vector2d"
import { Ball } from "./gameObjects/Ball.js"
import { Collidable, createRectangle } from "./gameObjects/Collidable.js"
import { Paddle } from "./gameObjects/Paddle.js"
import { clamp } from "./utils.js"

export type Listener<T = any> = (data: T) => void;

export class Game {

    // Constructor
    constructor(
        private _gameID: number,
        private _map: Collidable[] = [
            createRectangle(new Vec2D.Vector(-10, -5), new Vec2D.Vector(20, -10), "mapUp"),
            createRectangle(new Vec2D.Vector(10, -5), new Vec2D.Vector(20, 10), "mapLeft"),
            createRectangle(new Vec2D.Vector(10, 5), new Vec2D.Vector(-20, 10), "mapDown"),
            createRectangle(new Vec2D.Vector(-10, 5), new Vec2D.Vector(-20, -10), "mapRight"),
        ],
        private _ball: Ball = new Ball(),
    ) { }
    private _leftTeam: Paddle[] = [];
    private _rightTeam: Paddle[] = [];
    private _allTeams: Paddle[] = [];
    private _score: [number, number] = [0, 0];
    private _state: string = "notStarted";
    private _resumeTimer: number = 3;
    private _countdown: boolean = false;
    private _events: Map<string, Listener[]> = new Map();
    private _localPlayer: string | null = null;

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

    public get allTeams() {
        return this._allTeams;
    }

    public get map() {
        return this._map;
    }

    public get score() {
        return this._score;
    }

    public set score(newScore: [number, number]) {
        this._score = newScore;
    }

    public get state() {
        return this._state;
    }

    public set state(newState: string) {
        this._state = newState;
    }

    public get gameID() {
        return this._gameID;
    }

    public get resumeTimer() {
        return this._resumeTimer;
    }

    public set resumeTimer(timer: number) {
        this._resumeTimer = timer;
    }

    public get countdown() {
        return this._countdown;
    }

    public set countdown(bool: boolean) {
        this._countdown = bool;
    }

    public get localPlayer(): string | null {
        if (this._localPlayer)
            return this._localPlayer;
        return null;
    }

    public set localPlayer(localPlayer: string) {
        this._localPlayer = localPlayer;
    }

    getPaddle(playerID: number) {
        const paddleName = "paddle." + playerID.toString();
        for (const paddle of this._allTeams)
            if (paddle.hitbox.name === paddleName) return paddle;
        return null;
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

    leaveTeam(playerID: number) {
        this._leftTeam = this._leftTeam.filter((paddle) => {
            return paddle.hitbox.name !== `paddle.${playerID}`;
        });
        this._rightTeam = this._rightTeam.filter((paddle) => {
            return paddle.hitbox.name !== `paddle.${playerID}`;
        });
    }
    
    start() {
        this._leftTeam.forEach((paddle) => { this._allTeams.push(paddle); });
        this._rightTeam.forEach((paddle) => { this._allTeams.push(paddle); });

        this._ball.pos = new Vec2D.Vector(0, 0);
        this._ball.dir = new Vec2D.Vector(1, 0);
        this._state = "starting";

        setTimeout(() => {
            this.emit("point-start");
            this._state = "running";
        }, 2000);
    }

    update() {
        if (this._state == "running") {
            this.updateBall();
            this.updatePaddles();
        }
        else if (this._state == "idling")
            this.idlingBall();
        else if (this._state == "starting")
            this.idlingBall();
        else if (this._state == "resume")
            this.incomingBall();
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
                    this.emit("paddle-reflect");
                    break;
                }
            } else if (ballCollision.name.startsWith("map")) {
                switch (ballCollision.name) {
                    case "mapRight":
                        this.onScore(0);
                        return;
                    case "mapLeft":
                        this.onScore(1);
                        return;
                    default:
                        this.ball.dir.y = -this.ball.dir.y;
                        this.ball.advance();
                        i++;
                }
            }
        }
    }

    private idlingBall() {
        return;
    }

    private updatePaddles() {
        for (const paddle of this._allTeams) {
            if (paddle.shouldMove)
                paddle.move();
        }
    }

    private incomingBall() {
        if (this._countdown) // countdown need to be launch just one time
            return;
        this._countdown = true;
        this._resumeTimer = 3;

        const countdown = setInterval(() => {
            this._resumeTimer--;
            if (this._resumeTimer <= 0) {
                clearInterval(countdown); // CLEAR INTERVAL AND SET RUNNING BECAUSE GAME RESTART
                this._state = "running";
                this._countdown = false; // RESET FALSE FOR NEXT PAUSE
                this.emit("point-start");
            }
        }, 1000);
    }

    private onScore(scoringTeam: number) {
        this.emit("score", { ballSpeed: this._ball.speed, ballDir: this._ball.dir, scoringTeam});
        this._ball.pos = new Vec2D.Vector(0, 0);
        this._ball.speed = 0;
        ++this._score[scoringTeam];
        this._allTeams.forEach(paddle => {
            let dY = paddle.hitbox.pos.y;
            paddle.hitbox.pos.y = clamp(paddle.hitbox.pos.y - paddle.hitbox.pos.y, -5 + paddle.len / 2, 5 - paddle.len / 2);
            dY = paddle.hitbox.pos.y - dY;
            paddle.hitbox.getPoints().forEach((point) => { point.y += dY });
            paddle.shouldMove = [false, false];
        })
        if (this._score[scoringTeam] == 3) {
            this._state = "ended";
            return;
        }
        this._state = "idling";
        setTimeout(() => {
            this._ball.speed = this._ball.baseSpeed;
            this._ball.dir = new Vec2D.Vector(0.5 - scoringTeam, 0);
            this._state = "running";
            this.emit("point-start");
        }, 2.5 * 1e3);
    }

    // Event Manager
    on(event: string, listener: Listener) {
        if (!this._events.has(event))
            this._events.set(event, []);
        this._events.get(event)!.push(listener);
        return this;
    }

    off(event: string, listener: Listener) {
        const listeners = this._events.get(event);
        if (!listeners)
            return;
        this._events.set(
            event,
            listeners.filter((l) => {
                return l !== listener;
            })
        );
        return this;
    }

    emit(event: string, data?: any) {
        const listeners = this._events.get(event);
        if (!listeners)
            return;
        listeners.forEach((listener) => {
            listener(data);
        });
        return this;
    }

}
