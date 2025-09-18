import { GameBoard } from "./gameObjects/gameBoard.js";
import { io } from "./index.js"
import {timeStart, endGame, forfeit, saveStats, deleteGameFromDB, getPlayerName} from "./Game2Database.js";
import { playedCard } from "./gameObjects/gameBoard.js";
import { Socket } from "socket.io";
import { getUsernameFromToken } from './socketManagement.js'

export interface Player {
    Id : number;
    Point : number;
    Card : playedCard | null;
    usedCoin : boolean;
    IsOnline : boolean;
}

export async function clearRoom(room: string)
{
    const sockets = await io.in(room).fetchSockets();
    for (const socket of sockets) {
        socket.leave(room);
    }
    return ;
}

export class game
{
    private gameId: number;
    private playerOne : Player;
    private playerTwo : Player;

    /*
    * pour tout les temps, 1s = 4 donc 60 = 15s
    */

    private PlayerOneTime : number = 60;
    private PlayerTwoTime : number = 60;

    private gameTime : number = 0; // temp total de la partie
    private playTime : number = 0; // temps pour un round

    private gameBoard :GameBoard = new GameBoard();
    private delay = 1000;

    constructor(playerOneInfo :Player, playerTwoInfo :Player, gameId: number)
    {
        this.playerOne = playerOneInfo;
        console.log(`player one = ${this.playerOne.Id}`);

        this.playerTwo = playerTwoInfo;
        console.log(`player two = ${this.playerTwo.Id}`);

        this.gameId = gameId;
        console.log(`game id = ${this.gameId}`);
    }

    public async spectate(player: number, socket)
    {
        await this.sleep(this.delay / 20);
        if (player == 1)
        {
            io.to(socket.id).emit('started-game', this.gameId, this.playerTwo.Id);
            await this.sleep(this.delay / 20);
            io.to(socket.id).emit('card', this.gameBoard.getPlayerCard(1));
            io.to(socket.id).emit('score', this.playerOne.Point, this.playerTwo.Point);
            io.to(`${this.gameId}.1`).emit('roomInfo', `${socket.data.userName} spectate`)
        }
        else if (player == 2)
        {
            io.to(socket.id).emit('started-game', this.gameId, this.playerOne.Id);
            await this.sleep(this.delay / 20);
            io.to(socket.id).emit('card', this.gameBoard.getPlayerCard(2));
            io.to(socket.id).emit('score', this.playerTwo.Point, this.playerOne.Point);
            io.to(`${this.gameId}.2`).emit('roomInfo', `${socket.data.userName} spectate`)
        }
    }

    public start(token: string)
    {
        console.log('game started');
        io.to(`${this.gameId}.1`).emit('started-game', this.gameId, this.playerTwo.Id);
        io.to(`${this.gameId}.2`).emit('started-game', this.gameId ,this.playerOne.Id);
        timeStart(this.gameId);
        this.gameBoard.startGame();

        io.to(`${this.gameId}.1`).emit('card', this.gameBoard.getPlayerCard(1));
        io.to(`${this.gameId}.2`).emit('card', this.gameBoard.getPlayerCard(2));

        const loop = async () => {
        
            if (!this.playerOne.IsOnline || !this.playerTwo.IsOnline) {
                if (await this.playerIsOffline()) {
                    saveStats(this.gameId, token);
                    return deleteGameFromDB(this.gameId);
                }
            }

            if (this.playTime == 120)
            {
                io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('end-time');
            }

            if (this.playerOne.Card && this.playerTwo.Card) { // faire une fonction/plusieurs a mettre a cote
                
                console.log('start check cards !');
                io.to(`${this.gameId}.1`).emit('opponent-played-card', [this.playerTwo.Card.cardId, this.playerTwo.Card.cardNumber]);
                io.to(`${this.gameId}.1`).emit('played-card', [this.playerOne.Card.cardId, this.playerOne.Card.cardNumber]);

                io.to(`${this.gameId}.2`).emit('opponent-played-card', [this.playerOne.Card.cardId, this.playerOne.Card.cardNumber]);
                io.to(`${this.gameId}.2`).emit('played-card', [this.playerTwo.Card.cardId, this.playerTwo.Card.cardNumber]);

                await this.sleep(2500); // pause de 2,5s pour laisser le temps au joueurs de voir les carte jouer

                this.gameTime += 10; // ajout des 2.5s au temps de jeu
                this.playTime = 0;
                
                this.playedCards(this.playerOne.Card, this.playerTwo.Card);
                
                this.gameBoard.discardCard(this.playerOne.Card);
                this.gameBoard.discardCard(this.playerTwo.Card);
                
                this.gameBoard.drawCard(1);
                this.gameBoard.drawCard(2);
                
                io.to(`${this.gameId}.1`).emit('card', this.gameBoard.getPlayerCard(1));
                io.to(`${this.gameId}.2`).emit('card', this.gameBoard.getPlayerCard(2));
                console.log('end check cards !');
                
                this.playerOne.Card = null;
                this.playerTwo.Card = null;
            }

            if (this.playerOne.Point == 3 || this.playerTwo.Point == 3 || !this.gameBoard.getPlayerCard(1).length || !this.gameBoard.getPlayerCard(2).length) // faire une fonction a mettre a cote
            {
                this.checkWinGame();
                endGame(this.gameId, this.gameTime, this.playerOne.Point, this.playerTwo.Point);
                io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('game-ended');
                await clearRoom(`${this.gameId}.1`);
                await clearRoom(`${this.gameId}.2`);
                saveStats(this.gameId, token);
                deleteGameFromDB(this.gameId);
            }

            this.playTime++;
            this.gameTime++;
            setTimeout(loop, this.delay / 4);
        }
        return loop();
    }

    public disconnect(playerId: number, socket)
    {
        if (playerId == this.playerOne.Id)
            this.playerOne.IsOnline = false;
        else if (playerId == this.playerTwo.Id)
            this.playerTwo.IsOnline = false;
        else
            return io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('roomInfo', `${socket.data.userName} stop spectate`);

        io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('wait-opponent', getUsernameFromToken(socket.handshake.auth.token));
    }

    public async reconnect(userId: number, socket: Socket)
    {
        if (userId == this.playerOne.Id)
        {
            socket.data.player = 1;
            this.playerOne.IsOnline = true;
            socket.join(`${this.gameId}.1`);
            io.to(socket.id).emit('reconnect', this.playerOne.usedCoin);
            io.to(`${this.gameId}.2`).to(`${this.gameId}.1`).emit('opponent-reconnected', getUsernameFromToken(socket.handshake.auth.token));
            await this.sleep(this.delay / 10);
            io.to(`${this.gameId}.1`).emit('started-game', this.gameId);
            await this.sleep(this.delay / 10);
            io.to(`${this.gameId}.1`).emit('card', this.gameBoard.getPlayerCard(1));
            io.to(socket.id).emit('score', this.playerOne.Point, this.playerTwo.Point);
        }
        else if (userId == this.playerTwo.Id)
        {
            socket.data.player = 2;
            this.playerTwo.IsOnline = true;
            socket.join(`${this.gameId}.2`);
            io.to(socket.id).emit('reconnect', this.playerTwo.usedCoin);
            io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('opponent-reconnected', getUsernameFromToken(socket.handshake.auth.token));
            await this.sleep(this.delay / 10);
            io.to(`${this.gameId}.2`).emit('started-game', this.gameId);
            await this.sleep(this.delay / 10);
            io.to(`${this.gameId}.2`).emit('card', this.gameBoard.getPlayerCard(2));
            io.to(socket.id).emit('score', this.playerTwo.Point, this.playerOne.Point);
        }
    }

    public chooseCard(card: playedCard)
    {
        console.log(`player (${card.userId}) choose is card !`)
        if (card.userId == this.playerOne.Id) {
            card.userId = 1;
            this.playerOne.Card = card;
        }
        else if (card.userId == this.playerTwo.Id) {
            card.userId = 2;
            this.playerTwo.Card = card;
        }
    }

    public useCoin(player:number, card: [number, number], replaceBy: number, socket)
    {
        this.gameBoard.coinUsed(player, card, replaceBy);
        io.to(socket.id).emit('card', this.gameBoard.getPlayerCard(socket.data.player));
    }

    private whoWinRound(userIdWinner: number)
    {
        if (userIdWinner == 1) {
            this.playerOne.Point++;
            io.to(`${this.gameId}.1`).emit('winRound', this.playerOne.Point, this.playerTwo.Point);
            io.to(`${this.gameId}.2`).emit('loseRound', this.playerTwo.Point, this.playerOne.Point);
        }
        else if (userIdWinner == 2)
        {
            this.playerTwo.Point++;
            io.to(`${this.gameId}.1`).emit('loseRound', this.playerOne.Point, this.playerTwo.Point);
            io.to(`${this.gameId}.2`).emit('winRound', this.playerTwo.Point, this.playerOne.Point);
        }
    }

    private checkWinGame()
    {
        if (this.playerOne.Point == 3)
        {
            io.to(`${this.gameId}.1`).emit('win-game');
            io.to(`${this.gameId}.2`).emit('lose-game');
        }
        else if (this.playerTwo.Point == 3)
        {
            io.to(`${this.gameId}.2`).emit('win-game');
            io.to(`${this.gameId}.1`).emit('lose-game');
        }
        else
            io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('draw-game');
    }

    private playedCards(playerOneCard: playedCard, playerTwoCard: playedCard)
    {
       if (playerOneCard.cardId == playerTwoCard.cardId) {
           io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('equal');
            return ;
        }

       if (playerOneCard.cardId == 0 || playerTwoCard.cardId == 0)
       {
           io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('drawRound');
           return ;
       }
       switch (playerOneCard.cardId)
       {
            case (1): 
                if (playerTwoCard.cardId == 2) {
                    this.whoWinRound(playerTwoCard.userId);
                }
                else
                    this.whoWinRound(playerOneCard.userId);
                break ;
            case (2): 
                if (playerTwoCard.cardId == 3) {
                    this.whoWinRound(playerTwoCard.userId);
                }
                else
                    this.whoWinRound(playerOneCard.userId);
                break ;
            case (3): 
                if (playerTwoCard.cardId == 1) {
                    this.whoWinRound(playerTwoCard.userId);
                }
                else
                    this.whoWinRound(playerOneCard.userId);
                break ;
       }

    }

    private playerIsOffline(): Promise<boolean>
    {
        return new Promise(playerOffline => {
            const interval= setInterval(() => {

                if (this.playerOne.IsOnline && this.playerTwo.IsOnline)
                {
                    this.PlayerOneTime = 15;
                    this.PlayerTwoTime = 15;
                    console.log('all on line');
                    clearInterval(interval);
                    playerOffline(false);
                }

                if (!this.playerOne.IsOnline && this.PlayerOneTime > 0)
                    this.PlayerOneTime--;
                if (!this.playerTwo.IsOnline && this.PlayerTwoTime > 0)
                    this.PlayerTwoTime--;

                if (this.PlayerOneTime == 0 && this.playerTwo.IsOnline)
                {
                    io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('forfeit', getPlayerName(this.gameId)?.playerOneName);
                    forfeit(this.gameId, 1, this.playerTwo.Point, this.gameTime);
                    clearInterval(interval);
                    this.sleep(5000);
                    io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('game-ended');
                    playerOffline(true);
                }
                if (this.PlayerTwoTime == 0 && this.playerOne.IsOnline)
                {
                    forfeit(this.gameId, 2, this.playerOne.Point, this.gameTime);
                    io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('forfeit', getPlayerName(this.gameId)?.playerTwoName);
                    clearInterval(interval);
                    this.sleep(5000);
                    io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('game-ended');
                    playerOffline(true);
                }
                if (this.PlayerOneTime == 0 && this.PlayerTwoTime == 0)
                {
                    io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('forfeit', 'all player');
                    forfeit(this.gameId, 0, 0, this.gameTime);
                    clearInterval(interval);
                    this.sleep(5000);
                    io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('game-ended');
                    playerOffline(true);
                }

            }, this.delay / 4);
        });
    }

    private sleep(ms: number): Promise<void>
    {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

}