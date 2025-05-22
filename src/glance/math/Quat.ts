import { EPSILON } from "./common.ts";
import type { Vec3 } from "./Vec3.ts";
import type { Mat3 } from "./Mat3.ts";

export class Quat
{
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    // Static methods ----------------------------------------------------------

    /** The identity Quat. */
    public static identity(): Quat
    {
        return new Quat(0, 0, 0, 1);
    }

    /** A random unit Quat. */
    public static random(): Quat
    {
        // Implementation of http://planning.cs.uiuc.edu/node198.html
        // adapted for xyzw order instead of wxyz.
        const u1 = Math.random();
        const u2 = Math.random() * 2 * Math.PI;
        const u3 = Math.random() * 2 * Math.PI;
        const sqrt1MinusU1 = Math.sqrt(1 - u1);
        const sqrtU1 = Math.sqrt(u1);
        return new Quat(
            sqrt1MinusU1 * Math.cos(u2),
            sqrtU1 * Math.sin(u3),
            sqrtU1 * Math.cos(u3),
            sqrt1MinusU1 * Math.sin(u2),
        );
    }

    /** A new Quat with x, y, z and w initialized from the given array at the given offset. */
    public static fromArray(array: Array<number>, offset: number = 0): Quat
    {
        if (array.length < offset + 4) {
            throw new Error(`Cannot create a Quat at offset ${offset} in array of length ${array.length}`);
        }
        return new Quat(array[offset], array[offset + 1], array[offset + 2], array[offset + 3]);
    }

    /** A new Quat from an axis-angle rotation. */
    public static fromAxisAngle(axis: Vec3, angle: number): Quat
    {
        const halfAngle = angle / 2;
        const s = Math.sin(halfAngle);
        return new Quat(axis.x * s, axis.y * s, axis.z * s, Math.cos(halfAngle));
    }

    public static fromMat3(mat: Mat3): Quat
    {
        // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
        // article "Quaternion Calculus and Fast Animation".
        const
            m00 = mat.a, m10 = mat.d, m20 = mat.g,
            m01 = mat.b, m11 = mat.e, m21 = mat.h,
            m02 = mat.c, m12 = mat.f, m22 = mat.i;
        const trace = m00 + m11 + m22;
        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            return new Quat(
                (m12 - m21) * s,
                (m20 - m02) * s,
                (m01 - m10) * s,
                0.25 / s,
            );
        } else if (m00 > m11 && m00 > m22) {
            const s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22);
            return new Quat(
                0.25 * s,
                (m10 + m01) / s,
                (m20 + m02) / s,
                (m12 - m21) / s,
            );
        } else if (m11 > m22) {
            const s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22);
            return new Quat(
                (m10 + m01) / s,
                0.25 * s,
                (m21 + m12) / s,
                (m20 - m02) / s,
            );
        } else {
            const s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11);
            return new Quat(
                (m20 + m02) / s,
                (m21 + m12) / s,
                0.25 * s,
                (m01 - m10) / s,
            );
        }
    }

    /** A new Quat representing the shortest rotation from one unit vector to another. */
    public static fromDirections(from: Vec3, to: Vec3): Quat
    {
        const r = from.dot(to) + 1;
        if (r < EPSILON) {
            if (Math.abs(from.x) > Math.abs(from.z)) {
                const mag = Math.hypot(from.x, from.y);
                return new Quat(-from.y / mag, from.x / mag, 0, 0);
            } else {
                const mag = Math.hypot(from.y, from.z);
                return new Quat(0, -from.z / mag, from.y / mag, 0);
            }
        } else {
            const x = from.y * to.z - from.z * to.y;
            const y = from.z * to.x - from.x * to.z;
            const z = from.x * to.y - from.y * to.x;
            const mag = Math.hypot(x, y, z, r);
            return new Quat(
                x / mag,
                y / mag,
                z / mag,
                r / mag,
            );
        }
    }

    /** A new Quat from a spherical linear interpolation between two Quats. */
    public static slerpOf(q1: Quat, q2: Quat, t: number): Quat
    {
        const ax = q1.x, ay = q1.y, az = q1.z, aw = q1.w;
        let bx = q2.x, by = q2.y, bz = q2.z, bw = q2.w;
        let dot = ax * bx + ay * by + az * bz + aw * bw;
        if (dot < 0) {
            dot = -dot;
            bx = -bx;
            by = -by;
            bz = -bz;
            bw = -bw;
        }
        let scale0, scale1;
        if (1.0 - dot > EPSILON) {
            const omega = Math.acos(dot);
            const sinom = Math.sin(omega);
            scale0 = Math.sin((1.0 - t) * omega) / sinom;
            scale1 = Math.sin(t * omega) / sinom;
        } else {
            scale0 = 1.0 - t;
            scale1 = t;
        }
        return new Quat(
            scale0 * ax + scale1 * bx,
            scale0 * ay + scale1 * by,
            scale0 * az + scale1 * bz,
            scale0 * aw + scale1 * bw,
        );
    }

    /**
     * A new Quat from a spherical linear interpolation between four Quats.
     * This is a convenience method for interpolating between two rotations.
     */
    public static sqlerpOf(q1: Quat, q2: Quat, q3: Quat, q4: Quat, t: number): Quat
    {
        return Quat.slerpOf(Quat.slerpOf(q1, q2, t), Quat.slerpOf(q3, q4, t), 2 * t * (1 - t));
    }

    // Instance methods --------------------------------------------------------

    /** Defaults to the identity quaternion. */
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
    get 1(): number { return this.y; }
    get 2(): number { return this.x; }
    get 3(): number { return this.w; }
    get length(): number { return 4; }

    /** Write this Quat to the given array at the given offset. */
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

    /** A new Quat with values from this one. */
    public clone(): Quat
    {
        return new Quat(this.x, this.y, this.z, this.w);
    }

    /** Copy values from another Quat into this one. */
    public copy(other: Quat): Quat
    {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        this.w = other.w;
        return this;
    }

    /** Tests for equality between this Quat and another. */
    public equals(other: Quat, epsilon: number = EPSILON): boolean
    {
        return (
            Math.abs(this.x - other.x) <= epsilon &&
            Math.abs(this.y - other.y) <= epsilon &&
            Math.abs(this.z - other.z) <= epsilon &&
            Math.abs(this.w - other.w) <= epsilon);
    }

    /** The inverse of this Quat. */
    public invert(): Quat
    {
        const x = this.x, y = this.y, z = this.z, w = this.w;
        let dot = x * x + y * y + z * z + w * w;
        if (dot === 0) {
            return new Quat(0, 0, 0, 1);
        } else {
            dot = 1.0 / dot;
            return new Quat(-x * dot, -y * dot, -z * dot, w * dot);
        }
    }

    /** The conjugate of this Quat. */
    public conjugate(): Quat
    {
        return new Quat(-this.x, -this.y, -this.z, this.w);
    }

    /** The squared magnitude of this Quat. */
    public magSq(): number
    {
        return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
    }

    /** The magnitude (length) of this Quat. */
    public magnitude(): number
    {
        return Math.hypot(this.x, this.y, this.z, this.w);
    }

    /** The dot product of this Quat and another. */
    public dot(other: Quat): number
    {
        return this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
    }

    /** The normalized version of this Quat. */
    public normalize(): Quat
    {
        const mag = Math.hypot(this.x, this.y, this.z, this.w);
        if (mag === 0) {
            return new Quat(0, 0, 0, 1);
        }
        else {
            return new Quat(this.x / mag, this.y / mag, this.z / mag, this.w / mag);
        }
    }

    /** this *= other */
    public mul(other: Quat): Quat
    {
        const ax = this.x, ay = this.y, az = this.z, aw = this.w;
        const bx = other.x, by = other.y, bz = other.z, bw = other.w;
        return new Quat(
            ax * bw + aw * bx + ay * bz - az * by,
            ay * bw + aw * by + az * bx - ax * bz,
            az * bw + aw * bz + ax * by - ay * bx,
            aw * bw - ax * bx - ay * by - az * bz,
        );
    }

    /** Angle between this Quat and another in radians. */
    public angleTo(other: Quat): number
    {
        const dot = this.x * other.x + this.y * other.y + this.z * other.z + this.w * other.w;
        return Math.acos(2 * dot * dot - 1);
    }

    /**
     * The axis of rotation of this Quat as output argument,
     * plus the angle in radians in the return value
     */
    public getAxisAngle(axis: Vec3): number
    {
        const rad = Math.acos(this.w) * 2;
        const s = Math.sin(rad / 2);
        if (s > EPSILON) {
            axis.x = this.x / s;
            axis.y = this.y / s;
            axis.z = this.z / s;
        } else {
            axis.x = 1;
            axis.y = 0;
            axis.z = 0;
        }
        return rad;
    }

    /** Rotates this Quat around the x-axis by the given angle in radians. */
    public rotateX(radians: number): Quat
    {
        radians *= 0.5;
        const s = Math.sin(radians);
        const c = Math.cos(radians);
        const x = this.x, y = this.y, z = this.z, w = this.w;
        return new Quat(
            x * c + w * s,
            y * c + z * s,
            z * c - y * s,
            w * c - x * s,
        );
    }

    /** Rotates this Quat around the y-axis by the given angle in radians. */
    public rotateY(radians: number): Quat
    {
        radians *= 0.5;
        const s = Math.sin(radians);
        const c = Math.cos(radians);
        const x = this.x, y = this.y, z = this.z, w = this.w;
        return new Quat(
            x * c - z * s,
            y * c + w * s,
            z * c + x * s,
            w * c - y * s,
        );
    }

    /** Rotates this Quat around the z-axis by the given angle in radians. */
    public rotateZ(radians: number): Quat
    {
        radians *= 0.5;
        const s = Math.sin(radians);
        const c = Math.cos(radians);
        let x = this.x, y = this.y, z = this.z, w = this.w;
        return new Quat(
            x * c + y * s,
            y * c - x * s,
            z * c + w * s,
            w * c - z * s,
        );
    }

    /** Allows the use of Vec3 in a for-of loop. */
    *[Symbol.iterator](): Generator<number, void, unknown>
    {
        yield this.x;
        yield this.y;
        yield this.z;
        yield this.w;
    }
}

/**
 * This is used to identify Quat objects in the code.
 * It is stored as a property on the prototype so that does not take up
 * any space in the actual object, but one can still access it.
 */
(Quat.prototype as any).isQuat = true;

/**
 * This is to identify any glance math primitive in the code.
 */
(Quat.prototype as any).isMathPrimitive = true;
