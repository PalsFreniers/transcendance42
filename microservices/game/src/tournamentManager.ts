import { player_type, bracket_type, Tournament } from "./tournament.js"
import { GameManager } from "./gameManager.js";
import { Server } from "socket.io"

export class TournamentManager {

    private _tournaments = new Map<string, Tournament>();
    private static _instance: TournamentManager | null = null;

    static getInstance() {
        if (!this._instance)
            this._instance = new TournamentManager();
        return this._instance;
    }

    createTournament(name: string, maxPlayers: number, server: Server) {
        if (this._tournaments.has(name))
            return 1; // tournament already exists
        this._tournaments.set(name, new Tournament(name, maxPlayers, server));
        return 0;
    }

    // player_type is [playerID, playerSocketID]
    joinTournament(name: string,  player: player_type) {
        if (!this._tournaments.has(name))
            return 1; // tournament doesn't exist
        if (this.isPlayerRegistered(player))
            return 2; // player is already in a tournament
        if (GameManager.getInstance().isPlayerInGame(player[0]))
            return 3; // player is in a game and therefore cannot register to a tournament
        const t: Tournament = this._tournaments.get(name)!;
        t.registerPlayer(player);
        return 0;
    }

    leaveTournament(name: string, player: player_type) {
        if (!this._tournaments.has(name))
            return 1; // tournament doesn't exist
        if (!this.isPlayerRegistered(player))
            return 2; // player is not in a tournament
        const t: Tournament = this._tournaments.get(name)!;
        if (t.state == "running")
            return 3; // player cannot leave a tournament if it started
        t.unregisterPlayer(player);
        return 0;
    }

    startTournament(name: string) {
        if (!this._tournaments.has(name))
            return 1; // tournament doesn't exist
        const t = this._tournaments.get(name)!;
        const errno = t.startTournament();
        if (errno)
            // errno can be 2 or 3
            // case 2: tournament already started
            // case 3: not enough player
            return 1 + errno
        t.playRound();
        return 0;
    }

    // Search for a player in a tournament and returns either their tournament or null
    // player is either playerID (number), socketID (string) or player_type ([playerID, socketID])
    isPlayerRegistered(player: number | string | player_type): Tournament | null {
        for (const [_, tournament] of this._tournaments) {
            const result = tournament.players.find((p) => {
                switch (typeof player) {
                    case "number":
                        return (p[0] === player); // compare only playerIDs
                    case "string": // why would you even send a socketID
                        return (p[1] === player); // compare only socketIDs
                    case "object": // compare playerID and socketID, safer since everything in tournament requires both
                        return (p[0] === player[0] && p[1] === player[1]);
                    default:
                        return false;
                }
            });
            if (result)
                return tournament;
        }
        return null;
    }

}