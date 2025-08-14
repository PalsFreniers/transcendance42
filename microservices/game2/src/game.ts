import { GameBoard } from "./gameObjects/gameBoard.js";
import { io } from "./index.js"
// le start du jeu, les actions, les point(, la fin et le lobby d'attente de joueur ?) 

export class game
{
    private gameId: number;
    private playerOneId :number;
    private playerTwoId :number;
    private gameBoard :GameBoard = new GameBoard();
    private playerOnePoint: number = 0;
    private playerTwoPoint: number = 0;

    constructor(playerOne :number, playerTwo :number, gameId: number) {
        this.playerOneId = playerOne;
        this.playerTwoId = playerTwo;
        this.gameId = gameId;
    }

    public start()
    {
        console.log('game started');
        io.to(`${this.gameId}.1`).to(`${this.gameId}.2`).emit('started-game');

    }
    public playedCards(idOne :number, numberOne :number, idTwo :number, numberTwo :number)
    {
        if (idOne == idTwo)
            return console.log('No winner !');

        if (idOne == 0 || idTwo == 0)
        {
            if (idOne > idTwo)
                return console.log('Player two win !');
            else
                return console.log('Player one win !');
        }
        switch(idOne)
        {
            case 1 :
                if (idTwo == 2)
                    this.playerTwoPoint++;
                else
                    this.playerOnePoint++;
                break;
            case 2 :
                if (idTwo == 3)
                    this.playerTwoPoint++;
                else
                    this.playerOnePoint++;
                break;
            case 3 :
                if (idTwo == 1)
                    this.playerTwoPoint++;
                else
                    this.playerOnePoint++;
                break;
        }
        this.gameBoard.discardCard(1, idOne, numberOne);
        this.gameBoard.discardCard(2, idTwo, numberTwo);
        this.gameBoard.drawCard(1);
        this.gameBoard.drawCard(1);
    }

    
}