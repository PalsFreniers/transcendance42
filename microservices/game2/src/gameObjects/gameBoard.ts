import { Card } from './card.js';
import * as math from "mathjs";

export class GameBoard {

    private drawPile: Card[] = [];
    private playerOne: Card[] = [];
    private playerTwo: Card[] = []; // relier aux id du joueur pour plus de securiter
    private discardPile: Card[] = [];

    constructor() {
        this.shufflingCards();
    }

    private shufflingCards() {
        for (var number = 0, id = 0; id < 4; number++)
        {
            var tmp:Card = new Card(id, number);
            var random:number = math.floor(math.random() * 32);
            while (this.drawPile[random] || random >= 32)
            {
                if (random >= 31)
                    random = 0
                else
                    random++;
            }
            // console.log(`carte [${random}] = ${id}.${number}`);
            this.drawPile[random] = tmp;
            if (id == 0 && number == 1)
                number = -1, id++;
            if (id > 0 && number == 9)
                number = -1, id++;
        }
    }

    public drawCard(player :number) {
        if (this.drawPile.length <= 0)
        {
            console.log('fail to draw card !');
            return ;
        }
        if (player == 1) {
            this.playerOne.push(this.drawPile[0]);
            this.drawPile.splice(0, 1);
        }
        else if (player == 2) {
            this.playerTwo.push(this.drawPile[0]);
            this.drawPile.splice(0, 1);
        }
    }

    public discardCard(player :number, cardId :number, cardNumber :number) {
        if (this.playerOne.length <= 0 && this.playerTwo.length <= 0)
            return ;

        if (player == 1) {
            for (var i = 0; i < this.playerOne.length; i++) {
                if (this.playerOne[i].getType() == cardId && this.playerOne[i].getNumber() == cardNumber) {
                    this.discardPile.push(this.playerOne[i]);
                    this.playerOne.splice(i, 1);
                    break;
                }
            }
        }
        if (player == 2) {
            for (var i = 0; i < this.playerTwo.length; i++) {
                if (this.playerTwo[i].getType() == cardId && this.playerTwo[i].getNumber() == cardNumber) {
                    this.discardPile.push(this.playerTwo[i]);
                    this.playerTwo.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    public getPlayerCard(player :number)
    {
        if (player == 1)
            return this.playerOne;
        else
            return this.playerTwo;
    }

    public startGame()
    {
        for (var i = 0; i < 3; i++)
        {
            this.drawCard(1);
            this.drawCard(2);
        }
    }
}