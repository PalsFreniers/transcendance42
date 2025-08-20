import { Server, Socket } from "socket.io";
import { verifTokenSocket } from "./index.js";
import { createRoom, joinRoom } from './Game2Database.js';
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

        socket.on('register-socket', (userId: number) => {
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

        socket.on('disconnect', () => {
            const playerid = getUserIdFromToken(socket.handshake.auth.token);
            const gameId = db.prepare(`SELECT id FROM games2 WHERE status = 'playing' AND (player_one_id = ? OR player_two_id = ?)`).get(playerid, playerid) as { id : number } | undefined;
            if (gameId)
            {
                const game = manager.getGame(gameId.id);
                if (game)
                    game.disconnect(playerid);
            }
            console.log(`Socket Shifumi disconnected: ${socket.id}`);
            // suprimer la game en cours si status = waiting et qu'il ny a pas de second joueurs
        });

        /******************************************************************************/
        /*                                                                            */
        /*                              room  management                              */
        /*                                                                            */
        /******************************************************************************/

        socket.on('join-room', (userId : number, roomId: number, username: string) => {
            if (!verifTokenSocket(socket))
                return io.to(socket.id).emit('error', 'error : your token isn\'t valid !');
            if (!userId)
                return io.to(socket.id).emit('error', 'error : your user id isn\'t valid !');
            if (!roomId || roomId > nextGameId)
                return io.to(socket.id).emit('error', 'error : a part cannot be found with this id !');

            if (joinRoom(userId.toString(), roomId.toString())) {
                socket.join(`${roomId.toString()}.2`);
                io.to(socket.id).emit('roomJoined', roomId);
                io.to(`${roomId.toString()}.1`).emit('opponent-found', username);
            }
        });
    
        socket.on('create-room', (userId: number) => {
        if (!verifTokenSocket(socket))
            return io.to(socket.id).emit('error', 'your token is not valid !');

        if (!userId)
            return io.to(socket.id).emit('error', 'error : your user id isn\'t valid !');

        const roomId: number = nextGameId++;
        if (createRoom(userId, `game-${roomId.toString()}`))
            socket.join(`${roomId.toString()}.1`);

        // ajouter la fonction pour cree la game avec le roomId
        io.to(socket.id).emit('roomJoined', roomId);
        });

        // ajouter quit room

        /******************************************************************************/
        /*                                                                            */
        /*                                game  status                                */
        /*                                                                            */
        /******************************************************************************/

        socket.on('start-game', (playerId: number) => {
            const playerTwo = db.prepare(`SELECT player_two_id FROM games2 WHERE player_one_id = ? AND status = 'waiting'`).get(playerId) as { player_two_id: number };
            const id = db.prepare(`SELECT id FROM games2 WHERE player_one_id = ? AND status = 'waiting'`).get(playerId) as { id : number };
            db.prepare(`UPDATE games2 SET status = ? WHERE player_one_id = ? AND status = 'waiting'`).run('playing', playerId);

            if (playerTwo) {
                manager.newGame({
                    Id: playerId,
                    Name : 'null',
                    Point : 0,
                    Card : null,
                    IsOnline : true
                }, {
                    Id : playerTwo.player_two_id,
                    Name : 'null',
                    Point : 0,
                    Card : null,
                    IsOnline : true
                }, 1);
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