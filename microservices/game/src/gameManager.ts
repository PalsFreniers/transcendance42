import { Game } from './game.js'
import { Paddle } from "./gameObjects/Paddle.js";
import { TournamentManager } from "./tournamentManager.js"
import db from "./dbSqlite/db.js"
import * as Vec2D from "vector2d";
import { Server } from "socket.io";
import { saveStats } from './gameRoutes.js';
import { GameRecord } from './gameModel.js';

export class GameManager {

    // Attributes

    private _games = new Map<string, [Game, [number | null, number | null]]>();
    private _userSockets = new Map<number, string>();
    private static instance: GameManager | null = null;

    static getInstance() {
        if (!this.instance)
            this.instance = new GameManager();
        return this.instance
    }

    // Other Stuff
    registerSocket(userId: number, socketId: string) {
        this._userSockets.set(userId, socketId);
    }

    unregisterSocket(userId: number) {
        this._userSockets.delete(userId);
    }

    getSocketId(userId: number): string | null {
        return this._userSockets.get(userId) || null;
    }

    getUsernameFromSocket(socketId: string, io: Server): string | null {
        if (!socketId)
            return null;
        const socket = io.sockets.sockets.get(socketId);
        return socket?.data?.userName ?? null;
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
            return 3; // lobby already exists and game isn't ended
        this._games.set(lobbyName, [new Game(gameID), [null, null]]);
        const [game, _] = this._games.get(lobbyName)!;
        game.setName(lobbyName);
        return 0;
    }

    joinLobby(lobbyName: string, playerID: number): number {
        if (!this._games.has(lobbyName))
            return 1; // lobby doesnt exist
        if (playerID !== -1 && playerID !== -2) { // IF player joining isn't the AI nor a local player
            if (lobbyName.startsWith("tournament") && !TournamentManager.getInstance().isPlayerRegistered(playerID))
                return 5; // player cannot participate in tournament if not registered
            if (!lobbyName.startsWith("tournament") && TournamentManager.getInstance().isPlayerRegistered(playerID))
                return 6; // player cannot participate in a non tournament game if registered
            if (this.isPlayerInGame(playerID))
                return 4; // player already in a game
        }
        const [game, [p1, p2]] = this._games.get(lobbyName)!;
        if (p1 === playerID || p2 === playerID)
            return 2; // player is already in the lobby
        if (p1 === null)
            this._games.set(lobbyName, [game.joinTeam(new Paddle(playerID, new Vec2D.Vector(-9, 0)), "left"), [playerID, null]]);
        else if (p2 === null)
            this._games.set(lobbyName, [game.joinTeam(new Paddle(playerID, new Vec2D.Vector(9, 0)), "right"), [p1, playerID]]);
        else
            return 3; // lobby is full
        return 0; // worked just fine
    }

    startGame(lobbyName: string, gameId: string, io: any, token: string) {
        if (!this._games.has(lobbyName))
            return 1; // lobby doesn't exist
        const [game, [p1, p2]] = this._games.get(lobbyName)!;
        if (!p1 || !p2)
            return 2; // lobby isn't full
        game.start();
        const loop = setInterval(() => {
            this.playerIsOffline(p1, p2, io, lobbyName, token).then(isOffline => {
                if (isOffline) {
                    clearInterval(loop);
                    return 0;
                }
            });
            if (game.state === "ended") {
                clearInterval(loop);
                game.emit("game-end", {
                    game: game,
                    players: [this.getSocketId(p1), this.getSocketId(p2)]
                });
                this.deleteGame(lobbyName, token);
                return;
            }
            game.update();
            game.emit("game-state", this.getGameInfo(lobbyName, io));
        }, 1000 / 60);
        return 0;
    }

    forfeit(lobbyName: string, playerID: number): number {
        if (!this._games.has(lobbyName))
            return 1; // lobby doesnt exists
        const [game, [p1, p2]] = this._games.get(lobbyName)!;
        if (playerID != p1 && playerID != p2)
            return 2 // player isn't in the game
        game.state = "ended";
        if (p1 === playerID)
            game.score = [0, 11];
        else
            game.score = [11, 0];
        return 0;
    }

    getScore(lobbyName: string): [number, number] | null {
        if (!this._games.has(lobbyName))
            return null; // lobby doesnt exists
        const [game, _] = this._games.get(lobbyName)!;
        if (game.state !== "ended")
            return null;
        return game.score;
    }

    deleteGame(lobbyName: string, token: string): number {
        if (!this._games.has(lobbyName))
            return 1; // lobby doesnt exist
        const [game, [p1, p2]] = this._games.get(lobbyName)!;
        if (game.state !== "ended")
            return 2;
        const date = db.prepare(`SELECT * FROM games WHERE id = ? `).get(game.gameID) as GameRecord;
        const start = date.startTime ? new Date(date.startTime).getTime() : null;
        const end = date.endTime ? new Date(date.endTime).getTime() : Date.now();

        const game_time = start ? Math.round((end - start) / 1000) : 0;
        const stats = {
            game_name: 'pong',
            part_name: lobbyName,
            part_id: game.gameID,
            player_one_id: p1,
            player_two_id: p2,
            final_score: game.score.toString(),
            round_number: game.score[0] + game.score[1],
            game_time,
            mmr_gain_player_one: null,
            mmr_gain_player_two: null,
            date: date.gameDate
        };
        saveStats(game, stats, token);
        db.prepare(`DELETE FROM games WHERE id = ?`).run(game.gameID);
        this._games.delete(lobbyName);
        return 0;
    }

    leaveGame(lobbyName: string, playerId: number, token: string) {
        console.log(playerId);
        if (!this._games.has(lobbyName))
            return 1; // lobby doesnt exist
        for (const [_, [game, [p1, p2]]] of this._games) {
            if (playerId === p1) {
                this._games.set(lobbyName, [game, [p2, null]]);
                if (!p2 || p2 === -2 || p2 === -1) {
                    this.findGame(lobbyName)!.state = "ended";
                    this.deleteGame(lobbyName, token);
                    return 0;
                }
                db.prepare(`UPDATE games SET player_one_id = player_two_id, player_two_id = NULL WHERE id = ?`).run(game.gameID);
                game.leaveTeam(playerId);
                return 0;
            } else if (playerId === p2) {
                if (!p1) {
                    this.findGame(lobbyName)!.state = "ended";
                    this.deleteGame(lobbyName, token);
                    return 0;
                }
                this._games.set(lobbyName, [game, [p1, null]])
                db.prepare(`UPDATE games SET player_two_id = NULL WHERE id = ?`).run(game.gameID);
                game.leaveTeam(playerId);
                return 0;
            }
        }
    }

    getGameInfo(lobbyName: string, io: Server) {
        if (!this._games.has(lobbyName))
            return null; // lobby doesnt exists
        const [game, [p1, p2]] = this._games.get(lobbyName)!;
        if (game === undefined)
            return null;
        const usernameLeftTeam = this.getUsernameFromSocket(this.getSocketId(p1!)!, io);
        let usernameRightTeam = this.getUsernameFromSocket(this.getSocketId(p2!)!, io);
        if (p2 === -2)
            usernameRightTeam = 'ia';
        else if (p2 === -1)
            usernameRightTeam = game.localPlayer;
        return {
            ballPos: { x: game.ball.pos.x, y: game.ball.pos.y },
            ballDir: { x: game.ball.dir.x, y: game.ball.dir.y },
            ballSpd: game.ball.speed,
            leftPaddle: (game.leftTeam.length !== 0
                ? { x: game.leftTeam[0].hitbox.getPoint(0).x, y: game.leftTeam[0].hitbox.getPoint(0).y }
                : null),
            rightPaddle: (game.rightTeam.length !== 0
                ? { x: game.rightTeam[0].hitbox.getPoint(0).x, y: game.rightTeam[0].hitbox.getPoint(0).y }
                : null),
            leftScore: game.score[0],
            rightScore: game.score[1],
            state: game.state,
            resumeTimer: game.resumeTimer,
            usernameRightTeam: usernameRightTeam,
            usernameLeftTeam: usernameLeftTeam,
            playerOneID: p1,
            playerTwoID: p2,
            name: game.name,
        };
    }

    playerIsOffline(p1: number, p2: number, io: any, lobbyName: string, token: string): Promise<boolean> {
        return new Promise(resolve => {
            let PlayerOneTime = 15;
            let PlayerTwoTime = 15;
            const game = this.findGame(lobbyName)!;

            const socketCheck = setInterval(() => {
                const socketp1 = this.getSocketId(p1);
                const socketp2 = this.getSocketId(p2);

                const p1IsOnline = p1 && io.sockets.sockets.get(socketp1);
                const p2IsOnline = (p2 && io.sockets.sockets.get(socketp2) || socketp2 === "-2" || p2 == -1);

                if (p1IsOnline && p2IsOnline) {
                    PlayerOneTime = 15;
                    PlayerTwoTime = 15;
                    if (game.state === 'idling')
                        game.state = 'resume';
                    resolve(false);
                    return;
                }
                game.state = "idling";
                if (!p1IsOnline)
                    PlayerOneTime--;
                if (!p2IsOnline)
                    PlayerTwoTime--;
                if (!p1IsOnline && p2IsOnline) {
                    if (PlayerTwoTime <= 0) {
                        this.forfeit(lobbyName, p1);
                        clearInterval(socketCheck);
                        resolve(true);
                        return;
                    }
                }
                if (p1IsOnline && !p2IsOnline) {
                    if (PlayerTwoTime <= 0) {
                        this.forfeit(lobbyName, p2);
                        clearInterval(socketCheck);
                        resolve(true);
                        return;
                    }
                }
                if (!p1IsOnline && !p2IsOnline) {
                    this.deleteGame(lobbyName, token);
                    clearInterval(socketCheck);
                    resolve(true);
                }
            }, 1000);
        });

    }

    isPlayerInGame(playerID: number): boolean {
        for (const [_, [__, [p1, p2]]] of this._games) {
            if (p1 === playerID || p2 === playerID) {
                return true; // player already in another game
            }
        }
        return false;
    }
}
