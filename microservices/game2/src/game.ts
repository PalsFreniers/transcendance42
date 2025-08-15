import { GameBoard } from "./gameObjects/gameBoard.js";
import { io } from "./index.js"
import { timeStart } from "./Game2Database.js";
import { playedCard } from "./gameObjects/gameBoard.js";

// le start du jeu, les actions, les point(, la fin et le lobby d'attente de joueur ?)

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
                return console.log(`all player choose card !`);
            }
            setTimeout(loop, this.delay);
        }
        loop();
    }
    private playedCards(playerOneCard: playedCard, playerTwoCard: playedCard)
    {
       if (playerOneCard.cardId == playerTwoCard.cardId)
           io.to(`${this.gameId}.1`).to(`${this.gameId}.1`).emit('equal');

       if (playerOneCard.cardId == 0 || playerTwoCard.cardId == 0)
       {
           if (playerOneCard.userId < playerTwoCard.cardId) {
               this.playerOnePoint++;
               io.to(`${this.gameId}.1`).to('winRound', this.playerOnePoint, this.playerTwoPoint);
               io.to(`${this.gameId}.2`).to('loseRound', this.playerOnePoint, this.playerTwoPoint);
           } else {
               this.playerTwoPoint++;
               io.to(`${this.gameId}.1`).to('loseRound', this.playerOnePoint, this.playerTwoPoint);
               io.to(`${this.gameId}.2`).to('winRound', this.playerTwoPoint, this.playerOnePoint);
           }
       }



    }
}