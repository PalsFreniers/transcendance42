import { Card } from './card.js';
import * as math from "mathjs";

export interface playedCard{
    userId: number;
    cardId: number;
    cardNumber: number;
}

export class GameBoard {

    private drawPile: Card[] = [];
    private playerOne: Card[] = [];
    private playerTwo: Card[] = [];
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
            return ;
        }
        if (player == 1) {
            if (this.drawPile.length > 0) {
                this.playerOne.push(this.drawPile[0]);
                this.drawPile.splice(0, 1);
            }
        }
        else if (player == 2) {
            if (this.drawPile.length > 0) {
                this.playerTwo.push(this.drawPile[0]);
                this.drawPile.splice(0, 1);
            }
        }
    }

    public discardCard(played: playedCard) {
        if (this.playerOne.length <= 0 && this.playerTwo.length <= 0)
            return ;

        if (played.userId == 1) {
            for (var i = 0; i < this.playerOne.length; i++) {
                if (this.playerOne[i].getType() == played.cardId && this.playerOne[i].getNumber() == played.cardNumber) {
                    this.discardPile.push(this.playerOne[i]);
                    this.playerOne.splice(i, 1);
                    break;
                }
            }
        }
        if (played.userId == 2) {
            for (var i = 0; i < this.playerTwo.length; i++) {
                if (this.playerTwo[i].getType() == played.cardId && this.playerTwo[i].getNumber() == played.cardNumber) {
                    this.discardPile.push(this.playerTwo[i]);
                    this.playerTwo.splice(i, 1);
                    break;
                }
            }
        }
    }

    public getPlayerCard(player: number): [number, number][] {
        const cards = player === 1 ? this.playerOne : this.playerTwo;

        // On map seulement les cartes existantes
        return cards.map(card => [card.getType(), card.getNumber()]);
    }

    public coinUsed(player: number, target:[number, number], replaceBy: number) {
        let newNumber: number = 10;

        this.discardPile.forEach((card) => {
            if (card.getType() == replaceBy && card.getNumber() == newNumber)
                newNumber++;
        })
        this.drawPile.forEach((card) => {
            if (card.getType() == replaceBy && card.getNumber() == newNumber)
                newNumber++;
        })
        this.playerOne.forEach((card) => {
            if (card.getType() == replaceBy && card.getNumber() == newNumber)
                newNumber++;
        })
        this.playerTwo.forEach((card) => {
            if (card.getType() == replaceBy && card.getNumber() == newNumber)
                newNumber++;
        })

        if (player == 1)
        {
            this.playerOne.forEach((card) => {
               if (card.getType() == target[0] && card.getNumber() == target[1])
                    card.changeCard(replaceBy, newNumber);
            });
        }
        if (player == 2)
        {
            this.playerTwo.forEach((card) => {
                if (card.getType() == target[0] && card.getNumber() == target[1])
                    card.changeCard(replaceBy, newNumber);
            });
        }
    }

    public startGame() {
        for (var i = 0; i < 3; i++)
        {
            this.drawCard(1);
            this.drawCard(2);
        }
    }
}