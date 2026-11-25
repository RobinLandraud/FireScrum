// Fluid trail behind the pointer (spec 013), WebGL 1 (GLSL ES 1.00).
// One simulation step of a "current" field, at a quarter of the canvas resolution, read from the
// previous step (ping-pong textures). Velocity is stored in RGBA8 (no float texture extension needed):
// red / green = x / y velocity, encoded from -1..1 to 0..1.
precision mediump float;

uniform sampler2D uPrevious; // field of the previous step
uniform vec2 uTexel;         // size of one texel (1 / field size)
uniform vec2 uCursor;        // real pointer position, 0..1 from the bottom left
uniform vec2 uPreviousCursor; // its position at the previous step: the brush covers the whole segment
uniform vec2 uVelocity;      // pointer velocity, field units per second (0 when it left the window)
uniform float uStep;         // seconds since the previous step
uniform float uAspect;       // width / height: round brush whatever the window shape

vec2 decode(vec2 c) {
  return c * 2.0 - 1.0;
}

vec2 sampleField(vec2 uv) {
  return decode(texture2D(uPrevious, uv).rg);
}

void main() {
  vec2 uv = gl_FragCoord.xy * uTexel;

  // Advection: the field is carried along its own current, like ink in water.
  vec2 back = uv - sampleField(uv) * uStep * 1.5;
  vec2 flow = sampleField(back);

  // Diffusion: a little of the neighbours, so the trail softens without widening much.
  vec2 neighbours = sampleField(back + vec2(uTexel.x, 0.0)) + sampleField(back - vec2(uTexel.x, 0.0))
    + sampleField(back + vec2(0.0, uTexel.y)) + sampleField(back - vec2(0.0, uTexel.y));
  flow = mix(flow, neighbours * 0.25, 0.2);

  // Fades out in about a second: proportional, plus a linear part that really reaches zero.
  // Without it, the 8-bit rounding keeps small values forever (a drop of less than half a level per frame).
  flow *= pow(0.10, uStep);
  flow = sign(flow) * max(abs(flow) - 0.5 * uStep, 0.0);

  // Brush stroke along the segment the pointer covered since the previous step, in the direction it moves:
  // a continuous trail whatever the frame rate. Narrow brush.
  vec2 a = uPreviousCursor * vec2(uAspect, 1.0);
  vec2 b = uCursor * vec2(uAspect, 1.0);
  vec2 q = uv * vec2(uAspect, 1.0);
  vec2 ab = b - a;
  float h = clamp(dot(q - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  vec2 d = q - a - ab * h;
  flow += clamp(uVelocity * 0.6, -1.0, 1.0) * exp(-dot(d, d) / 0.0004);

  gl_FragColor = vec4(clamp(flow, -1.0, 1.0) * 0.5 + 0.5, 0.0, 1.0);
}
