import * as Math from 'mathjs';
import { io, Socket } from "socket.io-client";
import {playedCard} from '../gameObjects/gameBoard.js';

export class Ia {

    private _name: string = '';
    private _socket: Socket | null = null;
    private _gameId: number = -1;
    private _id: number = -1;
    private _cards: [number, number][] = [];
    private _allCardsPlay: [number, number][] = [];

    public constructor(gameId: number, id: number) {
        this._name = this.chooseName() + " (ia)";
        this._gameId = gameId
        this._id = id;
        this._socket = null;
        this._cards = [];
        this._allCardsPlay = [];
        this._initSocket();
    }

    public destructor() {
        if (this._socket)
        {
            this._socket.removeAllListeners();
            this._socket.disconnect()
        }
    }

    private _initSocket() {
        this._socket = io(`http://game2-service:3003`, {
            path: '/shifumiSocket/',
            auth: { token: "ia" },
            withCredentials: true,
            transports: ['websocket'],
        });

        this._socket.on('connect', () => {
            if (this._socket)
                this._socket.emit('ia-join-room', this._id, this._gameId, this._name);
        });

        this._socket.on('roomJoined', (gameId) => {
        });

        this._socket.on('card', (cards: [number,number][]) => {
            this._cards = cards;
            this.startSelectCard();
        });

        this._socket.on('opponent-played-card', (card:[number, number]) => {
            this._allCardsPlay.push(card);
        });
    }

    private startSelectCard() {
        let playcard: [number, number];

        const stones = this._cards.filter(c => c[0] === 1);
        const papers = this._cards.filter(c => c[0] === 2);
        const scissors = this._cards.filter(c => c[0] === 3);
        const jokers = this._cards.filter(c => c[0] === 0);

        const playedStones = this._allCardsPlay.filter(c => c[0] === 1).length;
        const playedPapers = this._allCardsPlay.filter(c => c[0] === 2).length;
        const playedScissors = this._allCardsPlay.filter(c => c[0] === 3).length;

        let bestChoice: [number, number] | null = null;
        if (this._cards.length > 0) {
            if (playedStones > playedPapers && scissors.length > 0)
                bestChoice = scissors[Math.floor(Math.random() * scissors.length)];
            else if (playedScissors > playedStones && papers.length > 0)
                bestChoice = papers[Math.floor(Math.random() * papers.length)];
            else if (playedPapers > playedScissors && stones.length > 0)
                bestChoice = stones[Math.floor(Math.random() * stones.length)];
        }

        const randomChance = Math.random();
        if (!bestChoice || randomChance < 0.3)
            playcard = this._cards[Math.floor(Math.random() * this._cards.length)];
        else
            playcard = bestChoice;

        if (this._cards.length <= 2 && jokers.length > 0)
            playcard = jokers[Math.floor(Math.random() * jokers.length)];

        if (this._socket)
            this._socket.emit('play-card', this._gameId, {
                userId: this._id,
                cardId: playcard[0],
                cardNumber: playcard[1]
            });

        this._allCardsPlay.push(playcard);
    }

    private chooseName(): string {
        const noms: string[] = [
            "Alice",
            "Benjamin",
            "Clara",
            "David",
            "Emma",
            "François",
            "Gabrielle",
            "Hugo",
            "Inès",
            "Julien",
            "Karim",
            "Léa",
            "Mathis",
            "Nora",
            "Olivier"
        ];

        return noms[Math.floor(Math.random() * noms.length)];
    }

}
