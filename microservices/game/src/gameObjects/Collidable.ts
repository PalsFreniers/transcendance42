import * as Vec2D from "vector2d";

export class Collidable {
    constructor(
        private _pos: Vec2D.AbstractVector,
        private _points: Vec2D.AbstractVector[],
        private _name: string
    ) {};

    get pos(): Vec2D.AbstractVector {
        return this._pos;
    };

    set pos(newPos: Vec2D.AbstractVector) {
        let v = newPos.clone().subtract(this._pos);
        this._points.forEach((point) => {point.add(v)});
    }

    get points(): Vec2D.AbstractVector[] {
        return this._points;
    };

    get name(): String {
        return this._name;
    }

    getPoints(): Vec2D.AbstractVector[] {
        return this._points;
    }

    getPoint(i: number): Vec2D.AbstractVector {
        if (i < 0 || i >= this.points.length)
            throw new Error(`getPoint(): out of bounds (${i})`);
        return this.points[i];
    };

    getEdge(i: number): [Vec2D.AbstractVector, Vec2D.AbstractVector] {
        if (i < 0 || i >= this.getEdges().length)
            throw new Error(`getEdge(): out of bounds (${i})`);
        return this.getEdges()[i];
    };

    getEdges(): [Vec2D.AbstractVector, Vec2D.AbstractVector][] {
        let edges: [Vec2D.AbstractVector, Vec2D.AbstractVector][] = [];
        for (let i = 1; i < this._points.length; ++i)
            edges.push([this._points[i - 1].clone(), this._points[i].clone()]);
        return edges;
    };
}

export function createRectangle(pos: Vec2D.AbstractVector, size: Vec2D.AbstractVector, name: string): Collidable {
    let points: Vec2D.AbstractVector[] = [];
    for (let i = 0; i < 4; i++)
        points.push(pos.clone());
    points[1].add(size.clone().setY(0));
    points[2].add(size.clone());
    points[3].add(size.clone().setX(0));
    return new Collidable(pos, points, name);
}
