import { EPSILON } from "./common.ts";
import { Vec3 } from "./Vec3.ts";
import { Mat3 } from "./Mat3.ts";
import type { Vec4 } from "./Vec4.ts";
import type { Quat } from "./Quat.ts";

/**
 * A 4x4 matrix.
 * The matrix is stored in column-major order:
 *  | a e i m |
 *  | b f j n |
 *  | c g k o |
 *  | d h l p |
 */
export class Mat4
{
    // Amazingly, this is faster than using an Array or a Float32Array.
    public a: number; public b: number; public c: number; public d: number;
    public e: number; public f: number; public g: number; public h: number;
    public i: number; public j: number; public k: number; public l: number;
    public m: number; public n: number; public o: number; public p: number;

    // Static methods ----------------------------------------------------------

    /** Component-wise initialization. */
    public static of(
        a: number, b: number, c: number, d: number,
        e: number, f: number, g: number, h: number,
        i: number, j: number, k: number, l: number,
        m: number, n: number, o: number, p: number,
    ): Mat4
    {
        return new Mat4(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
    }

    /** The identity matrix. */
    public static identity(): Mat4
    {
        return new Mat4();
    }

    /** A 3D translation matrix with the given Vec3. */
    public static translate(v: Vec3 | number, y?: number, z?: number): Mat4
    {
        if (typeof v === 'number') {
            return new Mat4(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                v, y ?? v, z ?? v, 1,
            );
        } else {
            return new Mat4(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                v.x, v.y, v.z, 1,
            );
        }
    }

    /** A 3D translation matrix with the given distance along the x-axis. */
    public static translateX(delta: number): Mat4
    {
        return new Mat4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            delta, 0, 0, 1,
        );
    }

    /** A 3D translation matrix with the given distance along the y-axis. */
    public static translateY(delta: number): Mat4
    {
        return new Mat4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, delta, 0, 1,
        );
    }

    /** A 3D translation matrix with the given distance along the z-axis. */
    public static translateZ(delta: number): Mat4
    {
        return new Mat4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, delta, 1,
        );
    }

    /** A 3D rotation matrix around the given unit axis by the given angle in radians. */
    public static rotate(axis: Vec3, angle: number): Mat4
    {
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        const t = 1 - c;
        let x = axis.x, y = axis.y, z = axis.z;
        const tx = t * x, ty = t * y, tz = t * z;
        const sx = s * x, sy = s * y, sz = s * z;
        return new Mat4(
            tx * x + c, tx * y + sz, tx * z - sy, 0,
            ty * x - sz, ty * y + c, ty * z + sx, 0,
            tz * x + sy, tz * y - sx, tz * z + c, 0,
            0, 0, 0, 1);
    }

    /** A 3D rotation matrix around the X axis by the given angle in radians. */
    public static rotateX(angle: number): Mat4
    {
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        return new Mat4(
            1, 0, 0, 0,
            0, c, s, 0,
            0, -s, c, 0,
            0, 0, 0, 1,
        );
    }

    /** A 3D rotation matrix around the Y axis by the given angle in radians. */
    public static rotateY(angle: number): Mat4
    {
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        return new Mat4(
            c, 0, -s, 0,
            0, 1, 0, 0,
            s, 0, c, 0,
            0, 0, 0, 1,
        );
    }

    /** A 3D rotation matrix around the Z axis by the given angle in radians. */
    public static rotateZ(angle: number): Mat4
    {
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        return new Mat4(
            c, s, 0, 0,
            -s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        );
    }

    /** A 3D rotation matrix from the given Quat. */
    public static fromQuat(q: Quat): Mat4
    {
        const x = q.x, y = q.y, z = q.z, w = q.w;
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;
        return new Mat4(
            1 - (yy + zz), xy + wz, xz - wy, 0,
            xy - wz, 1 - (xx + zz), yz + wx, 0,
            xz + wy, yz - wx, 1 - (xx + yy), 0,
            0, 0, 0, 1,
        );
    }

    /** A 3D scaling matrix with the given Vec3 on the diagonal. */
    public static scale(v: number | Vec3): Mat4
    {
        let x: number, y: number, z: number;
        if (typeof v === 'number') {
            x = v, y = v, z = v;
        } else {
            x = v.x, y = v.y, z = v.z;
        }
        return new Mat4(
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1,
        );
    }

    /** A Mat4 with all elements set to a random value in the range [0, 1). */
    public static random()
    {
        return new Mat4(
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
            Math.random(), Math.random(), Math.random(), Math.random(),
        );
    }

    /** A new Matrix with components initialized from the given array at the given offset. */
    public static fromArray(array: Array<number>, offset: number = 0): Mat4
    {
        if (array.length < offset + 16) {
            throw new Error(`Cannot create a Mat4 at offset ${offset} in array of length ${array.length}`);
        }
        return new Mat4(
            array[offset + 0], array[offset + 1], array[offset + 2], array[offset + 3],
            array[offset + 4], array[offset + 5], array[offset + 6], array[offset + 7],
            array[offset + 8], array[offset + 9], array[offset + 10], array[offset + 11],
            array[offset + 12], array[offset + 13], array[offset + 14], array[offset + 15]);
    }

    /** A Mat4 with the top-left 3x3 submatrix set to the given matrix. */
    public static fromMat3(m: Mat3): Mat4
    {
        return new Mat4(
            m.a, m.b, m.c, 0,
            m.d, m.e, m.f, 0,
            m.g, m.h, m.i, 0,
            0, 0, 0, 1,
        );
    }

    /** Construct a Mat4 from three or four Vec3s. */
    public static fromVec3s(a: Vec3, b: Vec3, c: Vec3, d?: Vec3): Mat4
    {
        if (d === undefined) { d = Vec3.of(0); }
        return new Mat4(
            a.x, a.y, a.z, 0,
            b.x, b.y, b.z, 0,
            c.x, c.y, c.z, 0,
            d.x, d.y, d.z, 1,
        );
    }

    /** Construct a Mat4 from four Vec4s. */
    public static fromVec4s(a: Vec4, b: Vec4, c: Vec4, d: Vec4): Mat4
    {
        return new Mat4(
            a.x, a.y, a.z, a.w,
            b.x, b.y, b.z, b.w,
            c.x, c.y, c.z, c.w,
            d.x, d.y, d.z, d.w,
        );
    }

    /** A Mat4 with the given position, rotation, and scale. */
    public static compose(pos: Vec3, rot: Quat, scale: Vec3): Mat4
    {
        const x = rot.x, y = rot.y, z = rot.z, w = rot.w;
        const sx = scale.x, sy = scale.y, sz = scale.z;
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;
        return new Mat4(
            (1 - (yy + zz)) * sx, (xy + wz) * sx, (xz - wy) * sx, 0,
            (xy - wz) * sy, (1 - (xx + zz)) * sy, (yz + wx) * sy, 0,
            (xz + wy) * sz, (yz - wx) * sz, (1 - (xx + yy)) * sz, 0,
            pos.x, pos.y, pos.z, 1,
        );
    }

    /** An orthographic projection matrix. */
    public static ortho(left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4
    {
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);
        return new Mat4(
            -2 * lr, 0, 0, 0,
            0, -2 * bt, 0, 0,
            0, 0, 2 * nf, 0,
            (left + right) * lr, (bottom + top) * bt, (near + far) * nf, 1,
        );
    }

    /** A perspective projection matrix. */
    public static perspective(fov: number, aspect: number, near: number, far: number): Mat4
    {
        const f = 1 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        return new Mat4(
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0,
        );
    }

    /** A look-at matrix. */
    public static lookAt(eye: Vec3, center: Vec3, up: Vec3): Mat4
    {
        const ex = eye.x, ey = eye.y, ez = eye.z;
        let dx = ex - center.x, dy = ey - center.y, dz = ez - center.z;
        if (Math.abs(dx) == 0 && Math.abs(dy) == 0 && Math.abs(dz) == 0) {
            return new Mat4();
        }
        let len = 1 / Math.hypot(dx, dy, dz);
        dx *= len, dy *= len, dz *= len;
        const upx = up.x, upy = up.y, upz = up.z;
        let x0 = upy * dz - upz * dy;
        let x1 = upz * dx - upx * dz;
        let x2 = upx * dy - upy * dx;
        len = Math.hypot(x0, x1, x2);
        if (len == 0) {
            x0 = 0, x1 = 0, x2 = 0;
        } else {
            len = 1 / len;
            x0 *= len, x1 *= len, x2 *= len;
        }
        let y0 = dy * x2 - dz * x1;
        let y1 = dz * x0 - dx * x2;
        let y2 = dx * x1 - dy * x0;
        len = Math.hypot(y0, y1, y2);
        if (len == 0) {
            y0 = 0, y1 = 0, y2 = 0;
        } else {
            len = 1 / len;
            y0 *= len, y1 *= len, y2 *= len;
        }
        return new Mat4(
            x0, y0, dx, 0,
            x1, y1, dy, 0,
            x2, y2, dz, 0,
            -(x0 * ex + x1 * ey + x2 * ez),
            -(y0 * ex + y1 * ey + y2 * ez),
            -(dx * ex + dy * ey + dz * ez),
            1);
    }

    // Instance methods --------------------------------------------------------

    /** Defaults to the identity matrix. */
    constructor(
        a: number = 1, b: number = 0, c: number = 0, d: number = 0,
        e: number = 0, f: number = 1, g: number = 0, h: number = 0,
        i: number = 0, j: number = 0, k: number = 1, l: number = 0,
        m: number = 0, n: number = 0, o: number = 0, p: number = 1,
    )
    {
        this.a = a; this.b = b; this.c = c; this.d = d;
        this.e = e; this.f = f; this.g = g; this.h = h;
        this.i = i; this.j = j; this.k = k; this.l = l;
        this.m = m; this.n = n; this.o = o; this.p = p;
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
    get 9(): number { return this.j; }
    get 10(): number { return this.k; }
    get 11(): number { return this.l; }
    get 12(): number { return this.m; }
    get 13(): number { return this.n; }
    get 14(): number { return this.o; }
    get 15(): number { return this.p; }
    get length(): number { return 16; }

    /** Write this Mat4 to the given array at the given offset. */
    public toArray(array: Array<number> | null = null, offset: number = 0): Array<number>
    {
        if (array === null) {
            array = new Array<number>(16);
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
        array[offset + 9] = this.j;
        array[offset + 10] = this.k;
        array[offset + 11] = this.l;
        array[offset + 12] = this.m;
        array[offset + 13] = this.n;
        array[offset + 14] = this.o;
        array[offset + 15] = this.p;
        return array;
    }

    /**
     * Returns a string representation of this matrix.

     * Mat4 | a e i m |
     *      | b f j n |
     *      | c g k o |
     *      | d h l p |
     */
    public toString(): string
    {
        return `Mat4 | ${this.a}, ${this.e}, ${this.i}, ${this.m} |\n`
            + `     | ${this.b}, ${this.f}, ${this.j}, ${this.n} |\n`
            + `     | ${this.c}, ${this.g}, ${this.k}, ${this.o} |\n`
            + `     | ${this.d}, ${this.h}, ${this.l}, ${this.p} |`;
    }

    /** A new Mat4 with the same elements as this one. */
    public clone(): Mat4
    {
        return new Mat4(
            this.a, this.b, this.c, this.d,
            this.e, this.f, this.g, this.h,
            this.i, this.j, this.k, this.l,
            this.m, this.n, this.o, this.p,
        );
    }

    /** Copy the elements of the given Mat4 into this one. */
    public copy(m: Mat4): Mat4
    {
        this.a = m.a; this.b = m.b; this.c = m.c; this.d = m.d;
        this.e = m.e; this.f = m.f; this.g = m.g; this.h = m.h;
        this.i = m.i; this.j = m.j; this.k = m.k; this.l = m.l;
        this.m = m.m; this.n = m.n; this.o = m.o; this.p = m.p;
        return this;
    }

    /** Decomposes this Mat4 into the given position, rotation, and scale output args. */
    public decompose(pos: Vec3, rot: Quat, scale: Vec3): void
    {
        const det = (this.a * this.f - this.b * this.e) * (this.k * this.p - this.l * this.o)
            - (this.a * this.g - this.c * this.e) * (this.j * this.p - this.l * this.n)
            + (this.a * this.h - this.d * this.e) * (this.j * this.o - this.k * this.n)
            + (this.b * this.g - this.c * this.f) * (this.i * this.p - this.l * this.m)
            - (this.b * this.h - this.d * this.f) * (this.i * this.o - this.k * this.m)
            + (this.c * this.h - this.d * this.g) * (this.i * this.n - this.j * this.m);
        const sx = Math.hypot(this.a, this.b, this.c) * Math.sign(det);
        const sy = Math.hypot(this.e, this.f, this.g);
        const sz = Math.hypot(this.i, this.j, this.k);

        pos.x = this.m;
        pos.y = this.n;
        pos.z = this.o;

        this.a /= sx; this.b /= sx; this.c /= sx;
        this.e /= sy; this.f /= sy; this.g /= sy;
        this.i /= sz; this.j /= sz; this.k /= sz;
        const trace = this.a + this.f + this.k;
        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            rot.x = (this.g - this.j) * s;
            rot.y = (this.i - this.c) * s;
            rot.z = (this.b - this.e) * s;
            rot.w = 0.25 / s;
        } else if (this.a > this.f && this.a > this.k) {
            const s = 2.0 * Math.sqrt(1.0 + this.a - this.f - this.k);
            rot.x = 0.25 * s;
            rot.y = (this.e + this.b) / s;
            rot.z = (this.i + this.c) / s;
            rot.w = (this.g - this.j) / s;
        } else if (this.f > this.k) {
            const s = 2.0 * Math.sqrt(1.0 + this.f - this.a - this.k);
            rot.x = (this.e + this.b) / s;
            rot.y = 0.25 * s;
            rot.z = (this.j + this.g) / s;
            rot.w = (this.i - this.c) / s;
        } else {
            const s = 2.0 * Math.sqrt(1.0 + this.k - this.a - this.f);
            rot.x = (this.i + this.c) / s;
            rot.y = (this.j + this.g) / s;
            rot.z = 0.25 * s;
            rot.w = (this.b - this.e) / s;
        }

        scale.x = sx;
        scale.y = sy;
        scale.z = sz;
    }

    /** Tests for equality between this Mat4 and another. */
    public equals(other: Mat4, epsilon: number = EPSILON): boolean
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
            Math.abs(this.i - other.i) <= epsilon &&
            Math.abs(this.j - other.j) <= epsilon &&
            Math.abs(this.k - other.k) <= epsilon &&
            Math.abs(this.l - other.l) <= epsilon &&
            Math.abs(this.m - other.m) <= epsilon &&
            Math.abs(this.n - other.n) <= epsilon &&
            Math.abs(this.o - other.o) <= epsilon &&
            Math.abs(this.p - other.p) <= epsilon
        );
    }

    /** Transpose this Mat4 in-place. */
    public transpose(): Mat4
    {
        return new Mat4(
            this.a, this.e, this.i, this.m,
            this.b, this.f, this.j, this.n,
            this.c, this.g, this.k, this.o,
            this.d, this.h, this.l, this.p,
        );
    }


    /** Invert this Mat4 in-place. */
    public invert(): Mat4 | null
    {
        const b00 = this.a * this.f - this.b * this.e;
        const b01 = this.a * this.g - this.c * this.e;
        const b02 = this.a * this.h - this.d * this.e;
        const b03 = this.b * this.g - this.c * this.f;
        const b04 = this.b * this.h - this.d * this.f;
        const b05 = this.c * this.h - this.d * this.g;
        const b06 = this.i * this.n - this.j * this.m;
        const b07 = this.i * this.o - this.k * this.m;
        const b08 = this.i * this.p - this.l * this.m;
        const b09 = this.j * this.o - this.k * this.n;
        const b10 = this.j * this.p - this.l * this.n;
        const b11 = this.k * this.p - this.l * this.o;
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        if (!det) {
            return null;
        }
        det = 1 / det;
        return new Mat4(
            (this.f * b11 - this.g * b10 + this.h * b09) * det,
            (this.c * b10 - this.b * b11 - this.d * b09) * det,
            (this.n * b05 - this.o * b04 + this.p * b03) * det,
            (this.k * b04 - this.j * b05 - this.l * b03) * det,
            (this.g * b08 - this.e * b11 - this.h * b07) * det,
            (this.a * b11 - this.c * b08 + this.d * b07) * det,
            (this.o * b02 - this.m * b05 - this.p * b01) * det,
            (this.i * b05 - this.k * b02 + this.l * b01) * det,
            (this.e * b10 - this.f * b08 + this.h * b06) * det,
            (this.b * b08 - this.a * b10 - this.d * b06) * det,
            (this.m * b04 - this.n * b02 + this.p * b00) * det,
            (this.j * b02 - this.i * b04 - this.l * b00) * det,
            (this.f * b07 - this.e * b09 - this.g * b06) * det,
            (this.a * b09 - this.b * b07 + this.c * b06) * det,
            (this.n * b01 - this.m * b03 - this.o * b00) * det,
            (this.i * b03 - this.j * b01 + this.k * b00) * det,
        );
    }

    /** Change this Mat4 to its adjoint. */
    public adjoint(): Mat4
    {
        return new Mat4(
            + (this.f * (this.k * this.p - this.l * this.o)
                - this.j * (this.g * this.p - this.h * this.o)
                + this.n * (this.g * this.l - this.h * this.k))
            - (this.b * (this.k * this.p - this.l * this.o)
                - this.j * (this.c * this.p - this.d * this.o)
                + this.n * (this.c * this.l - this.d * this.k))
            + (this.b * (this.g * this.p - this.h * this.o)
                - this.f * (this.c * this.p - this.d * this.o)
                + this.n * (this.c * this.h - this.d * this.g))
            - (this.b * (this.g * this.l - this.h * this.k)
                - this.f * (this.c * this.l - this.d * this.k)
                + this.j * (this.c * this.h - this.d * this.g))
            - (this.e * (this.k * this.p - this.l * this.o)
                - this.i * (this.g * this.p - this.h * this.o)
                + this.m * (this.g * this.l - this.h * this.k))
            + (this.a * (this.k * this.p - this.l * this.o)
                - this.i * (this.c * this.p - this.d * this.o)
                + this.m * (this.c * this.l - this.d * this.k))
            - (this.a * (this.g * this.p - this.h * this.o)
                - this.e * (this.c * this.p - this.d * this.o)
                + this.m * (this.c * this.h - this.d * this.g))
            + (this.a * (this.g * this.l - this.h * this.k)
                - this.e * (this.c * this.l - this.d * this.k)
                + this.i * (this.c * this.h - this.d * this.g))
            + (this.e * (this.j * this.p - this.l * this.n)
                - this.i * (this.f * this.p - this.h * this.n)
                + this.m * (this.f * this.l - this.h * this.j))
            - (this.a * (this.j * this.p - this.l * this.n)
                - this.i * (this.b * this.p - this.d * this.n)
                + this.m * (this.b * this.l - this.d * this.j))
            + (this.a * (this.f * this.p - this.h * this.n)
                - this.e * (this.b * this.p - this.d * this.n)
                + this.m * (this.b * this.h - this.d * this.f))
            - (this.a * (this.f * this.l - this.h * this.j)
                - this.e * (this.b * this.l - this.d * this.j)
                + this.i * (this.b * this.h - this.d * this.f))
            - (this.e * (this.j * this.o - this.k * this.n)
                - this.i * (this.f * this.o - this.g * this.n)
                + this.m * (this.f * this.k - this.g * this.j))
            + (this.a * (this.j * this.o - this.k * this.n)
                - this.i * (this.b * this.o - this.c * this.n)
                + this.m * (this.b * this.k - this.c * this.j))
            - (this.a * (this.f * this.o - this.g * this.n)
                - this.e * (this.b * this.o - this.c * this.n)
                + this.m * (this.b * this.g - this.c * this.f))
            + (this.a * (this.f * this.k - this.g * this.j)
                - this.e * (this.b * this.k - this.c * this.j)
                + this.i * (this.b * this.g - this.c * this.f))
        );
    }

    /** The determinant of this Mat4. */
    public determinant(): number
    {
        return this.a * (
            this.f * (this.k * this.p - this.l * this.o) -
            this.g * (this.j * this.p - this.l * this.n) +
            this.h * (this.j * this.o - this.k * this.n)
        ) - this.b * (
            this.e * (this.k * this.p - this.l * this.o) -
            this.g * (this.i * this.p - this.l * this.m) +
            this.h * (this.i * this.o - this.k * this.m)
        ) + this.c * (
            this.e * (this.j * this.p - this.l * this.n) -
            this.f * (this.i * this.p - this.l * this.m) +
            this.h * (this.i * this.n - this.j * this.m)
        ) - this.d * (
            this.e * (this.j * this.o - this.k * this.n) -
            this.f * (this.i * this.o - this.k * this.m) +
            this.g * (this.i * this.n - this.j * this.m)
        );
    }

    /** Matrix multiplication of this Mat4 with another Mat4. */
    public mul(other: Mat4): Mat4
    {
        return new Mat4(
            other.a * this.a + other.b * this.e + other.c * this.i + other.d * this.m,
            other.a * this.b + other.b * this.f + other.c * this.j + other.d * this.n,
            other.a * this.c + other.b * this.g + other.c * this.k + other.d * this.o,
            other.a * this.d + other.b * this.h + other.c * this.l + other.d * this.p,
            other.e * this.a + other.f * this.e + other.g * this.i + other.h * this.m,
            other.e * this.b + other.f * this.f + other.g * this.j + other.h * this.n,
            other.e * this.c + other.f * this.g + other.g * this.k + other.h * this.o,
            other.e * this.d + other.f * this.h + other.g * this.l + other.h * this.p,
            other.i * this.a + other.j * this.e + other.k * this.i + other.l * this.m,
            other.i * this.b + other.j * this.f + other.k * this.j + other.l * this.n,
            other.i * this.c + other.j * this.g + other.k * this.k + other.l * this.o,
            other.i * this.d + other.j * this.h + other.k * this.l + other.l * this.p,
            other.m * this.a + other.n * this.e + other.o * this.i + other.p * this.m,
            other.m * this.b + other.n * this.f + other.o * this.j + other.p * this.n,
            other.m * this.c + other.n * this.g + other.o * this.k + other.p * this.o,
            other.m * this.d + other.n * this.h + other.o * this.l + other.p * this.p,
        );
    }

    /** Reverse multiplication of this Mat4 with another Mat4. */
    public premul(other: Mat4): Mat4
    {
        return new Mat4(
            this.a * other.a + this.b * other.e + this.c * other.i + this.d * other.m,
            this.a * other.b + this.b * other.f + this.c * other.j + this.d * other.n,
            this.a * other.c + this.b * other.g + this.c * other.k + this.d * other.o,
            this.a * other.d + this.b * other.h + this.c * other.l + this.d * other.p,
            this.e * other.a + this.f * other.e + this.g * other.i + this.h * other.m,
            this.e * other.b + this.f * other.f + this.g * other.j + this.h * other.n,
            this.e * other.c + this.f * other.g + this.g * other.k + this.h * other.o,
            this.e * other.d + this.f * other.h + this.g * other.l + this.h * other.p,
            this.i * other.a + this.j * other.e + this.k * other.i + this.l * other.m,
            this.i * other.b + this.j * other.f + this.k * other.j + this.l * other.n,
            this.i * other.c + this.j * other.g + this.k * other.k + this.l * other.o,
            this.i * other.d + this.j * other.h + this.k * other.l + this.l * other.p,
            this.m * other.a + this.n * other.e + this.o * other.i + this.p * other.m,
            this.m * other.b + this.n * other.f + this.o * other.j + this.p * other.n,
            this.m * other.c + this.n * other.g + this.o * other.k + this.p * other.o,
            this.m * other.d + this.n * other.h + this.o * other.l + this.p * other.p,
        );
    }

    /** 3D translation of this Mat4 by the given Vec3. */
    public translate(vec: Vec3 | number, y?: number, z?: number): Mat4
    {
        let x: number;
        if (typeof vec === "number") {
            x = vec;
            y = y ?? 0;
            z = z ?? 0;
        }
        else {
            x = vec.x;
            y = vec.y;
            z = vec.z;
        }
        return new Mat4(
            this.a, this.b, this.c, this.d,
            this.e, this.f, this.g, this.h,
            this.i, this.j, this.k, this.l,
            this.m + this.a * x + this.e * y + this.i * z,
            this.n + this.b * x + this.f * y + this.j * z,
            this.o + this.c * x + this.g * y + this.k * z,
            this.p + this.d * x + this.h * y + this.l * z,
        );
    }

    /** 3D translation of this Mat4 by the given distance along the x-axis. */
    public translateX(delta: number): Mat4
    {
        return new Mat4(
            this.a, this.b, this.c, this.d,
            this.e, this.f, this.g, this.h,
            this.i, this.j, this.k, this.l,
            this.m + this.a * delta,
            this.n + this.b * delta,
            this.o + this.c * delta,
            this.p + this.d * delta,
        );
    }

    /** 3D translation of this Mat4 by the given distance along the y-axis. */
    public translateY(delta: number): Mat4
    {
        return new Mat4(
            this.a, this.b, this.c, this.d,
            this.e, this.f, this.g, this.h,
            this.i, this.j, this.k, this.l,
            this.m + this.e * delta,
            this.n + this.f * delta,
            this.o + this.g * delta,
            this.p + this.h * delta,
        );
    }

    /** 3D translation of this Mat4 by the given distance along the z-axis. */
    public translateZ(delta: number): Mat4
    {
        return new Mat4(
            this.a, this.b, this.c, this.d,
            this.e, this.f, this.g, this.h,
            this.i, this.j, this.k, this.l,
            this.m + this.i * delta,
            this.n + this.j * delta,
            this.o + this.k * delta,
            this.p + this.l * delta,
        );
    }

    /** 3D rotation of this Mat4 around the given unit axis by the given angle in radians. */
    public rotate(axis: Vec3, angle: number): Mat4
    {
        let x = axis.x, y = axis.y, z = axis.z;
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        const t = 1 - c;
        const b00 = x * x * t + c;
        const b01 = y * x * t + z * s;
        const b02 = z * x * t - y * s;
        const b10 = x * y * t - z * s;
        const b11 = y * y * t + c;
        const b12 = z * y * t + x * s;
        const b20 = x * z * t + y * s;
        const b21 = y * z * t - x * s;
        const b22 = z * z * t + c;
        return new Mat4(
            this.a * b00 + this.e * b01 + this.i * b02,
            this.b * b00 + this.f * b01 + this.j * b02,
            this.c * b00 + this.g * b01 + this.k * b02,
            this.d * b00 + this.h * b01 + this.l * b02,
            this.a * b10 + this.e * b11 + this.i * b12,
            this.b * b10 + this.f * b11 + this.j * b12,
            this.c * b10 + this.g * b11 + this.k * b12,
            this.d * b10 + this.h * b11 + this.l * b12,
            this.a * b20 + this.e * b21 + this.i * b22,
            this.b * b20 + this.f * b21 + this.j * b22,
            this.c * b20 + this.g * b21 + this.k * b22,
            this.d * b20 + this.h * b21 + this.l * b22,
            this.m, this.n, this.o, this.p,
        );
    }

    /** 3D rotation of this Mat4 around the x-axis by the given angle in radians. */
    public rotateX(angle: number): Mat4
    {
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        return new Mat4(
            this.a, this.b, this.c, this.d,
            this.e * c + this.i * s, this.f * c + this.j * s, this.g * c + this.k * s, this.h * c + this.l * s,
            -this.e * s + this.i * c, -this.f * s + this.j * c, -this.g * s + this.k * c, -this.h * s + this.l * c,
            this.m, this.n, this.o, this.p,
        );
    }

    /** 3D rotation of this Mat4 around the y-axis by the given angle in radians. */
    public rotateY(angle: number): Mat4
    {
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        return new Mat4(
            this.a * c - this.i * s, this.b * c - this.j * s, this.c * c - this.k * s, this.d * c - this.l * s,
            this.e, this.f, this.g, this.h,
            this.a * s + this.i * c, this.b * s + this.j * c, this.c * s + this.k * c, this.d * s + this.l * c,
            this.m, this.n, this.o, this.p,
        );
    }

    /** 3D rotation of this Mat4 around the z-axis by the given angle in radians. */
    public rotateZ(angle: number): Mat4
    {
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        return new Mat4(
            this.a * c + this.e * s, this.b * c + this.f * s, this.c * c + this.g * s, this.d * c + this.h * s,
            -this.a * s + this.e * c, -this.b * s + this.f * c, -this.c * s + this.g * c, -this.d * s + this.h * c,
            this.i, this.j, this.k, this.l,
            this.m, this.n, this.o, this.p,
        );
    }

    /** 3D scaling of this Mat4 by the given Vec3. */
    public scale(v: Vec3 | number, y?: number, z?: number): Mat4
    {
        let x: number;
        if (typeof v === 'number') {
            x = v;
            y = y ?? v;
            z = z ?? v;
        } else {
            x = v.x, y = v.y, z = v.z;
        }
        return new Mat4(
            this.a * x, this.b * x, this.c * x, this.d * x,
            this.e * y, this.f * y, this.g * y, this.h * y,
            this.i * z, this.j * z, this.k * z, this.l * z,
            this.m, this.n, this.o, this.p,
        );
    }

    /** The translation component of this Mat4. */
    public getTranslation(): Vec3
    {
        return new Vec3(this.m, this.n, this.o);
    }

    /** The rotation component of this Mat4. */
    public getMat3(): Mat3
    {
        return new Mat3(
            this.a, this.b, this.c,
            this.e, this.f, this.g,
            this.i, this.j, this.k,
        );
    }

    /** The scaling factors of this Mat4. */
    public getScaling(): Vec3
    {
        return new Vec3(
            Math.hypot(this.a, this.b, this.c),
            Math.hypot(this.e, this.f, this.g),
            Math.hypot(this.i, this.j, this.k));
    }

    /** Allows the use of Mat4 in a for-of loop. */
    *[Symbol.iterator](): Generator<number, void, unknown>
    {
        yield this.a; yield this.b; yield this.c; yield this.d;
        yield this.e; yield this.f; yield this.g; yield this.h;
        yield this.i; yield this.j; yield this.k; yield this.l;
        yield this.m; yield this.n; yield this.o; yield this.p;
    }
}

// This is used to identify Mat4 objects in the code.
// It is stored as a property on the prototype so that does not take up
// any space in the actual object, but one can still access it.
(Mat4.prototype as any).isMat4 = true;

/// This is to identify any glance math primitive in the code.
(Mat4.prototype as any).isMathPrimitive = true;
