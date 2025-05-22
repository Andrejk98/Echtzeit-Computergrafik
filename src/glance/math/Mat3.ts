import { EPSILON } from "./common.ts";
import type { Vec2 } from "./Vec2.ts";
import { Mat4 } from "./Mat4.ts";

/**
 * A 3x3 matrix.
 * The matrix is stored in column-major order:
 *  | a d g |
 *  | b e h |
 *  | c f i |
 */
export class Mat3
{
    // Amazingly, this is faster than using an Array or a Float32Array.
    public a: number; public b: number; public c: number;
    public d: number; public e: number; public f: number;
    public g: number; public h: number; public i: number;

    // Static methods ----------------------------------------------------------

    /** Component-wise initialization. */
    public static of(
        a: number, b: number, c: number,
        d: number, e: number, f: number,
        g: number, h: number, i: number
    ): Mat3
    {
        return new Mat3(a, b, c, d, e, f, g, h, i);
    }

    /** The identity matrix. */
    public static identity(): Mat3
    {
        return new Mat3();
    }

    /** A 2D translation matrix with the given Vec2. */
    public static translate(v: Vec2): Mat3
    {
        return new Mat3(
            1, 0, 0,
            0, 1, 0,
            v.x, v.y, 1,
        );
    }

    /** A 2D translation matrix with the given distance along the x-axis. */
    public static translateX(delta: number): Mat3
    {
        return new Mat3(
            1, 0, 0,
            0, 1, 0,
            delta, 0, 1,
        );
    }

    /** A 2D translation matrix with the given distance along the y-axis. */
    public static translateY(delta: number): Mat3
    {
        return new Mat3(
            1, 0, 0,
            0, 1, 0,
            0, delta, 1,
        );
    }

    /** A 2D rotation matrix around the origin in radians. */
    public static rotate(angle: number): Mat3
    {
        const s = Math.sin(angle), c = Math.cos(angle);
        return new Mat3(
            c, s, 0,
            -s, c, 0,
            0, 0, 1);
    }

    /** A 2D scale matrix with the given Vec2. */
    public static scale(v: Vec2 | number, y?: number): Mat3
    {
        if (typeof v === "number") {
            if (y === undefined) {
                return new Mat3(
                    v, 0, 0,
                    0, v, 0,
                    0, 0, 1,
                );
            } else {
                return new Mat3(
                    v, 0, 0,
                    0, y, 0,
                    0, 0, 1,
                );
            }
        } else {
            return new Mat3(
                v.x, 0, 0,
                0, v.y, 0,
                0, 0, 1,
            );
        }
    }

    /** 2D Scaling of this Mat3 by the given factor along the x-axis. */
    public static scaleX(x: number): Mat3
    {
        return new Mat3(
            x, 0, 0,
            0, 1, 0,
            0, 0, 1,
        );
    }

    /** 2D Scaling of this Mat3 by the given factor along the y-axis. */
    public static scaleY(y: number): Mat3
    {
        return new Mat3(
            1, 0, 0,
            0, y, 0,
            0, 0, 1,
        );
    }

    /** A Mat3 with all elements set to a random value in the range [0, 1). */
    public static random()
    {
        return new Mat3(
            Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(),
        );
    }

    /** A new Matrix with components initialized from the given array at the given offset. */
    public static fromArray(array: Array<number>, offset: number = 0): Mat3
    {
        if (array.length < offset + 9) {
            throw new Error(`Cannot create a Mat3 at offset ${offset} in array of length ${array.length}`);
        }
        return new Mat3(
            array[offset + 0], array[offset + 1], array[offset + 2],
            array[offset + 3], array[offset + 4], array[offset + 5],
            array[offset + 6], array[offset + 7], array[offset + 8]);
    }

    /** A Mat3 from the top-left 3x3 submatrix of the given Mat4. */
    public static fromMat4(m: Mat4): Mat3
    {
        return new Mat3(
            m.a, m.b, m.c,
            m.e, m.f, m.g,
            m.i, m.j, m.k,
        );
    }

    /** A 2D projection matrix with the given bounds. */
    public static projection(width: number, height: number): Mat3
    {
        return new Mat3(
            2 / width, 0, 0,
            0, -2 / height, 0,
            -1, 1, 1
        );
    }

    /**
     * The Normal matrix (invert + transpose) of the given Mat4.
     * If the transformation does not include any non-uniform scaling, then
     * the normal matrix is the same as the top-left 3x3 submatrix of the Mat4.
     */
    public static normalMatrixOf(m: Mat4): Mat3 | null
    {
        const a00 = m.a, a01 = m.b, a02 = m.c;
        const a10 = m.e, a11 = m.f, a12 = m.g;
        const a20 = m.i, a21 = m.j, a22 = m.k;
        const b01 = a22 * a11 - a12 * a21;
        const b11 = -a22 * a10 + a12 * a20;
        const b21 = a21 * a10 - a11 * a20;
        let det = a00 * b01 + a01 * b11 + a02 * b21;
        if (!det) {
            return null;
        }
        det = 1 / det;
        return new Mat3(
            b01 * det,
            b11 * det,
            b21 * det,
            (-a22 * a01 + a02 * a21) * det,
            (a22 * a00 - a02 * a20) * det,
            (-a21 * a00 + a01 * a20) * det,
            (a12 * a01 - a02 * a11) * det,
            (-a12 * a00 + a02 * a10) * det,
            (a11 * a00 - a01 * a10) * det,
        );

    }

    // Instance methods --------------------------------------------------------

    /** Defaults to the identity matrix. */
    constructor(
        a: number = 1, b: number = 0, c: number = 0,
        d: number = 0, e: number = 1, f: number = 0,
        g: number = 0, h: number = 0, i: number = 1,
    )
    {
        this.a = a; this.b = b; this.c = c;
        this.d = d; this.e = e; this.f = f;
        this.g = g; this.h = h; this.i = i;
    }

    /** Get the value of the given component. */
    [index: number]: number;
    get 0(): number { return this.a; }
    get 1(): number { return this.b; }
    get 2(): number { return this.c; }
    get 3(): number { return this.d; }
    get 4(): number { return this.e; }
    get 5(): number { return this.f; }
    get 6(): number { return this.g; }
    get 7(): number { return this.h; }
    get 8(): number { return this.i; }
    get length(): number { return 9; }

    /**
     * Returns a string representation of this matrix.

     * Mat3 | a d g |
     *      | b e h |
     *      | c f i |
     */
    public toString(): string
    {
        return `Mat3 | ${this.a} ${this.b} ${this.c} |\n`
            + `     | ${this.d} ${this.e} ${this.f} |\n`
            + `     | ${this.g} ${this.h} ${this.i} |`;
    }

    /** Write this Mat3 to the given array at the given offset. */
    public toArray(array: Array<number> | null = null, offset: number = 0): Array<number>
    {
        if (array === null) {
            array = new Array<number>(9);
        }
        array[offset + 0] = this.a;
        array[offset + 1] = this.b;
        array[offset + 2] = this.c;
        array[offset + 3] = this.d;
        array[offset + 4] = this.e;
        array[offset + 5] = this.f;
        array[offset + 6] = this.g;
        array[offset + 7] = this.h;
        array[offset + 8] = this.i;
        return array;
    }

    /** A new Mat3 with the same elements as this one. */
    public clone(): Mat3
    {
        return new Mat3(
            this.a, this.b, this.c,
            this.d, this.e, this.f,
            this.g, this.h, this.i,
        );
    }

    /** Copy the elements of the given Mat3 into this one. */
    public copy(m: Mat3): Mat3
    {
        this.a = m.a; this.b = m.b; this.c = m.c;
        this.d = m.d; this.e = m.e; this.f = m.f;
        this.g = m.g; this.h = m.h; this.i = m.i;
        return this;
    }

    /** Tests for equality between this Mat3 and another. */
    public equals(other: Mat3, epsilon: number = EPSILON): boolean
    {
        return (
            Math.abs(this.a - other.a) <= epsilon &&
            Math.abs(this.b - other.b) <= epsilon &&
            Math.abs(this.c - other.c) <= epsilon &&
            Math.abs(this.d - other.d) <= epsilon &&
            Math.abs(this.e - other.e) <= epsilon &&
            Math.abs(this.f - other.f) <= epsilon &&
            Math.abs(this.g - other.g) <= epsilon &&
            Math.abs(this.h - other.h) <= epsilon &&
            Math.abs(this.i - other.i) <= epsilon
        );
    }

    /** Create the transpose of this Mat3. */
    public transpose(): Mat3
    {
        return new Mat3(
            this.a, this.d, this.g,
            this.b, this.e, this.h,
            this.c, this.f, this.i,
        );
    }

    /** Create the inverse of this Mat3. */
    public invert(): Mat3 | null
    {
        const b01 = this.i * this.e - this.f * this.h;
        const b11 = -this.i * this.d + this.f * this.g;
        const b21 = this.h * this.d - this.e * this.g;
        let det = this.a * b01 + this.b * b11 + this.c * b21;
        if (!det) {
            return null;
        }
        det = 1 / det;
        return new Mat3(
            b01 * det,
            (-this.i * this.b + this.c * this.h) * det,
            (this.f * this.b - this.c * this.e) * det,
            b11 * det,
            (this.i * this.a - this.c * this.g) * det,
            (-this.f * this.a + this.c * this.d) * det,
            b21 * det,
            (-this.h * this.a + this.b * this.g) * det,
            (this.e * this.a - this.b * this.d) * det,
        );
    }

    /** Create the adjoint of this Mat3. */
    public adjoint(): Mat3
    {
        return new Mat3(
            this.e * this.i - this.f * this.h,
            this.c * this.h - this.b * this.i,
            this.b * this.f - this.c * this.e,
            this.f * this.g - this.d * this.i,
            this.a * this.i - this.c * this.g,
            this.c * this.d - this.a * this.f,
            this.d * this.h - this.e * this.g,
            this.b * this.g - this.a * this.h,
            this.a * this.e - this.b * this.d,
        );
    }

    /** The determinant of this Mat3. */
    public determinant(): number
    {
        return this.a * (this.i * this.e - this.f * this.h)
            + this.b * (-this.i * this.d + this.f * this.g)
            + this.c * (this.h * this.d - this.e * this.g);
    }

    /** Matrix multiplication of this Mat3 with another Mat3. */
    public mul(other: Mat3): Mat3
    {
        return new Mat3(
            this.a * other.a + this.d * other.b + this.g * other.c,
            this.b * other.a + this.e * other.b + this.h * other.c,
            this.c * other.a + this.f * other.b + this.i * other.c,
            this.a * other.d + this.d * other.e + this.g * other.f,
            this.b * other.d + this.e * other.e + this.h * other.f,
            this.c * other.d + this.f * other.e + this.i * other.f,
            this.a * other.g + this.d * other.h + this.g * other.i,
            this.b * other.g + this.e * other.h + this.h * other.i,
            this.c * other.g + this.f * other.h + this.i * other.i,
        );
    }

    /** Reverse multiplication of this Mat3 with another Mat3. */
    public premul(other: Mat3): Mat3
    {
        return new Mat3(
            other.a * this.a + other.d * this.b + other.g * this.c,
            other.b * this.a + other.e * this.b + other.h * this.c,
            other.c * this.a + other.f * this.b + other.i * this.c,
            other.a * this.d + other.d * this.e + other.g * this.f,
            other.b * this.d + other.e * this.e + other.h * this.f,
            other.c * this.d + other.f * this.e + other.i * this.f,
            other.a * this.g + other.d * this.h + other.g * this.i,
            other.b * this.g + other.e * this.h + other.h * this.i,
            other.c * this.g + other.f * this.h + other.i * this.i,
        );
    }

    /** 2D Translation of this Mat3 by the given Vec2. */
    public translate(vec: Vec2 | number, y?: number): Mat3
    {
        let x: number;
        if (typeof vec === "number") {
            x = vec;
            y = y ?? 0;
        }
        else {
            x = vec.x;
            y = vec.y;
        }
        return new Mat3(
            this.a, this.b, this.c,
            this.d, this.e, this.f,
            this.g + this.a * x + this.d * y,
            this.h + this.b * x + this.e * y,
            this.i + this.c * x + this.f * y,
        );
    }

    /** 2D Translation of this Mat3 by the given distance along the x-axis. */
    public translateX(delta: number): Mat3
    {
        return new Mat3(
            this.a, this.b, this.c,
            this.d, this.e, this.f,
            this.g + this.a * delta,
            this.h + this.b * delta,
            this.i + this.c * delta,
        );
    }

    /** 2D Translation of this Mat3 by the given distance along the y-axis. */
    public translateY(delta: number): Mat3
    {
        return new Mat3(
            this.a, this.b, this.c,
            this.d, this.e, this.f,
            this.g + this.d * delta,
            this.h + this.e * delta,
            this.i + this.f * delta,
        );
    }

    /** 2D Rotation of this Mat3 around the origin by the given angle in radians. */
    public rotate(angle: number): Mat3
    {
        const s = Math.sin(angle), c = Math.cos(angle);
        return new Mat3(
            c * this.a + s * this.d,
            c * this.b + s * this.e,
            c * this.c + s * this.f,
            c * this.d - s * this.a,
            c * this.e - s * this.b,
            c * this.f - s * this.c,
            this.g, this.h, this.i,
        );
    }

    /** 2D Scaling of this Mat3 by the given Vec2. */
    public scale(vec: Vec2 | number, y?: number): Mat3
    {
        let x: number;
        if (typeof vec === "number") {
            x = vec;
            y = y ?? x;
        }
        else {
            x = vec.x;
            y = vec.y;
        }
        return new Mat3(
            this.a * x, this.b * x, this.c * x,
            this.d * y, this.e * y, this.f * y,
            this.g, this.h, this.i,
        );
    }

    /** 2D Scaling of this Mat3 by the given factor along the x-axis. */
    public scaleX(x: number): Mat3
    {
        return new Mat3(
            this.a * x, this.b * x, this.c * x,
            this.d, this.e, this.f,
            this.g, this.h, this.i,
        );
    }

    /** 2D Scaling of this Mat3 by the given factor along the y-axis. */
    public scaleY(y: number): Mat3
    {
        return new Mat3(
            this.a, this.b, this.c,
            this.d * y, this.e * y, this.f * y,
            this.g, this.h, this.i,
        );
    }

    /** Allows the use of Mat3 in a for-of loop. */
    *[Symbol.iterator](): Generator<number, void, unknown>
    {
        yield this.a; yield this.b; yield this.c;
        yield this.d; yield this.e; yield this.f;
        yield this.g; yield this.h; yield this.i;
    }
}

/**
 * This is used to identify Mat3 objects in the code.
 * It is stored as a property on the prototype so that does not take up
 * any space in the actual object, but one can still access it.
 */
(Mat3.prototype as any).isMat3 = true;

/**
 * This is to identify any glance math primitive in the code.
 */
(Mat3.prototype as any).isMathPrimitive = true;
