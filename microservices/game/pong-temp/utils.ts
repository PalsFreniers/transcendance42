import * as Vec2D from "vector2d"

export function clamp(num: number, min: number, max: number) {
    return Math.max(min, Math.min(num, max));
}