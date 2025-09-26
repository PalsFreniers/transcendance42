import { Ia } from './ia.js';

export class IaManager 
{

    private _ia: Map<number, Ia>;
    private _nextId: number = -1;
    private static instance: IaManager | null = null;

    private constructor() {
        this._ia = new Map<number, Ia>();
    }

    public static getInstance() {
        if (!this.instance)
            this.instance =  new IaManager();
        return this.instance;
    }

    public newIaForSoloGame(gameId: number) {
        this._ia.set(gameId, new Ia(gameId, this._nextId)); 
        this._nextId--;
    }

    public deleteIaByGameId(gameId: number) {
        this._ia.delete(gameId);
    }

}