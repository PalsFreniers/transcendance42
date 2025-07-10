import * as Vec2D from 'vector2d';

export class Collidable {
  constructor(
    public pos: Vec2D.Vector,
    public points: Vec2D.Vector[],
    public name: string
  ) {}
}

function cloneVector(v: Vec2D.Vector): Vec2D.Vector {
  return new Vec2D.Vector(v.x, v.y);
}

export function createRectangle(pos: Vec2D.Vector, size: Vec2D.Vector, name: string): Collidable {
  const w = size.x;
  const h = size.y;

  const pts = [
    new Vec2D.Vector(pos.x, pos.y),
    new Vec2D.Vector(pos.x + w, pos.y),
    new Vec2D.Vector(pos.x + w, pos.y + h),
    new Vec2D.Vector(pos.x, pos.y + h),
  ];
  return new Collidable(cloneVector(pos), pts, name);
}

