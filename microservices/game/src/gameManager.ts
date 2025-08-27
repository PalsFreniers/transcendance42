import {Game} from './game.js'
import {Paddle} from "./gameObjects/Paddle.js";
import * as Vec2D from "vector2d";

export class GameManager {

// Attributes

    private _games = new Map<string, [Game, [number | null, number | null]]>();
    private _userSockets = new Map<number, string>();
    private static instance: GameManager | null = null;
x

    static getInstance(){
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

    findGame(lobbyName: string): Game | null {
        const entry = this._games.get(lobbyName);
        return entry ? entry[0] : null;
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
    

    startGame(lobbyName: string, gameId: string, io: any): number {
        if (!this._games.has(lobbyName))
            return 1;
    
        const [game, [p1, p2]] = this._games.get(lobbyName)!;
        if (!p1 || !p2)
            return 2;
    
        game.start();
    
        // boucle principale (30 FPS)
        const loop = setInterval(() => {
            game.update();
    
            /*if (game.state === "ended") {
                clearInterval(loop);
                io.to(lobbyName).emit("game-ended", {
                    winner: game.getWinner()
                });
                return;
            }*/
    
            const state = this.getGameInfo(lobbyName);
            io.to(gameId).emit("game-state", state);
        }, 1000 / 30);
        return 0;
    }
    

    forfeit(lobbyName: string, playerID: number): number {
        // Check if game exists
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
        // Check if game exists
        if (!this._games.has(lobbyName))
            return 1;
        // Stops the game
        const [game, [_, __]] = this._games.get(lobbyName)!;
        game.state = "ended";
        return 0;
    }

    getScore(lobbyName: string) : [number, number] | null {
        // Check if game exists
        if (!this._games.has(lobbyName))
            return null;
        const [game, [_, __]] = this._games.get(lobbyName)!;
        if (game.state !== "ended")
            return null;
        return game.score;
    }

    deleteGame(lobbyName: string): number {
        // Check if game exists
        if (!this._games.has(lobbyName))
            return 1;
        const [game, [_, __]] = this._games.get(lobbyName)!;
        if (game.state !== "ended")
            return 2;
        this._games.delete(lobbyName);
        return 0;
    }

    getGameInfo(lobbyName: string) {
        const [game, [_, __]] = this._games.get(lobbyName)!;
        if (game === undefined)
            return null;
        return {
            ballPos: { x: game.ball.pos.x, y: game.ball.pos.y },
            ballDir: { x: game.ball.dir.x, y: game.ball.dir.y },
            leftPaddle: { x: game.leftTeam[0].pos.x, y: game.leftTeam[0].pos.y },
            rightPaddle: { x: game.rightTeam[0].pos.x, y: game.rightTeam[0].pos.y },
            leftScore: game.score[0],
            rightScore: game.score[1]
        };
    }
}