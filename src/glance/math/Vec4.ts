import { EPSILON } from "./common.ts";
import { Vec3 } from "./Vec3.ts";
import type { Mat4 } from "./Mat4.ts";

export class Vec4
{
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    // Static methods ----------------------------------------------------------

    /** A Vec4 with x, y, z and w set to zero. */
    public static zero(): Vec4
    {
        return new Vec4(0, 0, 0, 0);
    }

    /** Component-wise initialization. */
    public static of(x: number, y?: number, z?: number, w?: number): Vec4
    {
        return new Vec4(x, y ?? x, z ?? x, w ?? x);
    }

    /** A normalized Vec4 along the positive x-axis. */
    public static xAxis(): Vec4
    {
        return new Vec4(1, 0, 0);
    }

    /** A normalized Vec4 along the positive y-axis. */
    public static yAxis(): Vec4
    {
        return new Vec4(0, 1, 0);
    }

    /** A normalized Vec4 along the positive z-axis. */
    public static zAxis(): Vec4
    {
        return new Vec4(0, 0, 1);
    }

    /** A Vec4 with only the x component set to distance. */
    public static translateX(distance: number): Vec4
    {
        return new Vec4(distance, 0, 0, 1);
    }

    /** A Vec4 with only the y component set to distance. */
    public static translateY(distance: number): Vec4
    {
        return new Vec4(0, distance, 0, 1);
    }

    /** A Vec4 with only the z component set to distance. */
    public static translateZ(distance: number): Vec4
    {
        return new Vec4(0, 0, distance, 1);
    }

    /** A random Vec4 with x, y, z and w in the range [0, 1). */
    public static random(): Vec4
    {
        return new Vec4(Math.random(), Math.random(), Math.random(), Math.random());
    }

    /** A random Vec4 with unit magnitude and w set to 0. */
    public static randomUnit(): Vec4
    {
        let x, y, z: number;
        let mag: number = 0;
        while (1) {
            x = Math.random() * 2 - 1;
            y = Math.random() * 2 - 1;
            z = Math.random() * 2 - 1;
            mag = Math.hypot(x, y, z);
            if (mag > 0) {
                break;
            }
        }
        return new Vec4(x! / mag, y! / mag, z! / mag, 0);
    }

    /** A Vec4 with x, y and z initialized from the given array at the given offset. */
    public static fromArray(array: Array<number>, offset: number = 0): Vec4
    {
        if (array.length < offset + 4) {
            throw new Error(`Cannot create a Vec4 at offset ${offset} in array of length ${array.length}`);
        }
        return new Vec4(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
    }

    // Instance methods --------------------------------------------------------

    /** Defaults to the zero vector. */
    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1)
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /** Get the value of the given component. */
    [index: number]: number;
    get 0(): number { return this.x; }
    set 0(value: number) { this.x = value; }
    get 1(): number { return this.y; }
    set 1(value: number) { this.y = value; }
    get 2(): number { return this.z; }
    set 2(value: number) { this.z = value; }
    get 3(): number { return this.w; }
    set 3(value: number) { this.w = value; }
    get length(): number { return 4; }

    /** Get the xyz part of this Vec4 as a Vec3. */
    public get xyz(): Vec3
    {
        return new Vec3(this.x, this.y, this.z);
    }

    /** Get the value of the given component by index. */
    public getIndex(index: number): number
    {
        switch (index) {
            case 0: return this.x;
            case 1: return this.y;
            case 2: return this.z;
            case 3: return this.w;
            default:
                throw new Error(`Invalid Vec4 index: ${index}`);
        }
    }

    /** Set the value of the given component by index. */
    public setIndex(index: number, value: number): void
    {
        switch (index) {
            case 0: this.x = value; break;
            case 1: this.y = value; break;
            case 2: this.z = value; break;
            case 3: this.w = value; break;
            default:
                throw new Error(`Invalid Vec4 index: ${index}`);
        }
    }

    /** Write this Vec4's x, y and z to the given array at the given offset. */
    public toArray(array: Array<number> | null = null, offset: number = 0): Array<number>
    {
        if (array === null) {
            array = new Array<number>(4);
        }
        array[offset] = this.x;
        array[offset + 1] = this.y;
        array[offset + 2] = this.z;
        array[offset + 3] = this.w;
        return array;
    }

    /** A new Vec4 with values from this one. */
    public clone(): Vec4
    {
        return new Vec4(this.x, this.y, this.z, this.w);
    }

    /** Copy values from another Vec4 into this one. */
    public copy(other: Vec4): Vec4
    {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        this.w = other.w;
        return this;
    }

    /** Tests for equality between this Vec4 and another. */
    public equals(other: Vec4, epsilon: number = EPSILON): boolean
    {
        return (
            Math.abs(this.x - other.x) <= epsilon &&
            Math.abs(this.y - other.y) <= epsilon &&
            Math.abs(this.z - other.z) <= epsilon &&
            Math.abs(this.w - other.w) <= epsilon);
    }

    /** Tests if any component is non-zero. */
    public any(): boolean
    {
        return this.x != 0 || this.y != 0 || this.z != 0 || this.w != 0;
    }

    /**
     * Set this Vec4's x, y, z and w.
     * If only one argument is passed, then x, y and z are updated.
     * If two arguments are passed, x and y are updated and z is set to 0.
     * w is set to 1 if not passed explicitly.
     */
    public set(x: number, y?: number, z?: number, w?: number): Vec4
    {
        this.x = x;
        this.y = y ?? x;
        this.z = z ?? (y === undefined ? x : 0);
        this.w = w ?? 1;
        return this;
    }

    /** Adds this and other to create a new Vec4. */
    public add(other: Vec4 | number): Vec4
    {
        if (typeof other === "number") {
            return new Vec4(this.x + other, this.y + other, this.z + other, this.w + other);
        } else {
            return new Vec4(this.x + other.x, this.y + other.y, this.z + other.z, this.w + other.w);
        }
    }

    /** Subtract other from this to create a new Vec4. */
    public sub(other: Vec4 | number): Vec4
    {
        if (typeof other === "number") {
            return new Vec4(this.x - other, this.y - other, this.z - other, this.w - other);
        } else {
            return new Vec4(this.x - other.x, this.y - other.y, this.z - other.z, this.w - other.w);
        }
    }

    /** Component-wise multiplication of this and other to create a new Vec4. */
    public mul(other: Vec4 | number): Vec4
    {
        if (typeof other === "number") {
            return new Vec4(this.x * other, this.y * other, this.z * other, this.w * other);
        } else {
            return new Vec4(this.x * other.x, this.y * other.y, this.z * other.z, this.w * other.w);
        }
    }

    /** Component-wise division of this by b to create a new Vec4. */
    public div(other: Vec4 | number): Vec4
    {
        if (typeof other === "number") {
            return new Vec4(this.x / other, this.y / other, this.z / other, this.w / other);
        } else {
            return new Vec4(this.x / other.x, this.y / other.y, this.z / other.z, this.w / other.w);
        }
    }

    /** Component-wise multiplication with -1. */
    public negate(): Vec4
    {
        return new Vec4(-this.x, -this.y, -this.z, -this.w);
    }

    /** Component-wise inversion (1/x). Zero division is handled as 0 */
    public invert(): Vec4
    {
        return new Vec4(
            this.x == 0 ? 0 : 1 / this.x,
            this.y == 0 ? 0 : 1 / this.y,
            this.z == 0 ? 0 : 1 / this.z,
            this.w == 0 ? 0 : 1 / this.w
        );
    }

    /** Component-wise modulo of this by other. */
    public mod(other: Vec4 | number): Vec4
    {
        if (typeof other === 'number') {
            return new Vec4(this.x % other, this.y % other, this.z % other, this.w % other);
        } else {
            return new Vec4(this.x % other.x, this.y % other.y, this.z % other.z, this.w % other.w);
        }
    }

    /** Linear interpolation between this and other. */
    public lerp(other: Vec4, t: number): Vec4
    {
        return new Vec4(
            this.x + (other.x - this.x) * t,
            this.y + (other.y - this.y) * t,
            this.z + (other.z - this.z) * t,
            this.w + (other.w - this.w) * t
        );
    }

    /** Dot product of this and other. */
    public dot(other: Vec4): number
    {
        return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
    }

    /** Squared magnitude of this. */
    public magSq(): number
    {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }

    /** Magnitude (length) of this. */
    public magnitude(): number
    {
        return Math.hypot(this.x, this.y, this.z, this.w);
    }

    /** Manhattan length of this. */
    public manhattanLength(): number
    {
        return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
    }

    /**
     * Normalize this.
     * Unlike a Vec3 normalization, this just ensures that w is 1 (homogeneous coordinates).
    */
    public normalize(): Vec4
    {
        if (this.w !== 0) {
            return new Vec4(this.x / this.w, this.y / this.w, this.z / this.w, 1);
        } else {
            return new Vec4(this.x, this.y, this.z, this.w);
        }
    }

    /** Component-wise min of this and other. */
    public min(other: Vec4 | number): Vec4
    {
        if (typeof other === "number") {
            return new Vec4(
                Math.min(this.x, other),
                Math.min(this.y, other),
                Math.min(this.z, other),
                Math.min(this.w, other)
            );
        } else {
            return new Vec4(
                Math.min(this.x, other.x),
                Math.min(this.y, other.y),
                Math.min(this.z, other.z),
                Math.min(this.w, other.w)
            );
        }
    }

    /** Component-wise max of this and other. */
    public max(other: Vec4 | number): Vec4
    {
        if (typeof other === "number") {
            return new Vec4(
                Math.max(this.x, other),
                Math.max(this.y, other),
                Math.max(this.z, other),
                Math.max(this.w, other)
            );
        } else {
            return new Vec4(
                Math.max(this.x, other.x),
                Math.max(this.y, other.y),
                Math.max(this.z, other.z),
                Math.max(this.w, other.w)
            );
        }
    }

    /** Component-wise clamp of this between min and max. */
    public clamp(min: Vec4 | number, max: Vec4 | number): Vec4
    {
        const minX = typeof min === "number" ? min : min.x;
        const maxX = typeof max === "number" ? max : max.x;
        const minY = typeof min === "number" ? min : min.y;
        const maxY = typeof max === "number" ? max : max.y;
        const minZ = typeof min === "number" ? min : min.z;
        const maxZ = typeof max === "number" ? max : max.z;
        const minW = typeof min === "number" ? min : min.w;
        const maxW = typeof max === "number" ? max : max.w;
        return new Vec4(
            Math.max(minX, Math.min(maxX, this.x)),
            Math.max(minY, Math.min(maxY, this.y)),
            Math.max(minZ, Math.min(maxZ, this.z)),
            Math.max(minW, Math.min(maxW, this.w))
        );
    }

    /** Component-wise absolute value. */
    public abs(): Vec4
    {
        return new Vec4(
            Math.abs(this.x),
            Math.abs(this.y),
            Math.abs(this.z),
            Math.abs(this.w)
        );
    }

    /** Component-wise absolute (floored) value. */
    public floor(): Vec4
    {
        return new Vec4(
            Math.floor(this.x),
            Math.floor(this.y),
            Math.floor(this.z),
            Math.floor(this.w)
        );
    }

    /** Component-wise absolute (ceiled) value. */
    public ceil(): Vec4
    {
        return new Vec4(
            Math.ceil(this.x),
            Math.ceil(this.y),
            Math.ceil(this.z),
            Math.ceil(this.w)
        );
    }

    /** Component-wise absolute (rounded) value. */
    public round(): Vec4
    {
        return new Vec4(
            Math.round(this.x),
            Math.round(this.y),
            Math.round(this.z),
            Math.round(this.w)
        );
    }

    /** Component-wise absolute (truncated) value. */
    public trunc(): Vec4
    {
        return new Vec4(
            Math.trunc(this.x),
            Math.trunc(this.y),
            Math.trunc(this.z),
            Math.trunc(this.w)
        );
    }

    /** Transform this Vec3 with the given Mat4. */
    public applyMat4(m: Mat4): Vec4
    {
        const x = this.x, y = this.y, z = this.z, w = this.w;
        return new Vec4(
            x * m.a + y * m.e + z * m.i + w * m.m,
            x * m.b + y * m.f + z * m.j + w * m.n,
            x * m.c + y * m.g + z * m.k + w * m.o,
            x * m.d + y * m.h + z * m.l + w * m.p
        );
    }

    /** Allows the use of Vec4 in a for-of loop. */
    *[Symbol.iterator](): Generator<number, void, unknown>
    {
        yield this.x;
        yield this.y;
        yield this.z;
        yield this.w;
    }
}


/**
 * This is used to identify Vec4 objects in the code.
 * It is stored as a property on the prototype so that does not take up
 * any space in the actual object, but one can still access it.
 */
(Vec4.prototype as any).isVec4 = true;


/**
 * This is to identify any glance math primitive in the code.
 */
(Vec4.prototype as any).isMathPrimitive = true;
