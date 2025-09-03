import { Game } from './game.js'
import { Paddle } from "./gameObjects/Paddle.js";
import * as Vec2D from "vector2d";

export class GameManager {

    // Attributes

    private _games = new Map<string, [Game, [number | null, number | null]]>();
    private _userSockets = new Map<number, string>();
    private static instance: GameManager | null = null;
    x

    static getInstance() {
        if (!this.instance)
            this.instance = new GameManager();
        return this.instance
    }

    registerSocket(userId: number, socketId: string) {
        this._userSockets.set(userId, socketId);
    }

    unregisterSocket(userId: number) {
        this._userSockets.delete(userId);
    }

    getSocketId(userId: number): string | null {
        return this._userSockets.get(userId) || null;
    }

    findGame(info: string): Game | null {
        const entry = this._games.get(info);
        if (entry)
            return entry[0];
        for (const [_, [game, [p1, p2]]] of this._games) {
            if (p1?.toString() === info || p2?.toString() === info)
                return game;
        }
        return null;
    }

    createLobby(lobbyName: string, gameID: number): number {
        if (this._games.has(lobbyName))
            return 1;
        this._games.set(lobbyName, [new Game(gameID), [null, null]]);
        return 0;
    }

    joinLobby(lobbyName: string, playerID: number): number {
        if (!this._games.has(lobbyName))
            return 1;
        this._games.forEach(([_, [p1, p2]]) => {
            if (p1 === playerID || p2 === playerID) {
                return 4;
            }
        });
        const [game, [p1, p2]] = this._games.get(lobbyName)!;
        if (p1 === playerID || p2 === playerID)
            return 2;
        if (p1 === null)
            this._games.set(lobbyName, [game.joinTeam(new Paddle(playerID, new Vec2D.Vector(-9, 0)), "left"), [playerID, null]]);
        else if (p2 === null)
            this._games.set(lobbyName, [game.joinTeam(new Paddle(playerID, new Vec2D.Vector(9, 0)), "right"), [p1, playerID]]);
        else
            return 3;
        return 0;
    }

    startGame(lobbyName: string, gameId: string, io: any) {
        if (!this._games.has(lobbyName))
            return 1;
        const [game, [p1, p2]] = this._games.get(lobbyName)!;
        if (!p1 || !p2)
            return 2;
        game.start();
        const loop = setInterval(async () => {
            const isOffline = await this.playerIsOffline(p1, p2, io, lobbyName);
            if (isOffline) {
                clearInterval(loop);
                return;
            } else
                game.update();
            if (game.state === "ended") {
                clearInterval(loop);
                const score = this.getScore(lobbyName);
                console.log(p1, p2);
                io.to(this._userSockets.get(p1)).emit("game-end", {
                    msg: score![0] > score![1] ? "You win" : "You loose",
                    score: [score![0], score![1]]
                });
                io.to(this._userSockets.get(p2)).emit("game-end", {
                    msg: score![1] > score![0] ? "You win" : "You loose",
                    score: [score![1], score![0]]
                });
                this.deleteGame(lobbyName);
            }
            const state = this.getGameInfo(lobbyName);
            io.to(gameId).emit("game-state", state);
        }, 1000 / 60);
    }

    forfeit(lobbyName: string, playerID: number): number {
        if (!this._games.has(lobbyName))
            return 1;
        const [game, [p1, p2]] = this._games.get(lobbyName)!;
        if (playerID != p1 && playerID != p2)
            return 2
        game.state = "ended";
        if (p1 === playerID)
            game.score = [0, 11];
        else
            game.score = [11, 0];
        return 0;
    }

    stopGame(lobbyName: string): number {
        if (!this._games.has(lobbyName))
            return 1;
        // Stops the game
        const [game, [_, __]] = this._games.get(lobbyName)!;
        game.state = "ended";
        return 0;
    }

    getScore(lobbyName: string): [number, number] | null {
        if (!this._games.has(lobbyName))
            return null;
        const [game, [_, __]] = this._games.get(lobbyName)!;
        if (game.state !== "ended")
            return null;
        return game.score;
    }

    deleteGame(lobbyName: string): number {
        if (!this._games.has(lobbyName))
            return 1;
        const [game, [_, __]] = this._games.get(lobbyName)!;
        if (game.state !== "ended")
            return 2;
        this._games.delete(lobbyName);
        return 0;
    }

    getGameInfo(lobbyName: string) {
        if (!this._games.has(lobbyName))
            return null;
        const [game, [_, __]] = this._games.get(lobbyName)!;
        if (game === undefined)
            return null;
        return {
            ballPos: { x: game.ball.pos.x, y: game.ball.pos.y },
            ballDir: { x: game.ball.dir.x, y: game.ball.dir.y },
            leftPaddle: { x: game.leftTeam[0].hitbox.getPoint(0).x, y: game.leftTeam[0].hitbox.getPoint(0).y },
            rightPaddle: { x: game.rightTeam[0].hitbox.getPoint(0).x, y: game.rightTeam[0].hitbox.getPoint(0).y },
            leftScore: game.score[0],
            rightScore: game.score[1]
        };
    }

    playerIsOffline(p1: number, p2:number, io: any, lobbyName: string): Promise<boolean> {
        return new Promise(resolve => {
            let PlayerOneTime = 15;
            let PlayerTwoTime = 15;
            const game = this.findGame(lobbyName)!;

            const socketCheck = setInterval(() => {
                const socketp1 = this.getSocketId(p1);
                const socketp2 = this.getSocketId(p2);

                const p1IsOnline = p1 && io.sockets.sockets.get(socketp1);
                const p2IsOnline = p2 && io.sockets.sockets.get(socketp2);

                if (p1IsOnline && p2IsOnline){
                    PlayerOneTime = 15;
                    PlayerTwoTime = 15;
                    clearInterval(socketCheck);
                    game.state = "running";
                    resolve(false);
                }
                let isOffline = false;
                if (!p1IsOnline) {
                    PlayerOneTime--;
                    isOffline = true;
                }
                if (!p2IsOnline) {
                    PlayerTwoTime--;
                    isOffline = true;
                }
                if (isOffline)
                    game.state = "idling";
                if (!p1IsOnline && p2IsOnline){
                    if (PlayerTwoTime <= 0){
                        this.forfeit(lobbyName, p1);
                        clearInterval(socketCheck);
                        resolve(true);
                    }
                }
                if (p1IsOnline && !p2IsOnline){
                    if (PlayerTwoTime <= 0){
                        this.forfeit(lobbyName, p2);
                        clearInterval(socketCheck);
                        resolve(true);
                    }
                }
                if (!p1IsOnline && !p2IsOnline){
                    this.deleteGame(lobbyName);
                    clearInterval(socketCheck);
                    resolve(true);
                }
            }, 1000);
        });

    }
}