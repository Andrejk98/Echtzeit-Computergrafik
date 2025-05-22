// Load textures with flipped Y coordinates.
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

// Data Definition /////////////////////////////////////////////////////////

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
        // First, we transform the attribute position from local space into world space.
        vec4 worldPosition = u_modelMatrix * vec4(a_position, 1.0);

        // Pass the world space coordinate to the fragment shader.
        f_worldPosition = worldPosition.xyz;

        // The normal has to be transformed similar to a position, but as a direction.
        f_normal = (u_modelMatrix * vec4(a_normal, 0)).xyz;

        // The texture coordinate is passed to the fragment shader unchanged.
        f_textureCoordinate = a_textureCoordinate;

        // We need the vertex position in clip space.
        gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
    }`;

// Fragment Shader Source
const fragmentShaderSource = `#version 300 es
    precision mediump float;

    uniform vec3 u_lightDirection;
    uniform vec3 u_viewPosition;
    uniform sampler2D u_diffuseTexture;
    uniform sampler2D u_specularTexture;

    in vec3 f_worldPosition;
    in vec3 f_normal;
    in vec2 f_textureCoordinate;

    out vec4 o_fragmentColor;

    void main() {
        // Re-normalize the normal which might have shrunk due to interpolation.
        vec3 normal = normalize(f_normal);
        vec3 viewDirection = normalize(u_viewPosition - f_worldPosition);

        // Individual colors for two of the three terms.
        vec3 diffuseColor = texture(u_diffuseTexture, f_textureCoordinate).rgb;
        vec3 specularColor = texture(u_specularTexture, f_textureCoordinate).rgb;

        // Use the diffuse color as the ambient as well so the texture does not "wash out".
        vec3 ambientColor = diffuseColor;

        // The ambient factor is constant (could be set via a uniform if we wanted).
        float ambientFactor = 0.15;

        // The diffuse factor is dependent on the angle of the surface to the light.
        float diffuseFactor = max(0.0, dot(u_lightDirection, normal)) * (1.0 - ambientFactor);

        // The specular factor is dependent of the view-, the surface- and the light-directions.
        vec3 halfway = normalize(viewDirection + u_lightDirection);
        float specularFactor = pow(max(0.0, dot(normal, halfway)), 128.0) * 0.8;

        // Each terms' color is multiplied with its factor and then added together to get the final color.
        vec3 color = ambientColor * ambientFactor + diffuseColor * diffuseFactor + specularColor * specularFactor;
        o_fragmentColor = vec4(color, 1.0);
    }`;

// Geometry.
const boardGeo = await glance.loadObj("https://surfer.teledu.app/hfu/geometry/chess-board.obj");
const knightGeo = await glance.loadObj("https://surfer.teledu.app/hfu/geometry/chess-knight.obj");
// other objs are: chess-[bishop, king, pawn, queen, rook].obj

// Texture.
const boardDiffuse = await glance.loadTexture(gl, "https://surfer.teledu.app/hfu/textures/chess-board-diffuse.webp");
const boardSpecular = await glance.loadTexture(gl, "https://surfer.teledu.app/hfu/textures/chess-board-specular.webp");
const piecesBlackDiffuse = await glance.loadTexture(gl, "https://surfer.teledu.app/hfu/textures/chess-pieces-black-diffuse.webp");
const piecesBlackSpecular = await glance.loadTexture(gl, "https://surfer.teledu.app/hfu/textures/chess-pieces-black-specular.webp");
// other textures are: chess-pieces-white-[diffuse, specular].webp

// Shaders
const vertexShader = glance.createShader(gl, 'vertex shader', gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = glance.createShader(gl, 'fragment shader', gl.FRAGMENT_SHADER, fragmentShaderSource);

// Helper ///////////////////////////////////////////////////////////////////

function createDrawCall(geo, name)
{
    const abo = glance.createAttributeBuffer(gl, `${name}-abo`, {
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
    const ibo = glance.createIndexBuffer(gl, `${name}-ibo`, geo.indices);

    // Compound
    const program = glance.createProgram(gl, `${name}-program`, vertexShader, fragmentShader);
    const vao = glance.createVertexArrayObject(gl, `${name}-vao`, ibo, abo, program);

    // Draw Call
    const drawCall = glance.createDrawCall(gl, `${name}-draw call`, vao, program, {
        cullFace: gl.BACK,
        depthTest: gl.LESS,
    });

    drawCall.uniform.u_projectionMatrix = projectionMatrix;
    drawCall.uniform.u_lightDirection = lightDirection;
    drawCall.uniform.u_diffuseTexture = 0;
    drawCall.uniform.u_specularTexture = 1;

    return drawCall;
}

function renderDrawCall(drawCall, camPos, diffuse, specular, modelMatrix)
{
    gl.activeTexture(gl.TEXTURE0 + 0);
    gl.bindTexture(gl.TEXTURE_2D, diffuse.glo);
    gl.activeTexture(gl.TEXTURE0 + 1);
    gl.bindTexture(gl.TEXTURE_2D, specular.glo);

    drawCall.uniform.u_modelMatrix = modelMatrix;
    drawCall.uniform.u_viewMatrix = Mat4.lookAt(camPos, Vec3.zero(), Vec3.yAxis());
    drawCall.uniform.u_viewPosition = camPos;

    glance.draw(gl, drawCall);
}

// Render Loop /////////////////////////////////////////////////////////////

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);

const orbitPan = Sticky("orbitPan", 0);
const orbitTilt = Sticky("orbitTilt", 0);
const orbitDistance = Sticky("orbitDistance", 3);

const lightDirection = Vec3.of(1, 1, 1).normalize();
const projectionMatrix = Mat4.perspective(Math.PI / 4, 1, 0.1, 15);

const boardDrawCall = createDrawCall(boardGeo, "board");
const knightDrawCall = createDrawCall(knightGeo, "knight");

function renderLoop({ globalTime })
{
    // Always clear the canvas before drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // This is the same for all geometry.
    const viewPosition = Vec3.translateZ(orbitDistance.get()).rotateX(orbitTilt.get()).rotateY(orbitPan.get());

    // Board
    renderDrawCall(boardDrawCall, viewPosition, boardDiffuse, boardSpecular, Mat4.identity());

    // Knight
    renderDrawCall(knightDrawCall, viewPosition, piecesBlackDiffuse, piecesBlackSpecular, Mat4.translate(+0.3, 0.17, 0.3).rotateY(Math.PI + 0.4));
}
setRenderLoop(renderLoop);

onMouseDrag((e) =>
{
    orbitPan.update((v) => v - e.movementX * 0.01);
    orbitTilt.update((v) => glance.clamp(v - e.movementY * 0.01, -Math.PI / 2, Math.PI / 2));
});

onMouseWheel((e) =>
{
    orbitDistance.update((v) => glance.clamp(v * (1 + e.deltaY * 0.001), 1.0, 9.0));
});
