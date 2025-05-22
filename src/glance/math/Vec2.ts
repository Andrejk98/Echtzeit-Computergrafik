import { EPSILON } from "./common.ts";
import type { Mat3 } from "./Mat3.ts";

export class Vec2
{
    public x: number;
    public y: number;

    // Static methods ----------------------------------------------------------

    /** A Vec2 with x and y set to 0. */
    public static zero(): Vec2
    {
        return new Vec2(0, 0);
    }

    /** Component-wise initialization. */
    public static of(x: number, y?: number): Vec2
    {
        return new Vec2(x, y ?? x);
    }

    /** A normalized Vec2 along the positive x-axis. */
    public static xAxis(): Vec2
    {
        return new Vec2(1, 0);
    }

    /** A normalized Vec2 along the positive y-axis. */
    public static yAxis(): Vec2
    {
        return new Vec2(0, 1);
    }

    /** A Vec3 with only the x component set to distance. */
    public static translateX(distance: number): Vec2
    {
        return new Vec2(distance, 0);
    }

    /** A Vec2 with only the y component set to distance. */
    public static translateY(distance: number): Vec2
    {
        return new Vec2(0, distance);
    }

    /** A random Vec2 with x and y in the range [0, 1). */
    public static random(): Vec2
    {
        return new Vec2(Math.random(), Math.random());
    }

    /** A random Vec2 with unit magnitude. */
    public static randomUnit(): Vec2
    {
        let x, y: number;
        let mag: number = 0;
        while (1) {
            x = Math.random() * 2 - 1;
            y = Math.random() * 2 - 1;
            mag = Math.hypot(x, y);
            if (mag > 0) {
                break;
            }
        }
        return new Vec2(x! / mag, y! / mag);
    }

    /** A Vec2 with x and y initialized from the given array at the given offset. */
    public static fromArray(array: Array<number>, offset: number = 0): Vec2
    {
        if (array.length < offset + 2) {
            throw new Error(`Cannot create a Vec2 at offset ${offset} in array of length ${array.length}`);
        }
        return new Vec2(array[offset], array[offset + 1]);
    }

    // Instance methods --------------------------------------------------------

    /** Defaults to the zero vector. */
    constructor(x: number = 0, y: number = 0)
    {
        this.x = x;
        this.y = y;
    }

    /** Get the x or y component by index. */
    [index: number]: number;
    get 0(): number { return this.x; }
    set 0(value: number) { this.x = value; }
    get 1(): number { return this.y; }
    set 1(value: number) { this.y = value; }
    get length(): number { return 2; }

    /** Alternative names for the components */
    get width(): number { return this.x; }
    set width(value: number) { this.x = value; }
    get height(): number { return this.y; }
    set height(value: number) { this.y = value; }
    get ratio(): number { return this.y === 0 ? 0 : this.x / this.y; }

    get u(): number { return this.x; }
    set u(value: number) { this.x = value; }
    get v(): number { return this.y; }
    set v(value: number) { this.y = value; }

    /** Get the value of the given component by index. */
    public getIndex(index: number): number
    {
        switch (index) {
            case 0: return this.x;
            case 1: return this.y;
            default:
                throw new Error(`Invalid Vec2 index: ${index}`);
        }
    }

    /** Set the value of the given component by index. */
    public setIndex(index: number, value: number): void
    {
        switch (index) {
            case 0: this.x = value; break;
            case 1: this.y = value; break;
            default:
                throw new Error(`Invalid Vec2 index: ${index}`);
        }
    }

    /** Write this Vec2's x and y to the given array at the given offset. */
    public toArray(array: Array<number> | null = null, offset: number = 0): Array<number>
    {
        if (array === null) {
            array = new Array<number>(2);
        }
        array[offset] = this.x;
        array[offset + 1] = this.y;
        return array;
    }

    /** A new Vec2 with values from this one. */
    public clone(): Vec2
    {
        return new Vec2(this.x, this.y);
    }

    /** Copy values from another Vec2 into this one. */
    public copy(other: Vec2): Vec2
    {
        this.x = other.x;
        this.y = other.y;
        return this;
    }

    /** Tests for equality between this Vec2 and another. */
    public equals(other: Vec2, epsilon: number = EPSILON): boolean
    {
        return (
            Math.abs(this.x - other.x) <= epsilon &&
            Math.abs(this.y - other.y) <= epsilon);
    }

    /** Tests if any component is non-zero. */
    public any(): boolean
    {
        return this.x != 0 || this.y != 0;
    }

    /**
     * Set this Vec2's x and y.
     * If y is not given, both x and y will be set to x.
     */
    public set(x: number, y?: number): Vec2
    {
        this.x = x;
        this.y = y ?? x;
        return this;
    }

    /** Adds this and other to create a new Vec2. */
    public add(other: number | Vec2): Vec2
    {
        if (typeof other === 'number') {
            return new Vec2(this.x + other, this.y + other);
        } else {
            return new Vec2(this.x + other.x, this.y + other.y);
        }
    }

    /** Subtract other from this to create a new Vec2. */
    public sub(other: Vec2 | number): Vec2
    {
        if (typeof other === 'number') {
            return new Vec2(this.x - other, this.y - other);
        } else {
            return new Vec2(this.x - other.x, this.y - other.y);
        }
    }

    /** Component-wise multiplication of this and other to create a new Vec2. */
    public mul(other: Vec2 | number): Vec2
    {
        if (typeof other === 'number') {
            return new Vec2(this.x * other, this.y * other);
        } else {
            return new Vec2(this.x * other.x, this.y * other.y);
        }
    }

    /** Component-wise division of this by b to create a new Vec2. */
    public div(other: Vec2 | number): Vec2
    {
        if (typeof other === 'number') {
            return new Vec2(this.x / other, this.y / other);
        } else {
            return new Vec2(this.x / other.x, this.y / other.y);
        };
    }

    /** Component-wise multiplication with -1. */
    public negate(): Vec2
    {
        return new Vec2(-this.x, -this.y);
    }

    /** Component-wise inversion (1/x). Zero division is handled as 0 */
    public invert(): Vec2
    {
        return new Vec2(
            this.x == 0 ? 0 : 1 / this.x,
            this.y == 0 ? 0 : 1 / this.y
        );
    }

    /** Component-wise modulo of this by other. */
    public mod(other: Vec2 | number): Vec2
    {
        if (typeof other === 'number') {
            return new Vec2(this.x % other, this.y % other);
        } else {
            return new Vec2(this.x % other.x, this.y % other.y);
        };
    }

    /** Linear interpolation between this and other. */
    public lerp(other: Vec2, t: number): Vec2
    {
        return new Vec2(
            this.x + (other.x - this.x) * t,
            this.y + (other.y - this.y) * t
        );
    }

    /** Dot product of this and other. */
    public dot(other: Vec2): number
    {
        return this.x * other.x + this.y * other.y;
    }

    /** Cross product of this and other. */
    public cross(other: Vec2): number
    {
        return this.x * other.y - this.y * other.x;
    }

    /** Squared magnitude of this vector. */
    public magSq(): number
    {
        return this.x * this.x + this.y * this.y;
    }

    /** Magnitude (length) of this vector. */
    public magnitude(): number
    {
        return Math.hypot(this.x, this.y);
    }

    /** Manhattan length of this vector. */
    public manhattanLength(): number
    {
        return Math.abs(this.x) + Math.abs(this.y);
    }

    /** Normalize this vector. */
    public normalize(): Vec2
    {
        const magSq = this.x * this.x + this.y * this.y;
        if (magSq > 0) {
            const invMag = 1 / Math.sqrt(magSq);
            return new Vec2(this.x * invMag, this.y * invMag);
        }
        return new Vec2(0, 0);
    }

    /** Distance from this to other. */
    public distanceTo(other: Vec2): number
    {
        return Math.hypot(this.x - other.x, this.y - other.y);
    }

    /** Squared distance from this to other. */
    public distanceToSq(other: Vec2): number
    {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return dx * dx + dy * dy;
    }

    /** Manhattan distance from this to other. */
    public manhattanDistanceTo(other: Vec2): number
    {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y);
    }

    /** Component-wise min of this and other. */
    public min(other: Vec2 | number): Vec2
    {
        if (typeof other === 'number') {
            return new Vec2(Math.min(this.x, other), Math.min(this.y, other));
        } else {
            return new Vec2(Math.min(this.x, other.x), Math.min(this.y, other.y));
        }
    }

    /** Component-wise max of this and other. */
    public max(other: Vec2 | number): Vec2
    {
        if (typeof other === 'number') {
            return new Vec2(Math.max(this.x, other), Math.max(this.y, other));
        } else {
            return new Vec2(Math.max(this.x, other.x), Math.max(this.y, other.y));
        };
    }

    /** Component-wise clamp of this between min and max. */
    public clamp(min: Vec2 | number, max: Vec2 | number): Vec2
    {
        const minX = typeof min === 'number' ? min : min.x;
        const minY = typeof min === 'number' ? min : min.y;
        const maxX = typeof max === 'number' ? max : max.x;
        const maxY = typeof max === 'number' ? max : max.y;
        return new Vec2(
            Math.max(minX, Math.min(maxX, this.x)),
            Math.max(minY, Math.min(maxY, this.y))
        );
    }

    /** Clamp the magnitude of this between min and max. */
    public clampMagnitude(min: number, max: number): Vec2
    {
        const magSq = this.x * this.x + this.y * this.y;
        if (magSq > 0) {
            const mag = Math.sqrt(magSq);
            const factor = Math.max(min, Math.min(max, mag)) / mag;
            return new Vec2(this.x * factor, this.y * factor);
        }
        return new Vec2(0, 0);
    }

    /** Component-wise absolute value. */
    public abs(): Vec2
    {
        return new Vec2(Math.abs(this.x), Math.abs(this.y));
    }

    /** Component-wise absolute (floored) value. */
    public floor(): Vec2
    {
        return new Vec2(Math.floor(this.x), Math.floor(this.y));
    }

    /** Component-wise absolute (ceiled) value. */
    public ceil(): Vec2
    {
        return new Vec2(Math.ceil(this.x), Math.ceil(this.y));
    }

    /** Component-wise absolute (rounded) value. */
    public round(): Vec2
    {
        return new Vec2(Math.round(this.x), Math.round(this.y));
    }

    /** Component-wise absolute (truncated) value. */
    public trunc(): Vec2
    {
        return new Vec2(Math.trunc(this.x), Math.trunc(this.y));
    }

    /** Angle of this Vec2 to the positive x-axis in radians. */
    public angle(): number
    {
        return Math.atan2(this.y, this.x);
    }

    /** Angle between this Vec2 and other in radians. */
    public angleTo(other: Vec2): number
    {
        return Math.atan2(
            this.x * other.y - this.y * other.x, // this.cross(other)
            this.x * other.x + this.y * other.y  // this.dot(other)
        );
    }

    /** Translate this Vec2 along the positive x-axis by the given distance. */
    public translateX(distance: number): Vec2
    {
        return new Vec2(this.x + distance, this.y);
    }

    /** Translate this Vec2 along the positive y-axis by the given distance. */
    public translateY(distance: number): Vec2
    {
        return new Vec2(this.x, this.y + distance);
    }

    /** Rotate this Vec2 by the given angle in radians around the origin. */
    public rotate(angle: number): Vec2
    {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vec2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    /** Rotate this Vec2 by the given angle in radians around the given pivot. */
    public rotateAround(angle: number, pivot: Vec2): Vec2
    {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x - pivot.x;
        const y = this.y - pivot.y;
        return new Vec2(
            x * cos - y * sin + pivot.x,
            x * sin + y * cos + pivot.y
        );
    }

    /** Transform this Vec2 by the given Mat3. */
    public applyMat3(mat: Mat3): Vec2
    {
        const x = this.x;
        const y = this.y;
        return new Vec2(
            x * mat.a + y * mat.d + mat.g,
            x * mat.b + y * mat.e + mat.h
        );
    }

    /** Allows the use of Vec2 in a for-of loop. */
    *[Symbol.iterator](): Generator<number, void, unknown>
    {
        yield this.x;
        yield this.y;
    }
}

/**
 * This is used to identify Vec2 objects in the code.
 * It is stored as a property on the prototype so that does not take up
 * any space in the actual object, but one can still access it.
 */
(Vec2.prototype as any).isVec2 = true;

/**
 * This is to identify any glance math primitive in the code.
 */
(Vec2.prototype as any).isMathPrimitive = true;
