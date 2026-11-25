import FRAGMENT from './shaders/fragment.glsl';
import TRAIL from './shaders/trail.glsl';
import VERTEX from './shaders/vertex.glsl';

/** Values drawn in one frame. */
export interface BackgroundUniforms {
  /** Where the halos lean to: the smoothed pointer, 0..1 from the bottom left (0.5, 0.5 = centre). */
  pointer: readonly [number, number];
  /** Real pointer position, and its position at the previous frame: the trail is painted along that segment. */
  cursor: readonly [number, number];
  previousCursor: readonly [number, number];
  /** Pointer velocity, in units per second (0 when it is outside the window). */
  velocity: readonly [number, number];
  /** Seconds since the previous frame; 0 = no trail step (still background). */
  step: number;
  /** Seconds since start, frozen at 0 when the background stays still. */
  time: number;
  /** 0 = light theme, 1 = dark theme, in between during the fade. */
  dark: number;
}

/** The trail field is computed at a quarter of the canvas resolution: it is blurry by nature. */
const TRAIL_SCALE = 4;

type Locations<K extends string> = Record<K, WebGLUniformLocation | null>;

/** One texture of the trail field and the framebuffer that renders into it. */
interface Target {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
}

/**
 * Draws the animated background (spec 013) on a canvas with plain WebGL: no Angular here,
 * the component decides when to draw. Built by `createBackgroundRenderer`.
 * Two passes per frame: the fluid trail (ping-pong between two small textures), then the background.
 */
export class BackgroundRenderer {
  /** `targets[0]` holds the latest trail field, `targets[1]` receives the next one. */
  private targets: [Target, Target] | null = null;
  private trailSize = [1, 1];

  constructor(
    private readonly gl: WebGLRenderingContext,
    private readonly buffer: WebGLBuffer,
    private readonly background: { program: WebGLProgram; at: Locations<'resolution' | 'pointer' | 'time' | 'dark' | 'trail'> },
    private readonly trail: {
      program: WebGLProgram;
      at: Locations<'previous' | 'texel' | 'cursor' | 'previousCursor' | 'velocity' | 'step' | 'aspect'>;
    },
  ) {}

  /** Size of the drawing buffer, in device pixels. The trail field is rebuilt, empty. */
  resize(width: number, height: number) {
    const { gl } = this;
    const canvas = gl.canvas;
    if (canvas.width === width && canvas.height === height && this.targets) return;
    canvas.width = width;
    canvas.height = height;
    this.trailSize = [Math.max(1, Math.round(width / TRAIL_SCALE)), Math.max(1, Math.round(height / TRAIL_SCALE))];
    this.deleteTargets();
    this.targets = [this.createTarget(), this.createTarget()];
    this.clearTrail();
  }

  /** Empties the trail (still background: no trail). */
  clearTrail() {
    const { gl } = this;
    gl.clearColor(0.5, 0.5, 0, 1); // 0.5 = no velocity
    for (const target of this.targets ?? []) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  draw(u: BackgroundUniforms) {
    const { gl } = this;
    if (!this.targets) return;
    const [width, height] = [gl.canvas.width, gl.canvas.height];

    // 1. Trail: one simulation step, from targets[0] into targets[1], then swap.
    if (u.step > 0) {
      const { program, at } = this.trail;
      const [from, to] = this.targets;
      gl.useProgram(program);
      gl.bindFramebuffer(gl.FRAMEBUFFER, to.framebuffer);
      gl.viewport(0, 0, this.trailSize[0], this.trailSize[1]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, from.texture);
      gl.uniform1i(at.previous, 0);
      gl.uniform2f(at.texel, 1 / this.trailSize[0], 1 / this.trailSize[1]);
      gl.uniform2f(at.cursor, u.cursor[0], u.cursor[1]);
      gl.uniform2f(at.previousCursor, u.previousCursor[0], u.previousCursor[1]);
      gl.uniform2f(at.velocity, u.velocity[0], u.velocity[1]);
      gl.uniform1f(at.step, u.step);
      gl.uniform1f(at.aspect, width / height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      this.targets = [to, from];
    }

    // 2. Background, reading the latest trail field.
    const { program, at } = this.background;
    gl.useProgram(program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.targets[0].texture);
    gl.uniform1i(at.trail, 0);
    gl.uniform2f(at.resolution, width, height);
    gl.uniform2f(at.pointer, u.pointer[0], u.pointer[1]);
    gl.uniform1f(at.time, u.time);
    gl.uniform1f(at.dark, u.dark);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /** Frees the GPU resources and the context. */
  dispose() {
    const { gl } = this;
    this.deleteTargets();
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.background.program);
    gl.deleteProgram(this.trail.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  /** RGBA 8-bit texture (no extension needed in WebGL 1), linear filtering, clamped edges. */
  private createTarget(): Target {
    const { gl } = this;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.trailSize[0], this.trailSize[1], 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const framebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { texture, framebuffer };
  }

  private deleteTargets() {
    for (const { texture, framebuffer } of this.targets ?? []) {
      this.gl.deleteFramebuffer(framebuffer);
      this.gl.deleteTexture(texture);
    }
    this.targets = null;
  }
}

/**
 * The renderer, or `null` when the background cannot be drawn (no WebGL, or a shader does not compile):
 * the component then shows the CSS fallback. An expected case, not an error.
 */
export function createBackgroundRenderer(canvas: HTMLCanvasElement): BackgroundRenderer | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return null;

  const background = program(gl, VERTEX, FRAGMENT);
  const trail = program(gl, VERTEX, TRAIL);
  const buffer = gl.createBuffer();
  if (!background || !trail || !buffer) return null;

  // Full-screen quad, drawn as a triangle strip; both programs share the same `aPosition` attribute.
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  for (const p of [background, trail]) {
    const position = gl.getAttribLocation(p, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }

  const at = <K extends string>(p: WebGLProgram, names: Record<K, string>) =>
    Object.fromEntries(Object.entries(names).map(([key, name]) => [key, gl.getUniformLocation(p, name as string)])) as Locations<K>;

  return new BackgroundRenderer(
    gl,
    buffer,
    {
      program: background,
      at: at(background, { resolution: 'uResolution', pointer: 'uPointer', time: 'uTime', dark: 'uDark', trail: 'uTrail' }),
    },
    {
      program: trail,
      at: at(trail, {
        previous: 'uPrevious',
        texel: 'uTexel',
        cursor: 'uCursor',
        previousCursor: 'uPreviousCursor',
        velocity: 'uVelocity',
        step: 'uStep',
        aspect: 'uAspect',
      }),
    },
  );
}

/** Compiled and linked program, or `null`. The shaders are deleted: the program keeps what it needs. */
function program(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const linked = vertex && fragment ? link(gl, vertex, fragment) : null;
  if (vertex) gl.deleteShader(vertex);
  if (fragment) gl.deleteShader(fragment);
  return linked;
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
  const linked = gl.createProgram();
  if (!linked) return null;
  gl.attachShader(linked, vertex);
  gl.attachShader(linked, fragment);
  gl.linkProgram(linked);
  if (gl.getProgramParameter(linked, gl.LINK_STATUS)) return linked;
  gl.deleteProgram(linked);
  return null;
}
