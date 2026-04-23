import {
  Group,
  SphereGeometry,
  MeshBasicMaterial,
  InstancedMesh,
  Object3D,
  BufferGeometry,
  BufferAttribute,
  LineSegments,
  LineBasicMaterial,
} from 'three';

// 2×3 grid edges (row-major indices).
// Row 0: 0-1-2. Row 1: 3-4-5. Columns: 0-3, 1-4, 2-5.
const EDGES = [
  [0, 1], [1, 2],
  [3, 4], [4, 5],
  [0, 3], [1, 4], [2, 5],
];

const NODE_COUNT = 6;
const BASELINE_NODE_OPACITY = 0.8;
const BASELINE_LINE_OPACITY = 0.4;

/**
 * @param {{ palette: Record<string, import('three').Color>, plasma: any }} ctx
 */
export default async function servicesHubScene(ctx) {
  const { palette, plasma } = ctx;
  const root = new Group();

  // Nodes: small spheres rendered via InstancedMesh (6 instances, shared material).
  const nodeGeom = new SphereGeometry(0.03, 16, 16);
  const nodeMat = new MeshBasicMaterial({
    color: palette.sky,
    transparent: true,
    opacity: BASELINE_NODE_OPACITY,
  });
  const nodes = new InstancedMesh(nodeGeom, nodeMat, NODE_COUNT);
  root.add(nodes);

  // Lines: 7 edges × 2 endpoints × 3 coords = 42 floats.
  const linePositions = new Float32Array(EDGES.length * 2 * 3);
  const lineGeom = new BufferGeometry();
  lineGeom.setAttribute('position', new BufferAttribute(linePositions, 3));
  const lineMat = new LineBasicMaterial({
    color: palette.azure,
    transparent: true,
    opacity: BASELINE_LINE_OPACITY,
  });
  const lines = new LineSegments(lineGeom, lineMat);
  root.add(lines);

  // Per-node activation state: lerps toward 1 when card is in viewport, else 0.
  const activation = new Float32Array(NODE_COUNT); // current
  const target = new Float32Array(NODE_COUNT);     // goal
  const positions = Array.from({ length: NODE_COUNT }, () => [0, 0, 0]);

  let cards = document.querySelectorAll('[data-service-anchor]');

  const dummy = new Object3D();

  const writeLines = () => {
    for (let e = 0; e < EDGES.length; e++) {
      const [a, b] = EDGES[e];
      const base = e * 6;
      linePositions[base + 0] = positions[a][0];
      linePositions[base + 1] = positions[a][1];
      linePositions[base + 2] = positions[a][2];
      linePositions[base + 3] = positions[b][0];
      linePositions[base + 4] = positions[b][1];
      linePositions[base + 5] = positions[b][2];
    }
    lineGeom.attributes.position.needsUpdate = true;
  };

  const writeNodeMatrices = (time) => {
    for (let i = 0; i < NODE_COUNT; i++) {
      dummy.position.set(positions[i][0], positions[i][1], positions[i][2]);
      const pulse = 1 + Math.sin(time * 1.5 + i * 0.7) * 0.05;
      // Scale: baseline 0.8 at activation 0, up to 1.4 at activation 1.
      const s = (0.8 + activation[i] * 0.6) * pulse;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      nodes.setMatrixAt(i, dummy.matrix);
    }
    nodes.instanceMatrix.needsUpdate = true;
  };

  const updatePositions = () => {
    if (!cards.length) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const n = Math.min(NODE_COUNT, cards.length);
    for (let i = 0; i < n; i++) {
      const rect = cards[i].getBoundingClientRect();
      const cx = ((rect.left + rect.width / 2) / w) * 2 - 1;
      const cy = -(((rect.top + rect.height / 2) / h) * 2 - 1);
      positions[i][0] = cx;
      positions[i][1] = cy;
      positions[i][2] = 0;
    }
    writeLines();
  };

  let observer = null;

  const setupObserver = () => {
    observer?.disconnect();
    observer = null;
    if (!('IntersectionObserver' in window) || !cards.length) {
      // No IO or no cards — default all activated so nodes aren't dead.
      for (let i = 0; i < NODE_COUNT; i++) target[i] = 1;
      return;
    }
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const idx = Array.prototype.indexOf.call(cards, entry.target);
        if (idx >= 0 && idx < NODE_COUNT) {
          target[idx] = entry.isIntersecting ? 1 : 0;
        }
      }
    }, { threshold: 0.3 });
    for (let i = 0; i < cards.length; i++) observer.observe(cards[i]);
  };

  updatePositions();
  setupObserver();

  // rAF retry if the grid hasn't mounted yet (mirrors home.js pattern).
  if (!cards.length) {
    requestAnimationFrame(() => {
      cards = document.querySelectorAll('[data-service-anchor]');
      updatePositions();
      setupObserver();
    });
  }

  const onScroll = () => updatePositions();
  const onResize = () => updatePositions();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  plasma.setPalette(palette.bg, palette.deep, palette.sky);
  plasma.setIntensity(0.85);

  let t = 0;
  return {
    root,
    update(dt) {
      t += dt;
      // Defensive re-observe if Blazor replaced the grid DOM (route or
      // content-count change). Same-culture re-renders reuse elements,
      // so this is cheap insurance — one getter per frame.
      if (cards.length && !cards[0].isConnected) {
        cards = document.querySelectorAll('[data-service-anchor]');
        setupObserver();
        updatePositions();
      }
      // Ease activation toward target (~250ms time-constant at dt=16ms).
      const k = Math.min(1, dt * 4);
      for (let i = 0; i < NODE_COUNT; i++) {
        activation[i] += (target[i] - activation[i]) * k;
      }
      writeNodeMatrices(t);
    },
    onResize() { updatePositions(); },
    setEnterProgress(v) {
      nodeMat.opacity = BASELINE_NODE_OPACITY * v;
      lineMat.opacity = BASELINE_LINE_OPACITY * v;
    },
    setExitProgress(v) {
      nodeMat.opacity = BASELINE_NODE_OPACITY * (1 - v);
      lineMat.opacity = BASELINE_LINE_OPACITY * (1 - v);
    },
    dispose() {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
      nodeGeom.dispose();
      nodeMat.dispose();
      lineGeom.dispose();
      lineMat.dispose();
    },
  };
}
