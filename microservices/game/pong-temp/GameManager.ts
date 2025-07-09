import {Game} from './Game.ts'
import {Paddle} from "./gameObjects/Paddle.ts";
import * as Vec2D from "vector2d";

export class GameManager {

// Attributes
    // Change the key type to string
    private _games = new Map<string, Game>();

// Accessors

    public get games() {
        return this._games;
    }

    public getGames() {
        return this._games;
    }

    // This function will now return a string key
    private createGameKey(firstPlayer: string, secondPlayer: string): string {
        // Always sort the player IDs alphabetically to ensure a consistent key
        const players = [firstPlayer, secondPlayer].sort();
        return `${players[0]}-${players[1]}`; // Use a separator like '-'
    }

    registerGame(firstPlayer: string, secondPlayer: string): boolean {
        const gameKey = this.createGameKey(firstPlayer, secondPlayer);
        // Check if game already exists
        console.log(`Registering game for players: ${gameKey}`);
        if (this._games.has(gameKey)) {
            console.log(`Game already exists for players: ${gameKey}`);
            return false;
        }
        // Checks if players are already in a game
        for (const key of this._games.keys()) {
            // Split the key back to player IDs for individual checks
            const [player1, player2] = key.split('-');
            if (player1 === firstPlayer || player1 === secondPlayer
                || player2 === firstPlayer || player2 === secondPlayer) {
                console.log(`One of the players is already in a game: ${firstPlayer}, ${secondPlayer} or ${player1}, ${player2}`);
                return false;
            }
        }
        // Add players to a game
        let leftPaddle = new Paddle(firstPlayer, new Vec2D.Vector(9, 0)); // Use original player IDs for paddles
        let rightPaddle = new Paddle(secondPlayer, new Vec2D.Vector(-9, 0)); // Use original player IDs for paddles
        this._games.set(gameKey, new Game().joinTeam(leftPaddle, "left").joinTeam(rightPaddle, "right"));
        console.log(`Game registered successfully for players: ${gameKey}`);
        return true;
    }

    stopGame(firstPlayer: string, secondPlayer: string): boolean {
        const gameKey = this.createGameKey(firstPlayer, secondPlayer);
        // Check if game exists
        if (!this._games.has(gameKey)) {
            return false;
        }
        // Stops the game
        this._games.get(gameKey)!.state = "ended";
        this._games.delete(gameKey);
        return true;
    }

    async startGame(firstPlayer: string, secondPlayer: string): Promise<number[]> {
        const gameKey = this.createGameKey(firstPlayer, secondPlayer);
        console.log(`Starting game for players: ${gameKey}`);
        // Check if game exists
        if (!this._games.has(gameKey)) {
            console.log(`Game does not exist for players: ${gameKey}`);
            return [];
        }
        const currGame = this._games.get(gameKey)!;
        currGame.start();
        while (currGame.state !== "ended") {
            await new Promise((res) => setTimeout(res, 1000));
        }
        console.log(`Game ended for players: ${gameKey}`);
        return currGame.score;
    }

    receiveInput(playerID: string, info: [boolean, boolean]): boolean {
        // Iterate through the keys to find the game where the player is involved
        for (const key of this._games.keys()) {
            const [player1, player2] = key.split('-');
            if (player1 === playerID || player2 === playerID) {
                return this._games.get(key)!.handleClientInput(playerID, info);
            }
        }
        return false;
    }

    // This function needs to be adapted as well to find the game
    getGameInfo(firstPlayer: string, secondPlayer: string = ""): Game | undefined {
        // If a second player is provided, create the specific game key
        if (secondPlayer.length) {
            const gameKey = this.createGameKey(firstPlayer, secondPlayer);
            return this._games.get(gameKey);
        }

        // If only one player is provided, iterate to find any game they are in
        for (const key of this._games.keys()) {
            const [player1, player2] = key.split('-');
            if (player1 === firstPlayer || player2 === firstPlayer) {
                return this._games.get(key);
            }
        }
        return undefined;
    }

}