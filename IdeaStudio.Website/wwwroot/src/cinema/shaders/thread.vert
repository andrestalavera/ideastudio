#version 300 es

// Thread — a thick polyline drawn as a triangle strip. Each control point
// emits two vertices along a perpendicular normal. u_revealed clips the
// geometry by arc length, which is how the ribbon "unfurls" as you scroll.

in vec2 a_pos;        // world-space position (pixels)
in vec2 a_normal;     // perpendicular direction, unit length
in float a_side;      // -1 or +1 (which side of the stroke this vert is on)
in float a_arc;       // normalized arc length 0..1 along the spline

uniform vec2  u_resolution;
uniform float u_thickness;
uniform float u_revealed;

out float v_arc;
out float v_side;
out float v_clip;

void main() {
  float half_w = u_thickness * 0.5;
  vec2 offset = a_normal * a_side * half_w;
  vec2 pos = a_pos + offset;

  // Convert pixels → clip space.
  vec2 clip = (pos / u_resolution) * 2.0 - 1.0;
  clip.y *= -1.0;  // flip Y so DOM coords match.
  gl_Position = vec4(clip, 0.0, 1.0);

  v_arc = a_arc;
  v_side = a_side;
  v_clip = step(a_arc, u_revealed);
}
