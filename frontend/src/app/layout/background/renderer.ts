import FRAGMENT from './shaders/fragment.glsl';
import VERTEX from './shaders/vertex.glsl';

/** Values drawn in one frame. */
export interface BackgroundUniforms {
  /** Pointer position, 0..1 from the bottom left (0.5, 0.5 = centre). */
  pointer: readonly [number, number];
  /** Seconds since start, frozen at 0 when the background stays still. */
  time: number;
  /** 0 = light theme, 1 = dark theme, in between during the fade. */
  dark: number;
}

interface Locations {
  resolution: WebGLUniformLocation | null;
  pointer: WebGLUniformLocation | null;
  time: WebGLUniformLocation | null;
  dark: WebGLUniformLocation | null;
}

/**
 * Draws the animated background (spec 013) on a canvas with plain WebGL: no Angular here,
 * the component decides when to draw. Built by `createBackgroundRenderer`.
 */
export class BackgroundRenderer {
  constructor(
    private readonly gl: WebGLRenderingContext,
    private readonly program: WebGLProgram,
    private readonly buffer: WebGLBuffer,
    private readonly locations: Locations,
  ) {}

  /** Size of the drawing buffer, in device pixels. */
  resize(width: number, height: number) {
    const canvas = this.gl.canvas;
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  draw({ pointer, time, dark }: BackgroundUniforms) {
    const { gl, locations } = this;
    gl.uniform2f(locations.resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(locations.pointer, pointer[0], pointer[1]);
    gl.uniform1f(locations.time, time);
    gl.uniform1f(locations.dark, dark);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Frees the GPU resources and the context. */
  dispose() {
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

/**
 * The renderer, or `null` when the background cannot be drawn (no WebGL, or the shader does not compile):
 * the component then shows the CSS fallback. An expected case, not an error.
 */
export function createBackgroundRenderer(canvas: HTMLCanvasElement): BackgroundRenderer | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = vertex && fragment ? link(gl, vertex, fragment) : null;
  // The program keeps what it needs: the shaders can go.
  if (vertex) gl.deleteShader(vertex);
  if (fragment) gl.deleteShader(fragment);
  if (!program) return null;
  gl.useProgram(program);

  // Full-screen quad, drawn as a triangle strip.
  const buffer = gl.createBuffer();
  if (!buffer) return null;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  return new BackgroundRenderer(gl, program, buffer, {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    pointer: gl.getUniformLocation(program, 'uPointer'),
    time: gl.getUniformLocation(program, 'uTime'),
    dark: gl.getUniformLocation(program, 'uDark'),
  });
}

function compile(gl: WebGLRenderingContext, type: GLenum, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function link(gl: WebGLRenderingContext, vertex: WebGLShader, fragment: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
  gl.deleteProgram(program);
  return null;
}
