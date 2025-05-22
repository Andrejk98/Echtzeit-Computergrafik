export
{
    FramebufferStack,
    loadCubemap,
    loadDataVolume,
    loadTexture,
    Profiler,
    WebGLTimer,
};


import
{
    logWarning,
    throwError,
} from "./dev";
import
{
    clamp
} from "./math/common.ts";
import
{
    createTexture,
    updateTextureData,
} from "./core";
import
{
    loadHDR,
} from "./assets/hdr";
import
{
    TextureFilter,
    TextureInternalFormat,
} from "./types";
import type {
    Framebuffer,
    Texture,
    WebGL2,
} from "./types";


// =============================================================================
// Textures
// =============================================================================


/**
 * Options for creating and updating a texture.
 */
type TextureOptions = Parameters<typeof createTexture>[4] & Parameters<typeof updateTextureData>[3];


/**
 * Options for creating a 3D texture from a series of 2D textures.
 */
type DataVolumeOptions = TextureOptions & {
    /** Minimum of the input data, defaults to 0 */
    input_min?: number,

    /** Maximum of the input data, defaults to 255 */
    input_max?: number,

    /** Minimum of the output data, defaults to 0 */
    output_min?: number,

    /** Maximum of the output data, defaults to 1 */
    output_max?: number,
};


/**
 * Load an image from an URL and create a WebGL texture from it.
 * @param gl The WebGL2 context.
 * @param url The URL of the image to load.
 * @param options Optional texture creation options, forwarded to `createTexture`.
 * @returns A promise that resolves to the loaded texture.
 */
async function loadTexture(
    gl: WebGL2,
    url: string,
    options: TextureOptions = {}): Promise<Texture>
{
    // Extract the file name (without extension) from the URL.
    const name = url.split('/').at(-1).split('.').at(0);

    let texture: Texture | undefined;
    try {
        // Load an HDR texture if the URL ends with ".hdr".
        if (url.endsWith('.hdr')) {
            // The srcDataType option must be gl.FLOAT for HDR textures.
            if (options.srcDataType !== undefined && options.srcDataType !== gl.FLOAT) {
                logWarning(() => `Ignoring srcDataType option for HDR texture: ${options.srcDataType}`);
            }

            // The default internal format for HDR textures is R11F_G11F_B10F.
            if (options.internalFormat === undefined) {
                options.internalFormat = TextureInternalFormat.R11F_G11F_B10F;
            }

            // Load the HDR image and create the texture.
            const hdrImage = await loadHDR(new URL(url, window.location.href));
            texture = createTexture(gl, name, hdrImage.width, hdrImage.height, options);

            // Update the texture data.
            updateTextureData(gl, texture, hdrImage.data, { ...options, srcDataType: gl.FLOAT });
        }

        // Otherwise, load a regular image.
        else {
            // Load the image from the url.
            // The promise is not executed right away, so we will have to wait for it to resolve later.
            const loadImage: Promise<HTMLImageElement> = new Promise((resolve, reject) =>
            {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                if ((new URL(url, window.location.href)).origin !== window.location.origin) {
                    image.crossOrigin = "anonymous";
                }
                image.src = url;
            });

            // Get the image from the URL
            const image: HTMLImageElement = await loadImage;

            // Once we have it, create the empty WebGL texture.
            texture = createTexture(gl, name, image.naturalWidth, image.naturalHeight, options);

            // Define the texture data.
            updateTextureData(gl, texture, image, options);
        }

        // Return the finished texture.
        return texture;
    }

    // If an error occurs, clean up and re-throw the error.
    catch (error) {
        if (texture !== undefined) {
            gl.deleteTexture(texture.glo);
        }
        throwError(() => `Failed to create texture from url: "${url}": ${(error as any).message}`);
    }
}


/**
 * Load a cubemap texture from 6 URLs.
 * @param gl The WebGL2 context.
 * @param urls An array of 6 URLs, one for each face of the cubemap.
 * The order of the URLs should be:
 * - +X (right)
 * - -X (left)
 * - +Y (top)
 * - -Y (bottom)
 * - +Z (front)
 * - -Z (back)
 * @returns A promise that resolves to the loaded cubemap texture.
 */
async function loadCubemap(
    gl: WebGL2,
    urls: [string, string, string, string, string, string],
    options: TextureOptions = {}): Promise<Texture>
{
    // Ensure that we have exactly 6 URLs.
    if (urls.length !== 6) {
        throw new Error(`loadCubemap requires 6 URLs, got ${urls.length}`);
    }

    // Load all images from the URLs.
    const loadImages: Array<Promise<HTMLImageElement>> = urls.map((url) =>
        new Promise((resolve, reject) =>
        {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            if ((new URL(url, window.location.href)).origin !== window.location.origin) {
                image.crossOrigin = "anonymous";
            }
            image.src = url;
        }
        ));

    // Extract the file name (without extension) from the URL.
    let name = urls[0].split('/').at(-1).split('.').at(0);
    if (name.endsWith('-px')) {
        name = name.slice(0, -3);
    } else if (name.endsWith('-right')) {
        name = name.slice(0, -6);
    }

    try {
        // Get the image from the URL
        const images: Array<HTMLImageElement> = await Promise.all(loadImages);

        // Check that all images have the same dimensions.
        const [width, height] = [images[0].naturalWidth, images[0].naturalHeight];
        for (let i = 1; i < 6; i++) {
            if (images[i].naturalWidth !== width || images[i].naturalHeight !== height) {
                throwError(() => `Cubemap images at index 0 and ${i} have different dimensions: ${width}x${height} vs ${images[i].naturalWidth}x${images[i].naturalHeight}`);
            }
        }

        // Once we have it, create the empty WebGL texture.
        const texture: Texture = createTexture(gl, name, width, height, { ...options, target: gl.TEXTURE_CUBE_MAP });

        // Update the 6 sides of the cube map texture individually
        for (let i = 0; i < 6; i++) {
            updateTextureData(gl, texture, images[i], { ...options, dataTarget: gl.TEXTURE_CUBE_MAP_POSITIVE_X + i });
        }

        // Return the finished texture.
        return texture;

    } catch (error) {
        throwError(() => `Failed to create cubemap texture from urls: "${urls}": ${(error as any).message}`);
    }
}


/**
 * Load the data of a 3D Texture from a series of "slices" (2D textures).
 * This has slightly different defaults than `loadTexture`.
 * @param gl WebGL2 context.
 * @param name Name of the volume.
 * @param urls URLs of the slices.
 * @param options Additional texture options, including those with different defaults:
 * - `levels`: Number of mipmap levels to create, defaults to 1.
 * - `filter`: Texture (min/mag) filter(s), defaults to `TextureFilter.LINEAR`.
 * - `internalFormat`: Texture internal format, defaults to `TextureInternalFormat.R16F`.
 */
async function loadDataVolume(
    gl: WebGL2,
    urls: Array<string>,
    options: DataVolumeOptions = {}
): Promise<Texture>
{
    // Load all images from the URLs.
    let [width, height]: [number | undefined, number | undefined] = [undefined, undefined];
    const depth = urls.length;
    const images: Array<Promise<HTMLImageElement>> = [];
    for (let urlItr of urls) {
        images.push(new Promise((resolve, reject) =>
        {
            const url = urlItr; // local copy for closure
            let image: HTMLImageElement | null = new Image();
            image.onload = () =>
            {
                // Check that all images have the same dimensions.
                if (width === undefined && height === undefined) {
                    width = image!.naturalWidth;
                    height = image!.naturalHeight;
                } else {
                    if (image!.naturalWidth !== width || image!.naturalHeight !== height) {
                        reject(new Error(`Data volume slices must have the same dimensions, but slice ${url} has dimensions ${image!.naturalWidth}x${image!.naturalHeight} instead of ${width}x${height}`));
                    }
                }
                resolve(image);
            };
            image.onerror = reject;
            if ((new URL(url, window.location.href)).origin !== window.location.origin) {
                image.crossOrigin = "anonymous";
            }
            image.src = url;
        }));
    }

    // Extract the file name (without extension) from the URL.
    let name = urls[0].split('/').at(-1).split('.').at(0);
    name = name.replace(/[-_.]*\d+$/, ''); // remove trailing numbers including separators '-', '_' and '.'

    // Wait for all images to load.
    await Promise.all(images);
    if (width === undefined || height === undefined || images.length === 0) {
        throwError(() => "No slices were loaded");
    }

    // We need to draw the slices onto the canvas to access the pixel data.
    const drawCanvas = new OffscreenCanvas(width, height);
    let ctx: OffscreenCanvasRenderingContext2D | null = drawCanvas.getContext("2d", {
        willReadFrequently: true,
    });
    if (ctx === null) {
        throwError(() => "Failed to create 2D context for offscreen canvas");
    }

    // Create the volume texture.
    const volumeTexture = createTexture(gl, name, width, height,
        {
            target: gl.TEXTURE_3D,
            depth,
            levels: options.levels ?? 1,
            filter: options.filter ?? TextureFilter.LINEAR,
            internalFormat: options.internalFormat ?? TextureInternalFormat.R16F,
        },
    );

    // Define the data.
    try {
        gl.bindTexture(gl.TEXTURE_3D, volumeTexture.glo);

        // Define the input and output ranges for normalization.
        const input_min = options.input_min ?? 0;
        const input_max = options.input_max ?? 255;
        const output_min = options.output_min ?? 0;
        const output_max = options.output_max ?? 1;
        const inputRange = input_max - input_min;
        const outputRange = output_max - output_min;

        // Copy the normalized data into the volume texture.
        for (let sliceIdx = 0; sliceIdx < depth; sliceIdx++) {

            // Draw the slice onto the offscreen canvas to access the pixel data.
            const image = await images[sliceIdx];
            ctx.drawImage(image, 0, 0);
            const imageData: ImageData = ctx.getImageData(0, 0, width, height);
            const pixelData: Uint8ClampedArray = new Uint8ClampedArray(imageData.data.buffer);
            if (pixelData.length !== width * height * 4) {
                throwError(() => `Unexpected pixel data length: ${pixelData.length} instead of ${width! * height! * 4}`);
            }

            // Transform the 8 bit pixel data into 32 bit floating data.
            const realData: Float32Array = new Float32Array(width * height);
            for (let i = 0; i < realData.length; i++) {
                const value = clamp(pixelData[i * 4], input_min, input_max);
                realData[i] = output_min + ((value - input_min) / inputRange) * outputRange;
            }

            // Copy the normalized data into the volume texture.
            gl.texSubImage3D(gl.TEXTURE_3D, 0, 0, 0, sliceIdx, width, height, 1, gl.RED, gl.FLOAT, realData);
        }

        // Generate mipmaps if requested.
        if (options.levels !== 1) {
            gl.generateMipmap(gl.TEXTURE_3D);
        }

        // Return the finished volume texture.
        return volumeTexture;
    }

    // If an error occurs, clean up and re-throw the error.
    catch (error) {
        gl.deleteTexture(volumeTexture.glo);
        throwError(() => `Failed to create volume data texture "${name}": ${(error as any).message}`);
    }

    // Always clean up after yourself.
    finally {
        gl.bindTexture(gl.TEXTURE_3D, null);
    }
}


// =============================================================================
// Framebuffers
// =============================================================================


/**
 * Helper class to manage a stack of framebuffers.
 * When a framebuffer is pushed onto the stack, it is bound and the viewport is set.
 * When a framebuffer is popped from the stack, the previous framebuffer is bound
 * and the viewport is set.
 * If the stack is empty, the default framebuffer is bound.
 */
class FramebufferStack
{
    /**
     * The stack of framebuffers.
     * The first buffer is the read buffer, the second buffer is the draw buffer.
     * The draw buffer can be explicitly set to `null` to write to the default framebuffer.
     * If the draw buffer is undefined, the read buffer is also used as the draw buffer.
     */
    private _stack: Array<[Framebuffer, Framebuffer | null | undefined]> = [];

    /**
     * Pushes the given framebuffer onto the stack and binds it.
     * @param gl The WebGL2 context.
     * @param framebuffer The framebuffer to push.
     *  Is only used as the read buffer if `drawBuffer` is defined.
     * @param drawBuffer The framebuffer to draw into.
     *  Can be explicitly set to `null` to write to the default framebuffer.
     *  Undefined by default, which means that the `framebuffer` is bound as both
     *  the read and draw framebuffer.
     */
    public push(gl: WebGL2RenderingContext, framebuffer: Framebuffer, drawBuffer?: Framebuffer | null): void
    {
        // Passing the same framebuffer as read and draw buffer is the same as passing
        // only a single framebuffer.
        if (drawBuffer === framebuffer) {
            drawBuffer = undefined;
        }

        // If the given framebuffer setup is already bound, do nothing.
        const [currentReadBuffer, currentDrawBuffer] = this._stack.at(-1) ?? [null, undefined];
        if (currentReadBuffer === framebuffer && currentDrawBuffer === drawBuffer) {
            return;
        }// TODO: this is wrong. Always push, even if the same framebuffer is bound
        //  just don't re-bind it. Conversely, always pop and if the next framebuffer
        //  on the stack, just don't re-bind it.

        // Push the given framebuffer onto the stack.
        this._stack.push([framebuffer, drawBuffer]);

        // Bind the new framebuffer and set the viewport.
        try {
            this._bindFramebuffer(gl, framebuffer, drawBuffer);
        }
        // If an error occurs, pop the framebuffer from the stack and re-throw the error.
        catch (e) {
            this.pop(gl);
            throw e;
        }
    } // TODO: this design does not allow one to read from the default framebuffer

    /**
     * Pops the top framebuffer from the stack and binds the previous framebuffer.
     * If the stack is empty, the default framebuffer is bound.
     * @param gl The WebGL2 context.
     * @param count Number of framebuffers to pop, defaults to 1.
     */
    public pop(gl: WebGL2RenderingContext, count: number = 1): void
    {
        count = Math.max(0, count);
        for (let i = 0; i < count; i++) {
            // Remove the top framebuffer from the stack.
            this._stack.pop();

            // Bind the previous framebuffer, or the default framebuffer if the stack is empty.
            // Any error doing so is not recoverable, so we do not try to handle it.
            const [previousReadBuffer, previousDrawBuffer] = this._stack.at(-1) ?? [null, undefined];
            this._bindFramebuffer(gl, previousReadBuffer, previousDrawBuffer);
        }
    }

    /**
     * Bind the new framebuffer and set the viewport.
     */
    private _bindFramebuffer(gl: WebGL2RenderingContext, readBuffer: Framebuffer | null, drawBuffer?: Framebuffer | null): void
    {
        // No separate read and draw buffers.
        if (drawBuffer === undefined) {
            const [width, height] = readBuffer === null
                ? [gl.canvas.width, gl.canvas.height]
                : getFramebufferSize(readBuffer);
            gl.bindFramebuffer(gl.FRAMEBUFFER, readBuffer?.glo ?? null);
            gl.viewport(0, 0, width, height);
        }
        // Separate read and draw buffers.
        else {
            const [width, height] = drawBuffer === null
                ? [gl.canvas.width, gl.canvas.height]
                : getFramebufferSize(drawBuffer);
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, readBuffer?.glo ?? null);
            gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, drawBuffer?.glo ?? null);
            gl.viewport(0, 0, width, height);
        }
    }
}


/**
 * The size of the framebuffer is the size of any of its attachments.
 */
function getFramebufferSize(framebuffer: Framebuffer): [number, number]
{
    if (framebuffer.color.length > 0) {
        const attachment = framebuffer.color[0].attachment;
        return [attachment.width, attachment.height];
    } else if (framebuffer.depth !== null) {
        const attachment = framebuffer.depth.attachment;
        return [attachment.width, attachment.height];
    } else if (framebuffer.stencil !== null) {
        const attachment = framebuffer.stencil.attachment;
        return [attachment.width, attachment.height];
    } else {
        throwError(() => `Framebuffer ${framebuffer.name} has no attachments`);
    }
}

// =============================================================================
// Profiling
// =============================================================================


class WebGLTimer
{
    private _ext: any;
    private _query: WebGLQuery | null;

    constructor(gl: WebGL2, ext: any)
    {
        this._ext = ext;
        this._query = gl.createQuery();
        gl.beginQuery(this._ext.TIME_ELAPSED_EXT, this._query as WebGLQuery);
    }

    public stop(gl: WebGL2, callback: (ms: number) => void): void
    {
        gl.endQuery(this._ext.TIME_ELAPSED_EXT);
        const checkResult = () =>
        {
            // If the query was deleted, do nothing.
            if (this._query === null) {
                logWarning(() => "WebGLTimer query has ended already");
                return;
            }

            const available = gl.getQueryParameter(this._query, gl.QUERY_RESULT_AVAILABLE);
            const disjoint = gl.getParameter(this._ext.GPU_DISJOINT_EXT);

            // If the result is available and not disjoint, call the callback.
            if (available && !disjoint) {
                const timeElapsed = gl.getQueryParameter(this._query, gl.QUERY_RESULT);
                callback(timeElapsed / 1000000);
            }

            // If the result is available, or something went wrong, delete the query.
            if (available || disjoint) {
                gl.deleteQuery(this._query);
                this._query = null;
                return;
            }

            // Otherwise, check again in the next frame.
            requestAnimationFrame(checkResult);
        };
        setTimeout(checkResult, 0);
    }
}

class Profiler
{
    private _ext: any;

    constructor(gl: WebGL2)
    {
        this._ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
        if (this._ext === null) {
            this._ext = gl.getExtension('EXT_disjoint_timer_query');
        }
        if (this._ext === null) {
            throwError(() => "WebGL2 Timer Query extension not supported. In Firefox, enable `webgl.enable-privileged-extensions` in `about:config`");
        }
    }

    public start(gl: WebGL2): WebGLTimer
    {
        return new WebGLTimer(gl, this._ext);
    }
}
