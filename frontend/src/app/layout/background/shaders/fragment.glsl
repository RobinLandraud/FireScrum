// Animated background (spec 013), WebGL 1 (GLSL ES 1.00).
// Three soft halos (brand blue, orange, lavender) on the theme surface,
// drifting with time and leaning towards the pointer.
precision mediump float;

uniform vec2 uResolution; // canvas size in pixels
uniform vec2 uPointer;    // pointer position, 0..1 from the bottom left (0.5, 0.5 = centre)
uniform float uTime;      // seconds, frozen at 0 when the background stays still
uniform float uDark;      // 0 = light theme, 1 = dark theme, in between during the fade
uniform sampler2D uTrail; // fluid trail behind the pointer (trail.glsl): velocity in red / green, 0.5 = still

// Soft round halo of radius r centred on c (gaussian falloff).
float halo(vec2 p, vec2 c, float r) {
  vec2 d = p - c;
  return exp(-dot(d, d) / (r * r));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  // Square units: halos stay round whatever the window shape.
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);
  vec2 lean = pointer - vec2(0.5 * aspect, 0.5);
  float t = uTime * 0.12;

  // Slight ripple.
  p += 0.015 * vec2(sin(p.y * 6.0 + t * 3.0), cos(p.x * 5.0 - t * 2.0));

  // Fluid trail: the background is dragged along the current left behind the pointer.
  vec2 flow = texture2D(uTrail, uv).rg * 2.0 - 1.0;
  float ink = length(flow);
  p -= flow * vec2(aspect, 1.0) * 0.1;

  // Blue top right and lavender in the middle lean with the pointer, orange bottom left leans away.
  vec2 blueCentre = vec2(0.82 * aspect, 0.88) + 0.07 * vec2(sin(t), cos(t * 1.3)) + lean * 0.42;
  vec2 orangeCentre = vec2(0.16 * aspect, 0.08) + 0.07 * vec2(cos(t * 0.9), sin(t * 1.1)) - lean * 0.32;
  vec2 lavenderCentre = vec2(0.55 * aspect, 0.45) + 0.10 * vec2(sin(t * 0.7 + 1.0), cos(t * 0.6)) + lean * 0.22;

  // Theme surfaces: #e4e8f0 (light), #222a3a (dark).
  vec3 colour = mix(vec3(0.894, 0.910, 0.941), vec3(0.133, 0.165, 0.227), uDark);
  vec3 blue = vec3(0.275, 0.373, 1.0);
  vec3 orange = vec3(0.969, 0.565, 0.035);
  vec3 lavender = vec3(0.62, 0.58, 0.95);

  // Dark: a stronger blue, a softer orange (otherwise it turns brown).
  colour = mix(colour, blue, (0.34 + 0.10 * uDark) * halo(p, blueCentre, 0.48));
  colour = mix(colour, orange, (0.26 - 0.08 * uDark) * halo(p, orangeCentre, 0.42));
  colour = mix(colour, lavender, (0.14 + 0.04 * uDark) * halo(p, lavenderCentre, 0.55));
  // Glow under the pointer, and a lighter sheen along the trail.
  colour += 0.05 * halo(p, pointer, 0.22);
  colour = mix(colour, lavender, clamp(ink * 0.2, 0.0, 0.05));

  // Fine grain: no colour banding in the gradients.
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  colour += (grain - 0.5) * 0.012;

  gl_FragColor = vec4(colour, 1.0);
}
