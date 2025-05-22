// 1. Data /////////////////////////////////////////////////////////////////

// Vertex Shader Source
const vertexShaderSource = `#version 300 es
    precision highp float;

    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;

    in vec3 a_pos;
    in vec3 a_color;

    out vec4 v_color;

    void main() {
        gl_Position = u_projectionMatrix * u_viewMatrix * u_modelMatrix * vec4(a_pos, 1.0);
        v_color = vec4(a_color, 0.6);
    }`;

// Fragment Shader Source
const fragmentShaderSource = `#version 300 es
    precision mediump float;

    in vec4 v_color;

    out vec4 o_fragColor;

    void main() {
        o_fragColor = v_color;
    }`;

// Attributes
const attributes = {
    a_pos: {
        data: [
            -.5, -.5, +.5,
            +.5, -.5, +.5,
            -.5, +.5, +.5,
            +.5, +.5, +.5,
            -.5, -.5, -.5,
            +.5, -.5, -.5,
            -.5, +.5, -.5,
            +.5, +.5, -.5,
        ],
        height: 3
    },
    a_color: {
        data: [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
            1, 1, 0,
            0, 0, 0,
            1, 0, 1,
            0, 1, 1,
            1, 1, 1,
        ],
        height: 3,
    }
};

// Indices
const indices = [
    0, 1, 2, 1, 3, 2,
    2, 3, 6, 3, 7, 6,
    4, 5, 0, 5, 1, 0,
    4, 0, 6, 0, 2, 6,
    1, 5, 3, 5, 7, 3,
    5, 4, 7, 4, 6, 7,
];

// 2. WebGL 'Building Blocks' //////////////////////////////////////////////

// Basic
const vs = glance.createShader(gl, 'my vertex shader', glance.ShaderStage.VERTEX, vertexShaderSource);
const fs = glance.createShader(gl, 'my fragment shader', glance.ShaderStage.FRAGMENT, fragmentShaderSource);
const abo = glance.createAttributeBuffer(gl, 'my abo', attributes);
const ibo = glance.createIndexBuffer(gl, 'my ibo', indices);

// Compound
const program = glance.createProgram(gl, 'my program', vs, fs);
const vao = glance.createVertexArrayObject(gl, 'my vao', ibo, abo, program);

// Draw Call
const quad = glance.createDrawCall(gl, 'my draw call', vao, program);

// 3. Render Loop //////////////////////////////////////////////////////////

quad.uniform.u_projectionMatrix = glance.Mat4.identity();

gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);

function myRenderLoop({ time })
{
    gl.clear(gl.COLOR_BUFFER_BIT);

    quad.uniform.u_viewMatrix = glance.Mat4.identity();

    quad.uniform.u_modelMatrix = glance.Mat4.rotateY(time / 1000).rotateX(time / 2000);
    glance.draw(gl, quad);
}
setRenderLoop(myRenderLoop);
