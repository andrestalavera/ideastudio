#version 300 es
precision mediump float;

// Iridescent mesh backdrop — domain-warped multi-octave gradient across
// four palette colors. Scroll and pointer subtly warp the field. Cheap
// enough to run at half-res on mobile.

uniform vec2  u_resolution;
uniform float u_time;
uniform vec2  u_pointer;   // normalized 0..1
uniform float u_scroll;    // normalized 0..1 page progress
uniform vec3  u_duck;
uniform vec3  u_blue;
uniform vec3  u_amber;
uniform vec3  u_pink;
uniform vec3  u_bg;

out vec4 fragColor;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i) - 0.5, f),                 dot(hash2(i + vec2(1, 0)) - 0.5, f - vec2(1, 0)), u.x),
    mix(dot(hash2(i + vec2(0, 1)) - 0.5, f - vec2(0, 1)), dot(hash2(i + vec2(1, 1)) - 0.5, f - vec2(1, 1)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p *= 2.05;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 asp = vec2(u_resolution.x / u_resolution.y, 1.0);

  // Slowly-rotating domain warp keyed to time + scroll.
  vec2 p = (uv - 0.5) * asp * 1.8;
  float t = u_time * 0.06;
  vec2 warp = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(t, 0.0)));
  p += warp * 0.9 + (u_pointer - 0.5) * 0.55;
  p += vec2(0.0, u_scroll * 1.2);

  // Three angular fields that mix the four palette colors.
  float d1 = fbm(p * 0.9 + vec2(t, 0.0));
  float d2 = fbm(p * 1.3 - vec2(0.0, t));
  float d3 = fbm(p * 0.6 + vec2(-t, t));

  float t1 = smoothstep(-0.35, 0.35, d1);
  float t2 = smoothstep(-0.35, 0.35, d2);
  float t3 = smoothstep(-0.35, 0.35, d3);

  vec3 c = mix(u_duck, u_blue, t1);
  c = mix(c, u_amber, t2 * 0.55);
  c = mix(c, u_pink, (1.0 - t1) * (1.0 - t3) * 0.55);

  // Blend heavily toward the deep background so the mesh reads as ambient,
  // never competes with text. Dialed further down for legibility.
  c = mix(u_bg, c, 0.32);

  // Vignette toward the bottom so hero text keeps contrast above the mesh.
  float vy = smoothstep(1.05, 0.0, uv.y);
  c *= 0.65 + 0.35 * vy;

  // Edge fade to reinforce focus center.
  float r = length((uv - vec2(0.5, 0.5)) * vec2(asp.x * 0.9, 1.0));
  float edge = smoothstep(1.1, 0.3, r);
  c *= 0.7 + 0.3 * edge;

  // Final darken toward void — keeps body copy on $fg at AAA.
  c = mix(c, u_bg, 0.22);

  fragColor = vec4(c, 1.0);
}
