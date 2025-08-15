import { game } from "./game.js";

export class Manager
{
    private games = new Map<number, game>;
    private static instance: Manager | null = null;

    private constructor() {
    }

    public static getInstance() {
        if (!this.instance)
            this.instance = new Manager();
        return this.instance;
    };

    public newGame(userOneId: number, userTwoId: number, gameId: number)
    {
        if (this.games.has(gameId))
            return false;
        this.games.set(gameId, new game(userOneId, userTwoId, gameId));
    }

    public getGame(gameId: number)
    {
        if (!this.games.has(gameId))
            return null;
        return this.games.get(gameId);
    }
}