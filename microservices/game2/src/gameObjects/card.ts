export class Card {
    private _number: number; // 0 - 9
    private _id: number; // 0 - 3

    constructor(id :number, num :number, ) {
        this._id = id;
        this._number = num;
    };

    public getType():number {
        return this._id;
    }

    public getNumber() {
        return this._number;
    }
}