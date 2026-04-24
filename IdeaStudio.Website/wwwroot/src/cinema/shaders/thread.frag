#version 300 es
precision mediump float;

in float v_arc;
in float v_side;
in float v_clip;

uniform vec3 u_duck;
uniform vec3 u_blue;
uniform vec3 u_amber;
uniform vec3 u_pink;

out vec4 fragColor;

vec3 sampleGradient(float t) {
  // 4-stop cycle: duck → blue → amber → pink → duck
  float tt = fract(t) * 4.0;
  float i = floor(tt);
  float f = fract(tt);
  vec3 a = u_duck, b = u_blue;
  if (i < 1.0) { a = u_duck; b = u_blue; }
  else if (i < 2.0) { a = u_blue; b = u_amber; }
  else if (i < 3.0) { a = u_amber; b = u_pink; }
  else              { a = u_pink; b = u_duck; }
  return mix(a, b, smoothstep(0.0, 1.0, f));
}

void main() {
  // Feathered edges (side goes -1 → +1 across the strip).
  float edge = 1.0 - smoothstep(0.55, 1.0, abs(v_side));

  vec3 col = sampleGradient(v_arc * 1.2);
  // Ambient alpha — the thread is decoration, never a focal element.
  fragColor = vec4(col, edge * 0.42 * v_clip);
}
