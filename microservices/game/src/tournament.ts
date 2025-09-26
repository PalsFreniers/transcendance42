import {Server} from "socket.io";
import {GameManager} from "./gameManager.js";
import {createGameLobby} from "./gameModel.js"

export type player_type = [number, string]; // playerID and socketID
export type bracket_type = [player_type, player_type][];

export class Tournament {
    private _players: player_type[] = [];
    private _winnerBracket: bracket_type = [];
    private _winningPlayers: player_type[] = [];
    private _loserBracket: bracket_type = [];
    private _losingPlayers: player_type[] = [];
    private _state: "waiting" | "running" | "finished" = "waiting";
    private _roundNum: number = 0;
    private _matchNum: number = 0;
    private _leaderboard: player_type[] = [];
    private _isGrandFinale: boolean = false;
    private _canAdvance: boolean = false;
    private _numberOfGames: number = 0;

    constructor(
        private _name: string,
        private _maxPlayers: number,
        private _associatedServer: Server
    ) {
    }

    // Methods
    public startTournament() {
        if (this.state !== "waiting")
            return 1; // tournament already started
        if (this.players.length <= 2) // 3 or more needed
            return 2; // not enough player

        // Generate the brackets
        this._winnerBracket = this._initBrackets(this.players);
        this._state = "running";
        return 0;
    }

    public playRound() {
        if (this._state != "running"
            || !this.remainingPlayers.length)
            return 1; // tournament is finished
        this._roundNum++;
        this._matchNum = 0;
        if (this.remainingPlayers.length == 2) {
            this._playFinale();
            return 0;
        }

        if (this._winnerBracket.length)
            this._advanceWinnerBracket();
        if (this._loserBracket.length)
            this._advanceLoserBracket()
        return 0;
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
        return this._leaderboard.reverse();
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

    private _advanceWinnerBracket() {
        const matches = [...this._winnerBracket].reverse();
        this._winnerBracket = [];

        this._numberOfGames = matches.length;
        matches.forEach((match) => {
            const result = this._launchGame(matches, "WinnerBracket",
                (t, result) => {
                    this._winningPlayers.push(result[0]);
                    if (result[1][0] !== -1) this._losingPlayers.push(result[1]);
                },
                (t) => {
                    this._loserBracket = this._initBrackets(this._losingPlayers);
                    this._losingPlayers = [];
                    this.playRound();
                }
            );
        });
    }

    private _advanceLoserBracket() {
        const matches = [...this._loserBracket].reverse();
        this._loserBracket = [];

        this._numberOfGames = matches.length;
        matches.forEach((match) => {
            const result = this._launchGame(matches, "LoserBracket",
                (t, result) => {
                    this._losingPlayers.push(result[0]);
                    if (result[1][0] !== -1) this._leaderboard.push(result[1]);
                },
                (t) => {
                    this._winnerBracket = this._initBrackets(this._winningPlayers);
                    this._winningPlayers = [];
                    this.playRound();
                }
            );
        });
    }

    private _playFinale() {
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
        const finalResult = this._launchGame(
            finalBracket,
            this._isGrandFinale ? "Grand Finale" : "Finale",
            (t, result) => {
                if (result[0][0] == winner[0]) { // WB won FINALE
                    this._leaderboard.push(loser);
                    this._leaderboard.push(winner);
                    this._state = "finished";
                } else if (this._isGrandFinale) { // LB won GRAND FINALE
                    this._leaderboard.push(winner);
                    this._leaderboard.push(loser);
                    this._state = "finished";
                } else { // LB won FINALE
                    this._isGrandFinale = true;
                }
            },
            (t) => {
                if (t._isGrandFinale)
                    t.playRound();
            }
        );
    }

    // Lambda arguments are the current tournament and the result of the game: [winner, loser]
    private _launchGame(
        bracket: bracket_type,
        roundName: string,
        onGameEnd: ((t: Tournament, result: [player_type, player_type]) => void),
        onBracketEnd: ((t: Tournament) => void)
    ) {
        let round: [player_type, player_type] = bracket.splice(0, 1)[0];
        this._numberOfGames--;
        if (round[1][0] === -1) {
            onGameEnd(this, round);
            if (!this._numberOfGames)
                onBracketEnd(this);
            return ;
        }
        let name: string = `tournament_${this._name}_${roundName}_Round${this._roundNum}-${this._matchNum++}`;
        // // Create the associated game
        const gameManager = GameManager.getInstance();
        const gameID = createGameLobby({
            playerOne: round[0][0],
            playerTwo: null,
            lobbyName: name,
            finalScore: "0-0",
            status: "waiting",
            gameDate: new Date().toISOString(),
        });
        gameManager.createLobby(name, gameID);
        gameManager.joinLobby(name, round[0][0]);
        gameManager.joinLobby(name, round[1][0]);
        gameManager.registerSocket(round[0][0], round[0][1]);
        gameManager.registerSocket(round[1][0], round[1][1]);
        gameManager.findGame(name)!.on("game-end", ({game, players}) => {
            (game.score[0] > game.score[1]) ? onGameEnd(this, round) : onGameEnd(this, round.reverse() as [player_type, player_type]);
            if (!this._numberOfGames)
                onBracketEnd(this);
        });
        // Starts, and wait until game is finished
        gameManager.startGame(name, gameID.toString(), this._associatedServer);
        return null;
    }
}
