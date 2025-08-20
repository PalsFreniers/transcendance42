import { GameBoard } from "./gameObjects/gameBoard.js";
import { io } from "./index.js"
import { timeStart, endGame, forfeit } from "./Game2Database.js";
import { playedCard } from "./gameObjects/gameBoard.js";
import { Socket } from "socket.io";

export interface Player {
    Id : number;
    Name : string;
    Point : number;
    Card : playedCard | null;
    IsOnline : boolean;
}

// le start du jeu, les actions, les point( la fin et le lobby d'attente de joueur ?)

export class game
{
    private gameId: number;
    private playerOne : Player;
    private playerTwo : Player;

    private PlayerOneTime : number = 10;
    private PlayerTwoTime : number = 10;

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

    public disconnect(playerId: number)
    {
        console.log(`player ${playerId} is off line`);
        if (playerId == this.playerOne.Id)
            this.playerOne.IsOnline = false;
        else if (playerId == this.playerTwo.Id)
            this.playerTwo.IsOnline = false;
    }

    public reconnect(userId: number, socket: Socket)
    {
        if (userId == this.playerOne.Id)
        {
            this.playerOne.IsOnline = true;
            socket.join(`${this.gameId}.1`);
            io.to(`${this.gameId}.1`).emit('started-game', this.gameId);
            io.to(`${this.gameId}.1`).emit('card', this.gameBoard.getPlayerCard(1));
        }
        else if (userId == this.playerTwo.Id)
        {
            this.playerOne.IsOnline = true;
            socket.join(`${this.gameId}.2`);
            io.to(`${this.gameId}.2`).emit('started-game', this.gameId);
            io.to(`${this.gameId}.2`).emit('card', this.gameBoard.getPlayerCard(2));
        }
    }

    private playerIsOffline(): Promise<boolean>
    {
        return new Promise(resolve => {
            const interval= setInterval(() => {

            if (this.playerOne.IsOnline && this.playerTwo.IsOnline)
            {
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
                io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('forfeit', this.playerOne.Name);
                forfeit(this.gameId, 1);
                clearInterval(interval);
                resolve(true);
            }
            if (this.PlayerTwoTime == 0 && this.playerOne.IsOnline)
            {
                console.log('player 2 off line');
                forfeit(this.gameId, 2);
                io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('forfeit', this.playerTwo.Name);
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

    public start()
    {
        console.log('game started');
        io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('started-game', this.gameId);
        timeStart(this.gameId);
        this.gameBoard.startGame();

        io.to(`${this.gameId}.1`).emit('card', this.gameBoard.getPlayerCard(1));
        io.to(`${this.gameId}.2`).emit('card', this.gameBoard.getPlayerCard(2));

        const loop = async () => {
        
            if (!this.playerOne.IsOnline || !this.playerTwo.IsOnline) {
                if ( await this.playerIsOffline())
                {
                    return ;
                }
            }

            if (this.playerOne.Card && this.playerTwo.Card) {
                
                console.log('start check cards !');
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
                return io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('game-ended');
            }
            setTimeout(loop, this.delay);
        }
        loop();
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
           io.to(`${this.gameId}.1`).to(`${this.gameId}.1`).emit('equal');
            return ;
        }

       if (playerOneCard.cardId == 0 || playerTwoCard.cardId == 0)
       {
           if (playerOneCard.cardId < playerTwoCard.cardId) {
                this.whoWinRound(playerOneCard.userId);
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
}