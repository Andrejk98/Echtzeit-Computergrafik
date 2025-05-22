/// Create a new, empty WebGL texture of a given size.
function createTexture(gl, name, width, height)
{
    // Create the texture object.
    const texture = gl.createTexture();
    if (texture === null) {
        throw new Error(`Failed to create WebGL texture object for "${name}"`);
    }

    // Define the texture.
    try {
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Load textures with flipped Y coordinates.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        
        // Allocate the texture storage.
        gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);

        // Repeat the texture coordinates.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    }
    catch (error) {
        // Free the texture memory on error and report to the user.
        gl.deleteTexture(texture);
        throw new Error(`Failed to create texture "${name}": ${error.message}`);
    }
    finally {
        // Always unbind the texture.
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    // Return the texture object.
    return {
        name,
        glo: texture,
        target: gl.TEXTURE_2D,
        width,
        height
    };
}

/// (Re-)Define the data of a texture.
function updateTextureData(gl, texture, data)
{
    try {
        gl.bindTexture(gl.TEXTURE_2D, texture.glo);

        // Upload the texture to the GPU.
        gl.texSubImage2D(gl.TEXTURE_2D,
            0, // 0 means the highest resolution mipap
            0, // xOffset
            0, // yOffset
            texture.width,
            texture.height,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            data,
        );

    } finally {
        // Always unbind the texture.
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
}

/// Load an image from an URL and create a WebGL texture from it.
async function loadTexture(gl, url)
{
    // Load the image from the url.
    // The promise is not executed right away, so we will have to wait for it to resolve later.
    const loadImage = new Promise((resolve, reject) =>
    {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.crossOrigin = "anonymous";
        image.src = url;
    });

    // Extract the file name (without extension) from the URL.
    const name = url.split('/').at(-1).split('.').at(0);

    try {
        // Get the image from the URL.
        const image = await loadImage;

        // Once we have it, create the empty WebGL texture.
        const texture = createTexture(gl, name, image.naturalWidth, image.naturalHeight);

        // Define the texture data.
        updateTextureData(gl, texture, image);

        // Return the finished texture.
        return texture;

    } catch (error) {
        throw new Error(`Failed to load texture from url: "${url}": ${error.message}`);
    }
}

// 1. Data /////////////////////////////////////////////////////////////////

// Vertex Shader Source
const vertexShaderSource = `#version 300 es
    precision highp float;

    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;

    in vec3 a_position;
    in vec3 a_normal;
    in vec2 a_textureCoordinate;

    out vec3 f_worldPosition;
    out vec3 f_normal;
    out vec2 f_textureCoordinate;

    void main() {
        vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);
        f_worldPosition = worldPosition.xyz;
        f_normal = (u_modelMatrix * vec4(a_normal, 0)).xyz;
        f_textureCoordinate = a_textureCoordinate * 2.0 - 1.0;
        gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
    }`;

// Fragment Shader Source
const fragmentShaderSource = `#version 300 es
    precision mediump float;

    uniform vec3 u_lightDirection;
    uniform vec3 u_viewPosition;
    uniform sampler2D u_diffuseTexture;

    in vec3 f_worldPosition;
    in vec3 f_normal;
    in vec2 f_textureCoordinate;

    out vec4 o_fragmentColor;

    void main() {
        // Re-normalize the normal which might have shrunk due to interpolation.
        vec3 normal = normalize(f_normal);
        vec3 viewDirection = normalize(u_viewPosition - f_worldPosition);

        // Individual colors for the three terms.
        vec3 diffuseColor = texture(u_diffuseTexture, f_textureCoordinate).rgb;
        vec3 ambientColor = diffuseColor;
        vec3 specularColor = vec3(1.0, 1.0, 1.0);

        // The ambient factor is constant (could be set via a uniform if we wanted).
        float ambientFactor = 0.2;

        // The diffuse factor is dependent on the angle of the surface to the light.
        float diffuseFactor = max(0.0, dot(u_lightDirection, normal)) * (1.0 - ambientFactor);

        // The specular factor is dependent of the view-, the surface- and the light-directions.
        vec3 halfway = normalize(viewDirection + u_lightDirection);
        float specularFactor = pow(max(0.0, dot(normal, halfway)), 128.0) * 0.5;

        // Each terms' color is multiplied with its factor and then added together to get the final color.
        vec3 color = ambientColor * ambientFactor + diffuseColor * diffuseFactor + specularColor * specularFactor;
        o_fragmentColor = vec4(color, 1.0);
    }`;

// Geometry.
const geo = glance.createSphere('my geo', { widthSegments: 64, heightSegments: 32 });

// Texture.
const diffuseTexture = await loadTexture(gl, "https://surfer.teledu.app/hfu/textures/test.webp");

// 2. WebGL 'Building Blocks' //////////////////////////////////////////////

// Basic
const vertexShader = glance.createShader(gl, 'vertex shader', gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = glance.createShader(gl, 'fragment shader', gl.FRAGMENT_SHADER, fragmentShaderSource);
const abo = glance.createAttributeBuffer(gl, 'abo', {
    a_position: {
        data: geo.positions,
        height: 3
    },
    a_normal: {
        data: geo.normals,
        height: 3
    },
    a_textureCoordinate: {
        data: geo.texCoords,
        height: 2
    },
});
const ibo = glance.createIndexBuffer(gl, 'ibo', geo.indices);

// Compound
const program = glance.createProgram(gl, 'program', vertexShader, fragmentShader);
const vao = glance.createVertexArrayObject(gl, 'vao', ibo, abo, program);

// Draw Call
const drawCall = glance.createDrawCall(gl, 'draw call', vao, program, {
    uniforms: {
        u_lightDirection: Vec3.of(1, 1, 1).normalize(),
    },
    textures: {
        u_diffuseTexture: diffuseTexture,
    }
});

// 3. Render Loop ///////////////////////////////////////////////////////////

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);

const orbitPan = Sticky("orbitPan", 0);
const orbitTilt = Sticky("orbitTilt", 0);
const orbitDistance = Sticky("orbitDistance", 3);

function myRenderLoop({ globalTime })
{
    // Always clear the canvas before drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // The camera position is the same for all draw calls.
    const viewPosition = Vec3.translateZ(orbitDistance.get()).rotateX(orbitTilt.get()).rotateY(orbitPan.get());

    // Sphere
    drawCall.uniform.u_viewPosition = viewPosition;
    drawCall.uniform.u_modelMatrix = Mat4.rotateY(globalTime / 10000);
    drawCall.uniform.u_viewMatrix = Mat4.lookAt(viewPosition, Vec3.zero(), Vec3.yAxis());
    drawCall.uniform.u_projectionMatrix = Mat4.perspective(Math.PI / 4, 1, 0.1, 10);
    glance.draw(gl, drawCall);
}
setRenderLoop(myRenderLoop);

onMouseDrag((e) =>
{
    orbitPan.update((v) => v - e.movementX * 0.01);
    orbitTilt.update((v) => glance.clamp(v - e.movementY * 0.01, -Math.PI / 2, Math.PI / 2));
});

onMouseWheel((e) =>
{
    orbitDistance.update((v) => glance.clamp(v * (1 + e.deltaY * 0.001), 1.0, 9.0));
});
