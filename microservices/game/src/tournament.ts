import {Server} from "socket.io";
import {Listener} from "./game.js";
import {GameManager} from "./gameManager.js";
import {createGameLobby} from "./gameModel.js"

export type player_type = [number, string]; // playerID and socketID
export type bracket_type = [player_type, player_type][];

export class Tournament {
    public _players: player_type[] = [];
    public _winnerBracket: bracket_type = [];
    public _winningPlayers: player_type[] = [];
    public _loserBracket: bracket_type = [];
    public _losingPlayers: player_type[] = [];
    public _state: "waiting" | "running" | "finished" = "waiting";
    public _roundNum: number = 0;
    public _matchNum: number = 0;
    public _leaderboard: player_type[] = [];
    public _isGrandFinale: boolean = false;
    public _finaleInProgress: boolean = false;
    public _numberOfGames: number = 0;
    private _events: Map<string, Listener[]> = new Map();

    constructor(
        private _name: string,
        private _maxPlayers: number,
        private _associatedServer: Server
    ) {
    }

    // Methods
    public startTournament(endHandler: Listener) {
        if (this.state !== "waiting")
            return 1; // tournament already started
        if (this.players.length <= 2) // 3 or more needed
            return 2; // not enough player

        // Handle tournament end
        this.on("tournament-end", endHandler);

        // Generate the brackets
        this._winnerBracket = this._initBrackets(this.players);
        this._state = "running";

        return 0;
    }

    public playRound(token: string) {
        if (this._state === "finished"
            || this._state === "waiting"
            || this._finaleInProgress)
            return;

        // Timeout is to simulate "lag" and prevent tournament to go too fast and break
        setTimeout(() => {
            this._roundNum++;
            this._matchNum = 0;
            if (this.remainingPlayers.length == 2) {
                this._playFinale(token);
            } else {
                if (this._winnerBracket.length)
                    this._advanceWinnerBracket(token);
                if (this._loserBracket.length)
                    this._advanceLoserBracket(token)
            }
        }, 1e3);
    }

    // Event Manager
    on(event: string, listener: Listener) {
        if (!this._events.has(event))
            this._events.set(event, []);
        this._events.get(event)!.push(listener);
        return this;
    }

    off(event: string, listener: Listener) {
        const listeners = this._events.get(event);
        if (!listeners)
            return;
        this._events.set(
            event,
            listeners.filter((l) => {
                return l !== listener;
            })
        );
        return this;
    }

    emit(event: string, data?: any) {
        const listeners = this._events.get(event);
        if (!listeners)
            return;
        listeners.forEach((listener) => {
            listener(data);
        });
        return this;
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

    private _advanceWinnerBracket(token: string) {
        const matches = [...this._winnerBracket].reverse();
        this._winnerBracket = [];

        this._numberOfGames = matches.length;
        matches.forEach((match) => {
            this._launchGame(match, "WinnerBracket",
                token,
                (t, result) => {
                    if (t._state === "finished") return;
                    t._winningPlayers.push(result[0]);
                    if (result[1][0] !== -1) {
                        t._losingPlayers.push(result[1]);
                        this.emit("won", { t: this, result });
                        this.emit("lose", { t: this, result });
                    } else {
                        this.emit("bye", { t: this, result });
                    }
                    t._numberOfGames--;
                    if (!t._numberOfGames) {
                        t._loserBracket = t._initBrackets(t._losingPlayers);
                        t._losingPlayers = [];
                        t.playRound(token);
                    }
                }
            );
        });
    }

    private _advanceLoserBracket(token: string) {
        const matches = [...this._loserBracket].reverse();
        this._loserBracket = [];

        this._numberOfGames = matches.length;
        matches.forEach((match) => {
            this._launchGame(match, "LoserBracket",
                token,
                (t, result) => {
                    if (t._state === "finished") return;
                    t._losingPlayers.push(result[0]);
                    t._numberOfGames--;
                    if (result[1][0] !== -1) {
                        t._leaderboard.push(result[1]);
                        this.emit("won", { t: this, result });
                        this.emit("elimination", { t: this, result });
                    } else {
                        this.emit("bye", { t: this, result });
                    }
                    if (!t._numberOfGames) {
                        t._winnerBracket = t._initBrackets(t._winningPlayers);
                        t._winningPlayers = [];
                        t.playRound(token);
                    }
                }
            );
        });
    }

    private _playFinale(token: string) {
        if (this._finaleInProgress) 
            return;
        this._finaleInProgress = true;
        let winner: player_type;
        let loser: player_type;

        if (!this._winningPlayers.length) {
            winner = this._winnerBracket[0][0];
            loser = this._losingPlayers[0];
        }
        else {
            winner = this._winningPlayers[0];
            loser = this._loserBracket[0][0];
        }

        const finalBracket: [player_type, player_type] = [loser, winner];
        this._launchGame(
            finalBracket,
            this._isGrandFinale ? "Grand Finale" : "Finale",
            token,
            (t, result) => {
                this.emit("won", { t: this, result });
                const handleTournamentEnd = (tournamentWinner, tournamentLoser) => {
                    this.emit("elimination", { t: this, result });
                    this._leaderboard.push(tournamentLoser);
                    this._leaderboard.push(tournamentWinner);
                    this._winningPlayers = [];
                    this._losingPlayers = [];
                    this._winnerBracket = [];
                    this._loserBracket = [];
                    this._state = "finished";
                    this.emit("tournament-end", this);
                };
                if (result[0][0] == winner[0]) { // WB won FINALE
                    handleTournamentEnd(winner, loser);
                    return ;
                } else if (this._isGrandFinale) { // LB won GRAND FINALE
                    handleTournamentEnd(loser, winner);
                    return ;
                } else { // LB won FINALE
                    this.emit("lose", { t: this, result });
                    this._isGrandFinale = true;
                    this._finaleInProgress = false;
                    this.playRound(token);
                }
            }
        );
    }

    // Lambda arguments are the current tournament and the result of the game: [winner, loser]
    private _launchGame(
        round: [player_type, player_type],
        roundName: string,
        token: string,
        onGameEnd: ((t: Tournament, result: [player_type, player_type]) => void),
    ) {
        if (round[1][0] === -1) {
            onGameEnd(this, round);
            return;
        }
        // // Create the associated game
        const gameManager = GameManager.getInstance();
        let name: string = `tournament_${this._name}_${roundName}_Round${this._roundNum}-${this._matchNum++}`;
        const gameID = createGameLobby({
            playerOne: round[0][0],
            playerTwo: null,
            lobbyName: name,
            finalScore: "0-0",
            status: "waiting",
            gameDate: new Date().toISOString(),
        });
        if (gameManager.createLobby(name, gameID))
            throw new Error("Couldn't create the lobby");
        const joinGameWrapper = (playerInfo) => {
            const errno = gameManager.joinLobby(name, playerInfo[0])
            const playerUsername = gameManager.getUsernameFromSocket(playerInfo[1], this._associatedServer);
            if (errno) {
                switch (errno) {
                    case 1: throw new Error("Couldn't create the lobby");
                    case 2: throw new Error("Player is already in the lobby");
                    case 3: throw new Error("Lobby is full");
                    case 4: throw new Error(`${playerUsername} is already in a game`);
                    case 5: throw new Error(`${playerUsername} cannot participate in tournament if not registered`);
                    case 6: throw new Error(`${playerUsername} cannot participate in a non tournament game if registered`);
                }
            }
        }
        joinGameWrapper(round[0]);
        joinGameWrapper(round[1]);
        gameManager.findGame(name)!.on("game-end", ({game, _}) => {
            (game.score[0] > game.score[1]) ? onGameEnd(this, round) : onGameEnd(this, round.reverse() as [player_type, player_type]);
        }).on("game-state", (state) => {
			this._associatedServer.to(`game-${gameID}`).emit("game-state", state)
		});
        // Starts, and wait until game is finished
        const errno = gameManager.startGame(name, gameID.toString(), this._associatedServer, token);
        if (errno) {
            if (errno == 1)
                throw new Error(`Lobby ${name} doesn't exist`); // Shouldn't happen...
            throw new Error(`Lobby ${name} isn't full`);        // ...neither should this
        }
    }
}
