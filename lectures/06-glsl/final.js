// Compile the fragment shader first.
const fragmentShaderSource = `#version 300 es
precision mediump float;

uniform float u_time;

out vec4 o_fragColor;

void main() {
    const float radius = 0.5;
    const float halfRingWidth = 0.05;
    const float halfRingBlur = 0.01;
    const float scale = 8.0;

    vec2 fragCoord = gl_FragCoord.xy / 420.0;
    fragCoord -= vec2(0.5);
    fragCoord *= 2.0;

    float time = u_time / -1000.0;
    float centerDistance = length(fragCoord);
    float inside = centerDistance < radius ? 1.0 : 0.0;
    float ringDistance = centerDistance - radius;
    ringDistance = sin(ringDistance * scale + time) / scale;
    ringDistance = abs(ringDistance);

    float activation = 1.0 - smoothstep(
        halfRingWidth - halfRingBlur,
        halfRingWidth + halfRingBlur,
        ringDistance);
    o_fragColor = vec4(activation, activation, activation, 1.0);
}`;
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

// Check for compilation errors.
if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(fragmentShader);
    gl.deleteShader(fragmentShader);
    throw new Error(`${info}`);
}

// Create the pre-built vertex shader.
const vertexShaderSource = `#version 300 es
precision highp float;
in vec2 a_pos;
void main(){
    gl_Position = vec4(a_pos, 0, 1);
}`;
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

// Link the two shaders.
const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram), gl.useProgram(shaderProgram);

// Check for linking errors.
if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(shaderProgram);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteProgram(shaderProgram);
    throw new Error(`${info}`);
}

const vertexPositions = new Float32Array([-.9, -.9, .9, -.9, -.9, .9, .9, .9]);
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertexPositions, gl.STATIC_DRAW);

const faceIndices = new Uint16Array([0, 1, 2, 1, 3, 2]);
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, faceIndices, gl.STATIC_DRAW);

const vertexAttribute = gl.getAttribLocation(shaderProgram, `a_pos`);
gl.enableVertexAttribArray(vertexAttribute);
gl.vertexAttribPointer(vertexAttribute, 2, gl.FLOAT, 1, 8, 0);

const timeUniform = gl.getUniformLocation(shaderProgram, `u_time`);

function myRenderLoop({ time })
{
    gl.uniform1f(timeUniform, time);
    gl.drawElements(gl.TRIANGLES, faceIndices.length, gl.UNSIGNED_SHORT, 0);
}
setRenderLoop(myRenderLoop);
