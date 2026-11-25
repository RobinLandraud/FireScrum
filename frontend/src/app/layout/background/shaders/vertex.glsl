// Animated background (spec 013), WebGL 1 (GLSL ES 1.00).
// Full-screen quad: the vertices are already in clip space.
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
