import { EPSILON } from "./common.ts";
import type { Mat3 } from "./Mat3.ts";
import type { Mat4 } from "./Mat4.ts";
import type { Quat } from "./Quat.ts";

export class Vec3
{
    public x: number;
    public y: number;
    public z: number;

    // Static methods ----------------------------------------------------------

    /** A Vec3 with x, y and z set to 0. */
    public static zero(): Vec3
    {
        return new Vec3(0, 0, 0);
    }

    /** Component-wise initialization. */
    public static of(x: number, y?: number, z?: number): Vec3
    {
        return new Vec3(x, y ?? x, z ?? x);
    }

    /** A normalized Vec3 along the positive x-axis. */
    public static xAxis(): Vec3
    {
        return new Vec3(1, 0, 0);
    }

    /** A normalized Vec3 along the positive y-axis. */
    public static yAxis(): Vec3
    {
        return new Vec3(0, 1, 0);
    }

    /** A normalized Vec3 along the positive z-axis. */
    public static zAxis(): Vec3
    {
        return new Vec3(0, 0, 1);
    }

    /** A Vec3 with only the x component set to distance. */
    public static translateX(distance: number): Vec3
    {
        return new Vec3(distance, 0, 0);
    }

    /** A Vec3 with only the y component set to distance. */
    public static translateY(distance: number): Vec3
    {
        return new Vec3(0, distance, 0);
    }

    /** A Vec3 with only the z component set to distance. */
    public static translateZ(distance: number): Vec3
    {
        return new Vec3(0, 0, distance);
    }

    /** A random Vec3 with x, y and z in the range [0, 1). */
    public static random(): Vec3
    {
        return new Vec3(Math.random(), Math.random(), Math.random());
    }

    /** A random Vec3 with unit magnitude. */
    public static randomUnit(): Vec3
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
        return new Vec3(x! / mag, y! / mag, z! / mag);
    }

    /** A Vec3 with x, y and z initialized from the given array at the given offset. */
    public static fromArray(array: Array<number>, offset: number = 0): Vec3
    {
        if (array.length < offset + 3) {
            throw new Error(`Cannot create a Vec3 at offset ${offset} in array of length ${array.length}`);
        }
        return new Vec3(array[offset], array[offset + 1], array[offset + 2]);
    }

    /** A Vec3 from the given spherical coordinates. */
    public static fromSpherical(theta: number, phi: number, radius: number = 1): Vec3
    {
        const sinPhiRadius = Math.sin(phi) * radius;
        return new Vec3(
            sinPhiRadius * Math.sin(theta),
            Math.cos(phi) * radius,
            sinPhiRadius * Math.cos(theta)
        );
    }

    /** A Vec3 from the given cylindrical coordinates. */
    public static fromCylindrical(theta: number, y: number, radius: number = 1): Vec3
    {
        return new Vec3(
            Math.sin(theta) * radius,
            y,
            Math.cos(theta) * radius
        );
    }

    /** Hermite interpolation with two control points */
    public fromHermite(a: Vec3, b: Vec3, c: Vec3, d: Vec3, t: number): Vec3
    {
        const tSq = t * t;
        const f1 = tSq * (2 * t - 3) + 1;
        const f2 = tSq * (t - 2) + t;
        const f3 = tSq * (t - 1);
        const f4 = tSq * (3 - 2 * t);
        return new Vec3(
            a.x * f1 + b.x * f2 + c.x * f3 + d.x * f4,
            a.y * f1 + b.y * f2 + c.y * f3 + d.y * f4,
            a.z * f1 + b.z * f2 + c.z * f3 + d.z * f4
        );
    }

    /** Bezier interpolation with two control points */
    public fromBezier(a: Vec3, b: Vec3, c: Vec3, d: Vec3, t: number): Vec3
    {
        const tSq = t * t, ti = 1 - t, tiSq = ti * ti;
        const t1 = tiSq * ti;
        const t2 = 3 * t * tiSq;
        const t3 = 3 * tSq * ti;
        const t4 = tSq * t;
        return new Vec3(
            a.x * t1 + b.x * t2 + c.x * t3 + d.x * t4,
            a.y * t1 + b.y * t2 + c.y * t3 + d.y * t4,
            a.z * t1 + b.z * t2 + c.z * t3 + d.z * t4
        );
    }

    // Instance methods --------------------------------------------------------

    /** Defaults to the zero vector. */
    constructor(x: number = 0, y: number = 0, z: number = 0)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    /** Get the value of the given component. */
    [index: number]: number;
    get 0(): number { return this.x; }
    set 0(value: number) { this.x = value; }
    get 1(): number { return this.y; }
    set 1(value: number) { this.y = value; }
    get 2(): number { return this.z; }
    set 2(value: number) { this.z = value; }
    get length(): number { return 3; }

    /** Alternative names for the components */
    get width(): number { return this.x; }
    set width(value: number) { this.x = value; }
    get height(): number { return this.y; }
    set height(value: number) { this.y = value; }
    get depth(): number { return this.z; }
    set depth(value: number) { this.z = value; }

    get r(): number { return this.x; }
    set r(value: number) { this.x = value; }
    get g(): number { return this.y; }
    set g(value: number) { this.y = value; }
    get b(): number { return this.z; }
    set b(value: number) { this.z = value; }

    get u(): number { return this.x; }
    set u(value: number) { this.x = value; }
    get v(): number { return this.y; }
    set v(value: number) { this.y = value; }
    get w(): number { return this.z; }
    set w(value: number) { this.z = value; }

    /** Get the value of the given component by index. */
    public getIndex(index: number): number
    {
        switch (index) {
            case 0: return this.x;
            case 1: return this.y;
            case 2: return this.z;
            default:
                throw new Error(`Invalid Vec3 index: ${index}`);
        }
    }

    /** Set the value of the given component by index. */
    public setIndex(index: number, value: number): void
    {
        switch (index) {
            case 0: this.x = value; break;
            case 1: this.y = value; break;
            case 2: this.z = value; break;
            default:
                throw new Error(`Invalid Vec3 index: ${index}`);
        }
    }

    /** Write this Vec3's x, y and z to the given array at the given offset. */
    public toArray(array: Array<number> | null = null, offset: number = 0): Array<number>
    {
        if (array === null) {
            array = new Array<number>(3);
        }
        array[offset] = this.x;
        array[offset + 1] = this.y;
        array[offset + 2] = this.z;
        return array;
    }

    /** A new Vec3 with values from this one. */
    public clone(): Vec3
    {
        return new Vec3(this.x, this.y, this.z);
    }

    /** Copy values from another Vec3 into this one. */
    public copy(other: Vec3): Vec3
    {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        return this;
    }

    /** Tests for equality between this Vec3 and another. */
    public equals(other: Vec3, epsilon: number = EPSILON): boolean
    {
        return (
            Math.abs(this.x - other.x) <= epsilon &&
            Math.abs(this.y - other.y) <= epsilon &&
            Math.abs(this.z - other.z) <= epsilon);
    }

    /** Tests if any component is non-zero. */
    public any(): boolean
    {
        return this.x != 0 || this.y != 0 || this.z != 0;
    }

    /**
     * Set this Vec3's x, y and z.
     * If only one argument is given, all components are set to that value.
     * If only two arguments are given, x and y are set to those values and z is set to 0.
     */
    public set(x: number, y?: number, z?: number): Vec3
    {
        this.x = x;
        this.y = y ?? x;
        this.z = z ?? (y === undefined ? x : 0);
        return this;
    }

    /** Adds this and other to create a new Vec3. */
    public add(other: Vec3 | number): Vec3
    {
        if (typeof other === 'number') {
            return new Vec3(this.x + other, this.y + other, this.z + other);
        } else {
            return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
        }
    }

    /** Subtract other from this to create a new Vec3. */
    public sub(other: Vec3 | number): Vec3
    {
        if (typeof other === 'number') {
            return new Vec3(this.x - other, this.y - other, this.z - other);
        } else {
            return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z);
        }
    }

    /** Component-wise multiplication of this and other to create a new Vec3. */
    public mul(other: Vec3 | number): Vec3
    {
        if (typeof other === 'number') {
            return new Vec3(this.x * other, this.y * other, this.z * other);
        } else {
            return new Vec3(this.x * other.x, this.y * other.y, this.z * other.z);
        }
    }

    /** Component-wise division of this by b to create a new Vec3. */
    public div(other: Vec3 | number): Vec3
    {
        if (typeof other === 'number') {
            return new Vec3(this.x / other, this.y / other, this.z / other);
        } else {
            return new Vec3(this.x / other.x, this.y / other.y, this.z / other.z);
        }
    }

    /** Component-wise multiplication with -1. */
    public negate(): Vec3
    {
        return new Vec3(-this.x, -this.y, -this.z);
    }

    /** Component-wise inversion (1/x). Zero division is handled as 0 */
    public invert(): Vec3
    {
        return new Vec3(
            this.x == 0 ? 0 : 1 / this.x,
            this.y == 0 ? 0 : 1 / this.y,
            this.z == 0 ? 0 : 1 / this.z
        );
    }

    /** Component-wise modulo of this by other. */
    public mod(other: Vec3 | number): Vec3
    {
        if (typeof other === 'number') {
            return new Vec3(this.x % other, this.y % other, this.z % other);
        } else {
            return new Vec3(this.x % other.x, this.y % other.y, this.z % other.z);
        }
    }

    /** Linear interpolation between this and other. */
    public lerp(other: Vec3, t: number): Vec3
    {
        return new Vec3(
            this.x + (other.x - this.x) * t,
            this.y + (other.y - this.y) * t,
            this.z + (other.z - this.z) * t
        );
    }

    /** Spherical interpolation between this and other. */
    public slerp(other: Vec3, t: number): Vec3
    {
        const ax = this.x, ay = this.y, az = this.z;
        const bx = other.x, by = other.y, bz = other.z;
        const angle = Math.acos(Math.min(Math.max(ax * bx + ay * by + az * bz, -1), 1));
        const sinTotal = angle ? Math.sin(angle) : 1;
        const ratioA = Math.sin((1 - t) * angle) / sinTotal;
        const ratioB = Math.sin(t * angle) / sinTotal;
        return new Vec3(
            ratioA * ax + ratioB * bx,
            ratioA * ay + ratioB * by,
            ratioA * az + ratioB * bz
        );
    }

    /** Dot product of this and other. */
    public dot(other: Vec3): number
    {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }

    /** Cross product of this and other. */
    public cross(other: Vec3): Vec3
    {
        const ax = this.x, ay = this.y, az = this.z;
        const bx = other.x, by = other.y, bz = other.z;
        return new Vec3(
            ay * bz - az * by,
            az * bx - ax * bz,
            ax * by - ay * bx
        );
    }

    /** Squared magnitude of this vector. */
    public magSq(): number
    {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    /** Magnitude (length) of this vector. */
    public magnitude(): number
    {
        return Math.hypot(this.x, this.y, this.z);
    }

    /** Manhattan length of this vector. */
    public manhattanLength(): number
    {
        return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
    }

    /** Normalize this vector. */
    public normalize(): Vec3
    {
        const magSq = this.x * this.x + this.y * this.y + this.z * this.z;
        if (magSq > 0) {
            const invMag = 1 / Math.sqrt(magSq);
            return new Vec3(this.x * invMag, this.y * invMag, this.z * invMag);
        }
        return new Vec3(0, 0, 0);
    }

    /** Distance from this to other. */
    public distanceTo(other: Vec3): number
    {
        return Math.hypot(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    /** Squared distance from this to other. */
    public distanceToSq(other: Vec3): number
    {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dz = this.z - other.z;
        return dx * dx + dy * dy + dz * dz;
    }

    /** Manhattan distance from this to other. */
    public manhattanDistanceTo(other: Vec3): number
    {
        return Math.abs(this.x - other.x) + Math.abs(this.y - other.y) + Math.abs(this.z - other.z);
    }

    /** Component-wise min of this and other. */
    public min(other: Vec3 | number): Vec3
    {
        if (typeof other === 'number') {
            return new Vec3(Math.min(this.x, other), Math.min(this.y, other), Math.min(this.z, other));
        } else {
            return new Vec3(Math.min(this.x, other.x), Math.min(this.y, other.y), Math.min(this.z, other.z));
        }
    }

    /** Component-wise max of this and other. */
    public max(other: Vec3 | number): Vec3
    {
        if (typeof other === 'number') {
            return new Vec3(Math.max(this.x, other), Math.max(this.y, other), Math.max(this.z, other));
        } else {
            return new Vec3(Math.max(this.x, other.x), Math.max(this.y, other.y), Math.max(this.z, other.z));
        }
    }

    /** Component-wise clamp of this between min and max. */
    public clamp(min: Vec3 | number, max: Vec3 | number): Vec3
    {
        const minX = typeof min === 'number' ? min : min.x;
        const maxX = typeof max === 'number' ? max : max.x;
        const minY = typeof min === 'number' ? min : min.y;
        const maxY = typeof max === 'number' ? max : max.y;
        const minZ = typeof min === 'number' ? min : min.z;
        const maxZ = typeof max === 'number' ? max : max.z;
        return new Vec3(
            Math.max(minX, Math.min(maxX, this.x)),
            Math.max(minY, Math.min(maxY, this.y)),
            Math.max(minZ, Math.min(maxZ, this.z))
        );
    }

    /** Clamp the magnitude of this between min and max. */
    public clampMagnitude(min: number, max: number): Vec3
    {
        const magSq = this.x * this.x + this.y * this.y + this.z * this.z;
        if (magSq > 0) {
            const mag = Math.sqrt(magSq);
            const factor = Math.max(min, Math.min(max, mag)) / mag;
            return new Vec3(this.x * factor, this.y * factor, this.z * factor);
        }
        return new Vec3(0, 0, 0);
    }

    /** Component-wise absolute value. */
    public abs(): Vec3
    {
        return new Vec3(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z));
    }

    /** Component-wise absolute (floored) value. */
    public floor(): Vec3
    {
        return new Vec3(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
    }

    /** Component-wise absolute (ceiled) value. */
    public ceil(): Vec3
    {
        return new Vec3(Math.ceil(this.x), Math.ceil(this.y), Math.ceil(this.z));
    }

    /** Component-wise absolute (rounded) value. */
    public round(): Vec3
    {
        return new Vec3(Math.round(this.x), Math.round(this.y), Math.round(this.z));
    }

    /** Component-wise absolute (truncated) value. */
    public trunc(): Vec3
    {
        return new Vec3(Math.trunc(this.x), Math.trunc(this.y), Math.trunc(this.z));
    }

    /** Project this Vec3 onto the given Vec3. */
    public projectOnVector(other: Vec3): Vec3
    {
        const bx = other.x, by = other.y, bz = other.z;
        const magSq = bx * bx + by * by + bz * bz;
        if (magSq == 0) {
            return new Vec3(0, 0, 0);
        } else {
            const factor = (this.x * bx + this.y * by + this.z * bz) / magSq;
            return new Vec3(bx * factor, by * factor, bz * factor);
        }
    }

    /** Project this Vec3 onto the plane with the given normal. */
    public projectOnPlane(planeNormal: Vec3): Vec3
    {
        const bx = planeNormal.x, by = planeNormal.y, bz = planeNormal.z;
        const factor = this.x * bx + this.y * by + this.z * bz;
        return new Vec3(this.x - bx * factor, this.y - by * factor, this.z - bz * factor);
    }

    /** Reflect this Vec3 as incident off the plane with the given normal. */
    public reflect(normal: Vec3): Vec3
    {
        const bx = normal.x, by = normal.y, bz = normal.z;
        const factor = 2 * (this.x * bx + this.y * by + this.z * bz);
        return new Vec3(this.x - bx * factor, this.y - by * factor, this.z - bz * factor);
    }

    /** Angle of this Vec3 to other in radians. */
    public angleTo(other: Vec3): number
    {
        const ax = this.x, ay = this.y, az = this.z;
        const bx = other.x, by = other.y, bz = other.z;
        const mag = Math.sqrt((ax * ax + ay * ay + az * az) * (bx * bx + by * by + bz * bz));
        const cosine = mag && (ax * bx + ay * by + az * bz) / mag;
        return Math.acos(Math.min(Math.max(cosine, -1), 1));
    }

    /** Translate this Vec3 along the positive x-axis by the given distance. */
    public translateX(distance: number): Vec3
    {
        return new Vec3(this.x + distance, this.y, this.z);
    }

    /** Translate this Vec3 along the positive y-axis by the given distance. */
    public translateY(distance: number): Vec3
    {
        return new Vec3(this.x, this.y + distance, this.z);
    }

    /** Translate this Vec3 along the positive z-axis by the given distance. */
    public translateZ(distance: number): Vec3
    {
        return new Vec3(this.x, this.y, this.z + distance);
    }

    /** Rotate this Vec3 around the positive x-axis by the given angle in radians. */
    public rotateX(radians: number): Vec3
    {
        const y = this.y, z = this.z;
        const c = Math.cos(radians), s = Math.sin(radians);
        return new Vec3(this.x, y * c - z * s, y * s + z * c);
    }

    /** Rotate this Vec3 around the positive y-axis by the given angle in radians. */
    public rotateY(radians: number): Vec3
    {
        const x = this.x, z = this.z;
        const c = Math.cos(radians), s = Math.sin(radians);
        return new Vec3(x * c + z * s, this.y, -x * s + z * c);
    }

    /** Rotate this Vec3 around the positive z-axis by the given angle in radians. */
    public rotateZ(radians: number): Vec3
    {
        const x = this.x, y = this.y;
        const c = Math.cos(radians), s = Math.sin(radians);
        return new Vec3(x * c - y * s, x * s + y * c, this.z);
    }

    /** Rotate this Vec3 around the given axis by the given angle in radians. */
    public rotateAround(axis: Vec3, angle: number): Vec3
    {
        const ax = this.x, ay = this.y, az = this.z;
        const bx = axis.x, by = axis.y, bz = axis.z;
        const cosine = Math.cos(angle), sine = Math.sin(angle);
        const factor = (bx * ax + by * ay + bz * az) * (1 - cosine);
        return new Vec3(
            bx * factor + ax * cosine + (-bz * ay + by * az) * sine,
            by * factor + ay * cosine + (bz * ax - bx * az) * sine,
            bz * factor + az * cosine + (-by * ax + bx * ay) * sine
        );
    }

    /** Rotate this Vec3 with the given Mat3. */
    public applyMat3(m: Mat3): Vec3
    {
        const x = this.x, y = this.y, z = this.z;
        return new Vec3(
            x * m.a + y * m.d + z * m.g,
            x * m.b + y * m.e + z * m.h,
            x * m.c + y * m.f + z * m.i
        );
    }

    /** Transform this Vec3 with the given Mat4. */
    public applyMat4(m: Mat4): Vec3
    {
        const x = this.x, y = this.y, z = this.z;
        const w = (m.d * x + m.h * y + m.l * z + m.p) || 1;
        return new Vec3(
            (x * m.a + y * m.e + z * m.i + m.m) / w,
            (x * m.b + y * m.f + z * m.j + m.n) / w,
            (x * m.c + y * m.g + z * m.k + m.o) / w
        );
    }

    /** Rotate this Vec3 with the given Mat4 (translation is ignored). */
    public rotateMat4(m: Mat4): Vec3
    {
        const x = this.x, y = this.y, z = this.z;
        return new Vec3(
            x * m.a + y * m.e + z * m.i,
            x * m.b + y * m.f + z * m.j,
            x * m.c + y * m.g + z * m.k
        );
    }

    /** Rotate this Vec3 with the given Quaternion. */
    public rotateQuat(q: Quat): Vec3
    {
        const vx = this.x, vy = this.y, vz = this.z;
        const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

        const tx = 2 * (qy * vz - qz * vy);
        const ty = 2 * (qz * vx - qx * vz);
        const tz = 2 * (qx * vy - qy * vx);

        return new Vec3(
            vx + qw * tx + qy * tz - qz * ty,
            vy + qw * ty + qz * tx - qx * tz,
            vz + qw * tz + qx * ty - qy * tx
        );
    }

    /** Allows the use of Vec3 in a for-of loop. */
    *[Symbol.iterator](): Generator<number, void, unknown>
    {
        yield this.x;
        yield this.y;
        yield this.z;
    }
}

/**
 * This is used to identify Vec3 objects in the code.
 * It is stored as a property on the prototype so that does not take up
 * any space in the actual object, but one can still access it.
 */
(Vec3.prototype as any).isVec3 = true;

/**
 * This is to identify any glance math primitive in the code.
 */
(Vec3.prototype as any).isMathPrimitive = true;
