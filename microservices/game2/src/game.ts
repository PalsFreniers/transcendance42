import { GameBoard } from "./gameObjects/gameBoard.js";
import { io } from "./index.js"
import { timeStart } from "./Game2Database.js";
import { playedCard } from "./gameObjects/gameBoard.js";

// le start du jeu, les actions, les point( la fin et le lobby d'attente de joueur ?)

export class game
{
    private gameId: number;
    private playerOneId :number;
    private playerTwoId :number;
    private gameBoard :GameBoard = new GameBoard();
    private playerOnePoint: number = 0;
    private playerTwoPoint: number = 0;
    private playerOneCardPlay: playedCard | null = null;
    private playerTwoCardPlay: playedCard | null = null;
    private delay = 1000/60;

    constructor(playerOne :number, playerTwo :number, gameId: number) {
        this.playerOneId = playerOne;
        console.log(`player one = ${playerOne}`);
        this.playerTwoId = playerTwo;
        console.log(`player two = ${playerTwo}`);
        this.gameId = gameId;
        console.log(`game id = ${this.gameId}`);
    }

    public chooseCard(card: playedCard)
    {
        console.log(`player (${card.userId}) choose is card !`)
        if (card.userId == this.playerOneId) {
            card.userId = 1;
            this.playerOneCardPlay = card;
        }
        else if (card.userId == this.playerTwoId) {
            card.userId = 2;
            this.playerTwoCardPlay = card;
        }
    }

    public start()
    {
        console.log('game started');
        io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('started-game', this.gameId);
        timeStart(this.gameId);
        this.gameBoard.startGame();

        io.to(`${this.gameId}.1`).emit('card', this.gameBoard.getPlayerCard(1));
        io.to(`${this.gameId}.2`).emit('card', this.gameBoard.getPlayerCard(2));

        const loop = () => {
            if (this.playerOneCardPlay && this.playerTwoCardPlay) {
                console.log('start check cards !');
                this.playedCards(this.playerOneCardPlay, this.playerTwoCardPlay);
                this.gameBoard.discardCard(this.playerOneCardPlay);
                this.gameBoard.discardCard(this.playerTwoCardPlay);
                this.gameBoard.drawCard(1);
                this.gameBoard.drawCard(2);
                io.to(`${this.gameId}.1`).emit('card', this.gameBoard.getPlayerCard(1));
                io.to(`${this.gameId}.2`).emit('card', this.gameBoard.getPlayerCard(2));
                console.log('end check cards !');
                this.playerOneCardPlay = null;
                this.playerTwoCardPlay = null;
            }

            if (this.playerOnePoint == 3 || this.playerTwoPoint == 3)
                return io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('game-ended');
            setTimeout(loop, this.delay);
        }
        loop();
    }

    private whoWinRound(userIdWinner: number)
    {
        if (userIdWinner == 1) {
            this.playerOnePoint++;
            io.to(`${this.gameId}.1`).emit('winRound', this.playerOnePoint, this.playerTwoPoint);
            io.to(`${this.gameId}.2`).emit('loseRound', this.playerOnePoint, this.playerTwoPoint);
        }
        else if (userIdWinner == 2)
        {
            this.playerTwoPoint++;
            io.to(`${this.gameId}.1`).emit('loseRound', this.playerOnePoint, this.playerTwoPoint);
            io.to(`${this.gameId}.2`).emit('winRound', this.playerTwoPoint, this.playerOnePoint);
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