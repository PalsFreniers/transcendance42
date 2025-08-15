import {Game} from './game.js'
import {Paddle} from "./gameObjects/Paddle.js";
import * as Vec2D from "vector2d";

export class GameManager {

// Attributes

    private _games = new Map<string, [Game, [string | null, string | null]]>();

// Accessors

    // This find the game based on something we know on the game: either on of the playerID or one of the lobby's name
    findGame(key: string): Game | null {
        if (key === undefined)
            return null;
        for (const [name, [game, [p1, p2]]] of this._games.entries())
            if (name === key || p1 == key || p2 == key)
                return game;
        return null;
    }

    createLobby(lobbyName: string): number {
        if (this._games.has(lobbyName))
            return 1;
        this._games.set(lobbyName, [new Game(), [null, null]]);
        return 0;
    }

    joinLobby(lobbyName: string, playerID: string): number {
        if (!this._games.has(lobbyName))
            return 1;
        if (this.findGame(playerID) != null)
            return 2;
        const [game, [p1, p2]] = this._games.get(lobbyName)!;
        if (p1 === null)
            this._games.set(lobbyName, [game.joinTeam(new Paddle(playerID, new Vec2D.Vector(-9, 0)), "left"), [playerID, null]]);
        else if (p2 === null)
            this._games.set(lobbyName, [game.joinTeam(new Paddle(playerID, new Vec2D.Vector(9, 0)), "right"), [p1, playerID]]);
        else
            return 3;
        return 0;
    }

    startGame(lobbyName: string): number {
        // Check if game exists
        if (!this._games.has(lobbyName))
            return 1;
        // Starts the game
        const [game, [p1, p2]] = this._games.get(lobbyName)!;
        if (p1 === null || p2 === null)
            return 2;
        game.start();
        return 0;
    }

    forfeit(lobbyName: string, playerID: string): number {
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