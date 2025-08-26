import { Server, Socket } from "socket.io";
import { verifTokenSocket } from "./index.js";
import {createRoom, getOpponentName, joinRoom, kickOpponentFromDB, findGame } from './Game2Database.js';
import { GameData } from './gameModel.js';
import { game } from './game.js';
import { Manager } from './gameManager.js';
import { playedCard } from "./gameObjects/gameBoard.js";
import db from './dbSqlite/db.js';
import { Player } from './game.js';

const manager = Manager.getInstance();

let nextGameId: number = 1;

function getUserIdFromToken(token: string): number {
  if (!token) return 0;
  try {
    const payloadBase64 = token.split('.')[1];
    const payloadJson = atob(payloadBase64);
    const payload = JSON.parse(payloadJson);
    return payload.userId || 0;
  } catch {
    return 0;
  }
}

function getUsernameFromToken(token: string): string | null {
    if (!token) return null;

    try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        return payload.username || null;
    } catch (err) {
        return null;
    }
}

export function socketManagemente(io: Server)
{
    io.use(async (socket, next) => {
        if (verifTokenSocket(socket)) {
            console.log('verif passed !');
            next();
        }
        else
        {
            console.log(`socket ${socket.id} can't connect !`);
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket: Socket) => {

        console.log(`USER connected: ${socket.id} on Shifumi socket`);

        /******************************************************************************/
        /*                                                                            */
        /*                                base  socket                                */
        /*                                                                            */
        /******************************************************************************/

        socket.on('register-socket', (userId: number) =>
        {
            socket.data.userId = getUserIdFromToken(socket.handshake.auth.token);
            socket.data.userName = getUsernameFromToken(socket.handshake.auth.token);
            socket.data.gameId = -1;
            console.log(`User ${userId} registered with Shifumi socket ${socket.id}`);

            // a metre dans une fonction pour la lisibiliter du code
            const id = db.prepare(`SELECT id FROM games2 WHERE status = 'playing' AND (player_one_id = ? OR player_two_id = ?)`).get(userId, userId) as { id : number } | undefined;
            if (!id)
                return ;
            let game = manager.getGame(id.id);
            if (game)
            {
                game.reconnect(userId, socket);
            }
        });

        socket.on('disconnect', () =>
        {
            const playerId = socket.data.userId;
            // const gameId = db.prepare(`SELECT id FROM games2 WHERE status = 'playing' AND (player_one_id = ? OR player_two_id = ?)`).get(playerid, playerid) as { id : number } | undefined;
            const gameId = socket.data.gameId;
            if (gameId)
            {
                const game = manager.getGame(gameId);
                if (game)
                    game.disconnect(playerId);
                // ajouter un emit pour prevenir le joueur restant qu'il a perdu sont opponent s'il etais dans une game pas lancer
            }
            socket.data.gameId = -1;
            console.log(`Socket Shifumi disconnected: ${socket.id}`);
            // suprimer la game en cours si status = waiting et qu'il ny a pas de second joueurs
        });

        /******************************************************************************/
        /*                                                                            */
        /*                              room  management                              */
        /*                                                                            */
        /******************************************************************************/

        socket.on('join-room', (userId : number) =>
        {
            if (!verifTokenSocket(socket))
                return io.to(socket.id).emit('error', 'error : your token isn\'t valid !');
            if (!userId)
                return io.to(socket.id).emit('error', 'error : your user id isn\'t valid !');

            const gameId = findGame();
            console.log(`gameId = ${gameId}`)
            if (!gameId || gameId > nextGameId)
                return io.to(socket.id).emit('error', 'error : a game cannot be found !');

            let name = socket.data.userName;

            if (joinRoom(userId.toString(), name, gameId.toString())) {
                socket.data.gameId = gameId;
                socket.join(`${gameId.toString()}.2`);
                io.to(socket.id).emit('roomJoined', gameId);
                io.to(`${gameId.toString()}.1`).emit('opponent-found', 1, name);
                io.to(`${gameId.toString()}.2`).emit('opponent-found', 2, getOpponentName(gameId, userId));
            }
        });
    
        socket.on('create-room', (userId: number) =>
        {
            if (!verifTokenSocket(socket))
                return io.to(socket.id).emit('error', 'your token is not valid !');

            if (!userId)
                return io.to(socket.id).emit('error', 'error : your user id isn\'t valid !');

            const roomId: number = nextGameId++;
            if (createRoom(userId, socket.data.userName, `game-${roomId.toString()}`))
                socket.join(`${roomId.toString()}.1`);

            socket.data.gameId = roomId;
            io.to(socket.id).emit('roomJoined', roomId);
        });

        socket.on('kick-opponent', async () =>
        {
            let opponentId = kickOpponentFromDB(socket.data.gameId);
            const sockets = await io.in(`${socket.data.gameId}.2`).fetchSockets();
            const target = sockets.find(s => s.data.userId === opponentId);
            if (target) {
                target.leave(`${socket.data.gameId}.2`);
                io.to(target.id).emit('kick');
                io.to(`${socket.data.gameId}.1`).emit('opponent-leave', 'kick');
                target.data.gameId = -1;
            }
        });
        // ajouter quit room

        /******************************************************************************/
        /*                                                                            */
        /*                                game  status                                */
        /*                                                                            */
        /******************************************************************************/

        socket.on('start-game', (playerId: number) =>
        {
            const playerTwo = db.prepare(`SELECT player_two_id FROM games2 WHERE player_one_id = ? AND status = 'waiting'`).get(playerId) as { player_two_id: number };
            const id = db.prepare(`SELECT id FROM games2 WHERE player_one_id = ? AND status = 'waiting'`).get(playerId) as { id : number };
            db.prepare(`UPDATE games2 SET status = ? WHERE player_one_id = ? AND status = 'waiting'`).run('playing', playerId);

            if (playerTwo) {
                manager.newGame({
                    Id: playerId,
                    Point : 0,
                    Card : null,
                    IsOnline : true
                }, {
                    Id : playerTwo.player_two_id,
                    Point : 0,
                    Card : null,
                    IsOnline : true
                }, id.id);
                console.log(`in start-game, id = ${id.id}`);
                var shifumi = manager.getGame(id.id);
                if (shifumi)
                    shifumi.start();
            }
        });

        // ajouter l'abandont du joueur

        /******************************************************************************/
        /*                                                                            */
        /*                              game  management                              */
        /*                                                                            */
        /******************************************************************************/

        socket.on('play-card', (gameId: number, play: playedCard) =>
        {
            const game = manager.getGame(gameId);
            console.log(`id player = ${play.userId}`);
            if (game)
                game.chooseCard(play);
        });

        // ajouter le lancement de la piece

    });
}