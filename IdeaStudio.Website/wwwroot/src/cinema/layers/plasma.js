import { Mesh, PlaneGeometry, ShaderMaterial, DoubleSide } from 'three';

const vert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}`;

const frag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1., 0.));
  float c = hash(i + vec2(0., 1.)), d = hash(i + vec2(1., 1.));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 p = vUv * 3.0;
  float n = noise(p + uTime * 0.05) * 0.6 + noise(p * 2.0 - uTime * 0.03) * 0.4;
  vec3 col = mix(uColorA, uColorB, n);
  col = mix(col, uColorC, smoothstep(0.55, 0.9, n) * 0.5);
  float vignette = smoothstep(1.2, 0.2, length(vUv - 0.5));
  col *= vignette;
  gl_FragColor = vec4(col * uIntensity, 1.0);
}`;

export function createPlasma(palette) {
  const geom = new PlaneGeometry(2, 2);
  const mat = new ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: 0.9 },
      uColorA: { value: palette['ink-0'] },
      uColorB: { value: palette['deep'] },
      uColorC: { value: palette['azure'] },
    },
    depthTest: false,
    depthWrite: false,
    side: DoubleSide,
  });
  const mesh = new Mesh(geom, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -999;
  return {
    mesh,
    update(dt) { mat.uniforms.uTime.value += dt; },
    setPalette(a, b, c) {
      mat.uniforms.uColorA.value = a;
      mat.uniforms.uColorB.value = b;
      mat.uniforms.uColorC.value = c;
    },
    setIntensity(v) { mat.uniforms.uIntensity.value = v; },
    dispose() { geom.dispose(); mat.dispose(); },
  };
}
