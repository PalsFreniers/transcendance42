// import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import {GameManager} from "./gameManager.js";
import {createGameLobby} from "./gameModel.js"

type player_type = [number, string]; // playerID and socketID
type bracket_type = [player_type, player_type][];

class Tournament {
    private _players: player_type[] = [];
    private _winnerBracket: bracket_type = [];
    private _winningPlayers: player_type[] = [];
    private _loserBracket: bracket_type = [];
    private _losingPlayers: player_type[] = [];
    private _state: "waiting" | "running" | "finished" = "waiting";
    private _roundNum: number = 0;
    private _leaderboard: player_type[] = [];
    private _isGrandFinale: boolean = false;

    constructor(
        private _name: string,
        private _maxPlayers: number,
    ) {}

    // Methods
    public startTournament() {
        if (this.state !== "waiting") return 1; // tournament already started
        if (this.players.length < 2) return 2; // not enough player

        // Generate the brackets
        this._winnerBracket = this._initBrackets(this.players);
        this._state = "running";
        return 0;
    }

    public async playRound() {
        this._roundNum++;
        if (this._state != "running"
            || !this.remainingPlayers.length)
            return
        if (this.remainingPlayers.length == 2) {
            await this._playFinale();
            return;
        }
        await this._advanceWinnerBracket();
        if (!this._winnerBracket.length) {
            this._loserBracket = this._initBrackets(this._losingPlayers);
            this._losingPlayers = [];
        }
        await this._advanceLoserBracket();
        if (!this._loserBracket.length) {
            this._winnerBracket = this._initBrackets(this._winningPlayers);
            this._winningPlayers = [];
        }
    }

    // Accessors
    public get name() {
        return this._name;
    }

    public set name(name: string) {
        this._name = name;
    }

    public get maxPlayers() {
        return this._maxPlayers;
    }

    public get state() {
        return this._state;
    }

    public set state(state: "waiting" | "running" | "finished") {
        this._state = state;
    }

    public get players() {
        return this._players;
    }

    public registerPlayer(player: player_type) {
        if (this.state !== "waiting") return 1; // tournament is started
        if (
            this.players.length &&
            this.players.find((v) => {
                return v[0] === player[0] && v[1] === player[1];
            }) !== undefined
        ) {
            return 2; // player is already registered
        }
        if (this.players.length === this._maxPlayers) return 3; // tournament is full
        this._players.push(player);
        return 0;
    }

    public unregisterPlayer(player: player_type) {
        const idx = this.players.indexOf(player);
        if (idx > 1) this._players.splice(idx, 1);
    }

    public get brackets(): [bracket_type, bracket_type] {
        return [this._winnerBracket, this._loserBracket];
    }

    public get remainingPlayers(): player_type[] {
        return this._players.filter((p) => {
            return (
                this._leaderboard.find((v) => {
                    return p[0] === v[0];
                }) === undefined
            );
        });
    }

    public get leaderboard(): player_type[] {
        return this._leaderboard;
    }

    public get roundnum(): number {
        return this._roundNum;
    }

    // Private methods
    private _initBrackets(participants: player_type[]): bracket_type {
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        const bracket: bracket_type = [];
        for (let i = 0; i < shuffled.length; i += 2) {
            const p1 = shuffled[i];
            const p2 = shuffled[i + 1] ?? [-1, "-1"];
            bracket.push([p1, p2]);
        }

        return bracket;
    }

    private async _advanceWinnerBracket() {
        const matches = [...this._winnerBracket];
        this._winnerBracket = [];

        const promises = matches.map((match) =>
            this._launchGame([match], "WinnerBracket"),
        );

        const results = await Promise.all(promises);

        for (const [winner, loser] of results) {
            this._winningPlayers.push(winner);
            if (loser[0] !== -1) this._losingPlayers.push(loser);
        }
    }

    private async _advanceLoserBracket() {
        const matches = [...this._loserBracket];
        this._loserBracket = [];

        const promises = matches.map((match) =>
            this._launchGame([match], "LoserBracket"),
        );

        const results = await Promise.all(promises);

        for (const [winner, loser] of results) {
            this._losingPlayers.push(winner);
            if (loser[0] != -1) this._leaderboard.push(loser);
        }
    }

    private async _playFinale() {
        let winner: player_type;
        let loser: player_type;
        if (!this._winningPlayers.length) {
            winner = this._winnerBracket[0][0];
            loser = this._losingPlayers[0];
        } else {
            winner = this._winningPlayers[0];
            loser = this._loserBracket[0][0];
        }
        const finalBracket: bracket_type = [[loser, winner]];
        const finalResult = await this._launchGame(
            finalBracket,
            this._isGrandFinale ? "Grand Finale" : "Finale",
        );
        if (finalResult[0][0] == winner[0]) {
            this._leaderboard.push(loser);
            this._leaderboard.push(winner);
            this._state = "finished";
        } else if (this._isGrandFinale) {
            this._leaderboard.push(winner);
            this._leaderboard.push(loser);
            this._state = "finished";
        } else {
            this._isGrandFinale = true;
        }
    }

    private async _launchGame(bracket: bracket_type, roundName: string): Promise<[player_type, player_type]> {
        let round: [player_type, player_type] = bracket.splice(0, 1)[0];
        if (round[1][0] === -1)
            return round;
        let name = `tournament_${roundName}_Round${this._roundNum}-${Math.floor(this._loserBracket.length / 2)}`;
        // Create the associated game
        const gameManager = GameManager.getInstance();
        const gameID = createGameLobby({
          playerOne: round[0],
          playerTwo: null,
          name,
          finalScore: "0-0",
          status: "waiting",
          gameDate: new Date().toISOString(),
        });
        gameManager.createLobby(name, gameID);
        gameManager.joinLobby(name, round[0][0]);
        gameManager.joinLobby(name, round[1][0]);
        gameManager.registerSocket(round[0][0], round[0][1]);
        gameManager.registerSocket(round[1][0], round[1][1]);
        // Starts, and wait until game is finished
        gameManager.startGame(name, gameID, this._associatedServer, false);

        const score = await new Promise<[number, number]>((resolve) => {
          const waitForGame = setInterval(() => {
            const game = gameManager.findGame(gameName);
            if (game && game.state === "finished") {
              clearInterval(waitForGame);
              resolve(game.score as [number, number]);
            }
          }, 1000);
        });

        return score[0] > score[1] ? [round[0], round[1]] : [round[1], round[0]];
    }
}