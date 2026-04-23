import {
  Group, PlaneGeometry, ShaderMaterial, Mesh, DoubleSide, Color,
} from 'three';

export default async function webScene(ctx) {
  const { palette, plasma, parameters } = ctx;
  const root = new Group();
  const accent = parameters?.accent ? new Color(parameters.accent) : palette.sky;

  const geom = new PlaneGeometry(3.2, 2.0, 48, 32);
  const mat = new ShaderMaterial({
    uniforms: {
      uTime:    { value: 0 },
      uColor:   { value: accent },
      uOpacity: { value: 0.55 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying float vElev;
      void main() {
        vec3 p = position;
        float e = sin(p.x * 3.0 + uTime * 1.1) * 0.14
                + sin(p.y * 2.2 + uTime * 0.7) * 0.08;
        p.z += e;
        vElev = e;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision mediump float;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vElev;
      void main() {
        float a = uOpacity * (0.6 + 0.4 * smoothstep(-0.1, 0.1, vElev));
        gl_FragColor = vec4(uColor, a);
      }
    `,
    wireframe: true,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
  const mesh = new Mesh(geom, mat);
  mesh.position.z = -0.5;
  mesh.rotation.x = -0.25;
  root.add(mesh);

  plasma.setPalette(palette.bg, palette.deep, accent);
  plasma.setIntensity(0.7);

  return {
    root,
    update(dt) { mat.uniforms.uTime.value += dt; },
    setEnterProgress(v) { mat.uniforms.uOpacity.value = 0.55 * v; },
    setExitProgress(v)  { mat.uniforms.uOpacity.value = 0.55 * (1 - v); },
    dispose() { geom.dispose(); mat.dispose(); },
  };
}
