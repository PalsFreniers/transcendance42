import { GameBoard } from "./gameObjects/gameBoard.js";
import { io } from "./index.js"
import { timeStart, endGame, forfeit } from "./Game2Database.js";
import { playedCard } from "./gameObjects/gameBoard.js";
import { Socket } from "socket.io";

export interface Player {
    Id : number;
    Point : number;
    Card : playedCard | null;
    IsOnline : boolean;
}

// le start du jeu, les actions, les point( la fin et le lobby d'attente de joueur ?)

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

    private PlayerOneTime : number = 15;
    private PlayerTwoTime : number = 15;

    private gameBoard :GameBoard = new GameBoard();
    private delay = 1000;

    constructor(playerOneInfo :Player, playerTwoInfo :Player, gameId: number) {
        this.playerOne = playerOneInfo;
        console.log(`player one = ${this.playerOne.Id}`);

        this.playerTwo = playerTwoInfo;
        console.log(`player two = ${this.playerTwo.Id}`);

        this.gameId = gameId;
        console.log(`game id = ${this.gameId}`);
    }

    public start()
    {
        console.log('game started');
        io.to(`${this.gameId}.1`).emit('started-game', this.gameId, this.playerTwo.Id)
        io.to(`${this.gameId}.2`).emit('started-game', this.gameId ,this.playerOne.Id);
        timeStart(this.gameId);
        this.gameBoard.startGame();

        io.to(`${this.gameId}.1`).emit('card', this.gameBoard.getPlayerCard(1));
        io.to(`${this.gameId}.2`).emit('card', this.gameBoard.getPlayerCard(2));

        const loop = async () => {
        
            if (!this.playerOne.IsOnline || !this.playerTwo.IsOnline) {
                if (await this.playerIsOffline())
                    return ;
            }

            if (this.playerOne.Card && this.playerTwo.Card) {
                
                console.log('start check cards !');
                io.to(`${this.gameId}.1`).emit('opponent-played-card', [this.playerTwo.Card.cardId, this.playerTwo.Card.cardNumber]);
                io.to(`${this.gameId}.2`).emit('opponent-played-card', [this.playerOne.Card.cardId, this.playerOne.Card.cardNumber]);
                this.sleep(2500);
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

            if (this.playerOne.Point == 3 || this.playerTwo.Point == 3)
            {
                endGame(this.gameId);
                io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('game-ended');
                await clearRoom(`${this.gameId}.1`);
                await clearRoom(`${this.gameId}.2`);
                return ;
            }
            setTimeout(loop, this.delay / 4);
        }
        loop();
    }

    public disconnect(playerId: number)
    {
        console.log(`player ${playerId} is off line`);
        io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('wait-opponent');
        if (playerId == this.playerOne.Id)
            this.playerOne.IsOnline = false;
        else if (playerId == this.playerTwo.Id)
            this.playerTwo.IsOnline = false;
    }

    public async reconnect(userId: number, socket: Socket)
    {
        if (userId == this.playerOne.Id)
        {
            this.playerOne.IsOnline = true;
            socket.join(`${this.gameId}.1`);
            io.to(`${this.gameId}.1`).emit('reconnect');
            io.to(`${this.gameId}.2`).emit('opponent-reconnected');
            await this.sleep(this.delay / 5);
            io.to(`${this.gameId}.1`).emit('started-game', this.gameId);
            await this.sleep(this.delay / 5);
            io.to(`${this.gameId}.1`).emit('card', this.gameBoard.getPlayerCard(1));
        }
        else if (userId == this.playerTwo.Id)
        {
            this.playerTwo.IsOnline = true;
            socket.join(`${this.gameId}.2`);
            io.to(`${this.gameId}.2`).emit('reconnect');
            io.to(`${this.gameId}.1`).emit('opponent-reconnected');
            await this.sleep(this.delay / 5);
            io.to(`${this.gameId}.2`).emit('started-game', this.gameId);
            await this.sleep(this.delay / 5);
            io.to(`${this.gameId}.2`).emit('card', this.gameBoard.getPlayerCard(2));
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

    private playedCards(playerOneCard: playedCard, playerTwoCard: playedCard)
    {
       if (playerOneCard.cardId == playerTwoCard.cardId) {
           io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('equal');
            return ;
        }

       if (playerOneCard.cardId == 0 || playerTwoCard.cardId == 0)
       {
           if (playerOneCard.cardId < playerTwoCard.cardId) {
                this.whoWinRound(playerOneCard.userId); // remplacer par drawRound
           } else {
                this.whoWinRound(playerTwoCard.userId);
           }
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
        return new Promise(resolve => {
            const interval= setInterval(() => {

                console.log(`player one is online = ${this.playerOne.IsOnline}, player two is online = ${this.playerTwo.IsOnline}`);
                if (this.playerOne.IsOnline && this.playerTwo.IsOnline)
                {
                    this.PlayerOneTime = 15;
                    this.PlayerTwoTime = 15;
                    console.log('all on line');
                    clearInterval(interval);
                    resolve(false);
                }

                if (!this.playerOne.IsOnline && this.PlayerOneTime > 0)
                    this.PlayerOneTime--;
                if (!this.playerTwo.IsOnline && this.PlayerTwoTime > 0)
                    this.PlayerTwoTime--;

                if (this.PlayerOneTime == 0 && this.playerTwo.IsOnline)
                {
                    console.log('player one off line');
                    io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('forfeit', this.playerOne.Id);
                    forfeit(this.gameId, 1);
                    clearInterval(interval);
                    resolve(true);
                }
                if (this.PlayerTwoTime == 0 && this.playerOne.IsOnline)
                {
                    console.log('player 2 off line');
                    forfeit(this.gameId, 2);
                    io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('forfeit', this.playerTwo.Id);
                    clearInterval(interval);
                    resolve(true);
                }
                if (this.PlayerOneTime == 0 && this.PlayerTwoTime == 0)
                {
                    console.log('all off line');
                    io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('forfeit', 'all player');
                    forfeit(this.gameId, 0);
                    clearInterval(interval);
                    resolve(true);
                }

            }, this.delay);
        });
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

}