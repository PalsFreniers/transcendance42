import * as Vec2D from "vector2d";
import { Game, Listener } from "./game.js";
import { GameManager } from "./gameManager.js";
import { Paddle } from "./gameObjects/Paddle.js";
import { Ball } from "./gameObjects/Ball.js";
import { Server } from "socket.io";

interface IGameInfo {
    ballPos: { x: number, y: number };
    ballDir: { x: number, y: number };
    ballSpd: number;
    leftPaddle: { x: number, y: number } | null;
    rightPaddle: { x: number, y: number } | null;
    leftScore: number;
    rightScore: number;
    state: string;
    resumeTimer: number;
    usernameRightTeam: string | null;
    usernameLeftTeam: string | null;
    playerOneID: number | null;
    playerTwoID: number | null;
}

export class GameAI {

    constructor(
        public lobby: string,
        private _server: Server
    ) {
        this._joinGame(lobby);
    }

    private _lastTime: number = Date.now();
    private _moveCycle: number = 0;
    private _lastState: IGameInfo | null = null; // isActually IGameInfo
    private _decision: "accelerate" | "attack" = "attack";
    private _speedThreat: number = (Ball.baseSpeed * Math.pow(1 + Ball.acceleration, 25));
    private _ballSpeedOnScore: number[] = [];
    private _ballAngleOnScore: number[] = [];

    private _joinGame(lobbyName: string) {
        const gameManager = GameManager.getInstance();
        const errno = gameManager.joinLobby(lobbyName, -2);
        switch (errno) {
            case 1: throw new Error(`Lobby ${lobbyName} doesn't exists`);
            case 2: throw new Error(`AI is already in lobby ${lobbyName}`);
            case 3: throw new Error(`Lobby ${lobbyName} is full`);
            default: break;
        }
        gameManager.registerSocket(-2, "-2");
        gameManager.findGame(lobbyName)!
            .on("point-start", () => { this._lastTime = 0; this._moveCycle = 0; })
            .on("paddle-reflect", () => { this._waitForInfo(); })
            .on("game-state", () => { this._moveToPos(); })
            .on("score", ({ballSpeed, ballDir, scoringTeam}) => { this._adapt(ballSpeed, ballDir, scoringTeam); });
    }

    private _waitForInfo() {
        const waitForInfo = setInterval(() => {
            if (Date.now() - this._lastTime > 1 * 1e3) {
                clearInterval(waitForInfo);
                this._lastTime = Date.now();
                this._lastState = GameManager.getInstance().getGameInfo(this.lobby, this._server)!;
                this._reactToInfo();
            }
        }, 1e3 / 30); // 30 FPS
    }

    private _reactToInfo() {
        const padLen2 = Paddle.len / 2;
        if (!this._lastState) return;
        if (this._moveCycle > 0) return;
        if (this._lastState!.ballSpd > this._speedThreat) {
            this._decision = "attack";
            console.log("Im attacking now");
        }
        let impactPosY = 0;
        if (this._lastState!.ballDir.x > 0) {
            impactPosY = this._predictImpact().y;
            if (this._decision === "accelerate")
                impactPosY += Math.random() > 0.5 ? (padLen2) : -(padLen2);
            else { // this._decision === "attack"
                const playerPaddleY = this._lastState!.leftPaddle!.y + padLen2;
                const shootAngle = 35;
                if (Math.abs(playerPaddleY) < 3)
                    impactPosY += Math.random() > 0.5 ? (0.3 * padLen2) : -(0.3 * padLen2);
                else
                    impactPosY += playerPaddleY > 0 ? (shootAngle / 75 * padLen2) : -(shootAngle / 75 * padLen2);
            }
        }
        const paddleY = this._lastState!.rightPaddle!.y + padLen2;
        const dY = impactPosY - paddleY;
        this._moveCycle = Math.abs(Math.round(dY / Paddle.speed));
        console.log(`impactPosY: ${impactPosY}`);
        console.log(`paddleY: ${paddleY}`);
        console.log(`dY: ${dY}`);
        if (dY > 0)
            GameManager.getInstance().findGame(this.lobby)!.getPaddle(-2)!.shouldMove = [false, true]; // Go up
        else if (dY < 0)
            GameManager.getInstance().findGame(this.lobby)!.getPaddle(-2)!.shouldMove = [true, false]; // Go down
    }

    private _moveToPos() {
        if (!this._lastState) return;
        this._moveCycle--;
        if (this._moveCycle <= 0)
            GameManager.getInstance().findGame(this.lobby)!.getPaddle(-2)!.shouldMove = [false, false];
    }

    private _predictImpact() {
        const ballPos = { x: this._lastState!.ballPos.x, y: this._lastState!.ballPos.y };
        const ballDir = { x: this._lastState!.ballDir.x, y: this._lastState!.ballDir.y };
        const paddleLine = this._lastState!.rightPaddle!.x;
        const game = new Game(69420);
        const predictBall = new Ball(
            new Vec2D.Vector(ballPos.x, ballPos.y),
            new Vec2D.Vector(ballDir.x, ballDir.y),
            this._lastState!.ballSpd
        );
        while (paddleLine - Ball.size * 2 > predictBall.pos.x) {
            predictBall.advance();
            const ballCollision = predictBall.collide(game.map, game.allTeams);
            if (ballCollision === null) continue;
            predictBall.accelerate();
            if (ballCollision.name.startsWith("paddle.")) {
                for (const paddle of game.allTeams) {
                    if (paddle.hitbox.name !== ballCollision.name) continue;
                    predictBall.paddleReflect(paddle);
                    break;
                }
            } else if (ballCollision.name.startsWith("map")) {
                switch (ballCollision.name) {
                    case "mapRight": break;
                    case "mapLeft":  break;
                    default: {
                        predictBall.dir.y = -predictBall.dir.y;
                        predictBall.advance();
                    }
                }
            }
        }
        return { x: predictBall.pos.x, y: predictBall.pos.y };
    }

    private _adapt(ballSpeed: number, ballDir: Vec2D.AbstractVector, scoringTeam: number) {
        // Reset AI decision
        this._decision = "accelerate";

        const speedAdaptModifier = 0.20; // must be [0..1] and not so subtle
        const angleAdaptModifier = 0.10; // must be [0..1] and subtle

        // Gather intel on the score
        if (scoringTeam == 1) {
            this._ballSpeedOnScore.push(ballSpeed);
            this._ballAngleOnScore.push(Math.abs(Math.atan2(ballDir.y, ballDir.x)));
        } else {
            this._ballSpeedOnScore.push(-ballSpeed);
        }

        // Update speed play, to play faster or slower
        let mean = 0;
        this._ballSpeedOnScore.forEach((speed) => { mean += speed; });
        mean /= this._ballSpeedOnScore.length;
        if (mean > this._speedThreat)
            this._speedThreat -= speedAdaptModifier * (mean - this._speedThreat);
        else
            this._speedThreat += speedAdaptModifier * (mean - this._speedThreat);
    }
}
