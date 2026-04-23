import {
  InstancedMesh,
  SphereGeometry,
  MeshBasicMaterial,
  Object3D,
  Vector3,
  BufferGeometry,
  BufferAttribute,
  LineSegments,
  LineBasicMaterial,
} from 'three';

/**
 * Builds a constellation of glowing node spheres + connecting lines.
 * @param {{ nodes: Array<{ label?: string, position?: [number, number, number] }>, palette: Record<string, import('three').Color> }} options
 */
export function createConstellation({ nodes, palette }) {
  if (!nodes || nodes.length === 0) {
    return createEmpty();
  }

  const positions = nodes.map(n => new Vector3(...(n.position ?? randomOnSphere())));

  const nodeGeom = new SphereGeometry(0.015, 12, 12);
  const nodeMat = new MeshBasicMaterial({ color: palette.sky, transparent: true, opacity: 0.9 });
  const mesh = new InstancedMesh(nodeGeom, nodeMat, positions.length);

  const dummy = new Object3D();
  positions.forEach((p, i) => {
    dummy.position.copy(p);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  // Lines: connect each node to its two nearest neighbours.
  const segmentPositions = [];
  for (let i = 0; i < positions.length; i++) {
    const order = positions
      .map((p, j) => [j === i ? Infinity : p.distanceTo(positions[i]), j])
      .sort((a, b) => a[0] - b[0])
      .slice(0, 2);
    for (const [, j] of order) {
      segmentPositions.push(
        positions[i].x, positions[i].y, positions[i].z,
        positions[j].x, positions[j].y, positions[j].z
      );
    }
  }

  const lineGeom = new BufferGeometry();
  lineGeom.setAttribute('position', new BufferAttribute(new Float32Array(segmentPositions), 3));
  const lineMat = new LineBasicMaterial({ color: palette.azure, transparent: true, opacity: 0.35 });
  const lines = new LineSegments(lineGeom, lineMat);

  return {
    mesh,
    lines,
    positions,
    /** 0 = fully transparent, 1 = baseline visibility (0.9 nodes / 0.35 lines). */
    setOpacity(v) {
      nodeMat.opacity = 0.9 * v;
      lineMat.opacity = 0.35 * v;
    },
    dispose() {
      nodeGeom.dispose();
      nodeMat.dispose();
      lineGeom.dispose();
      lineMat.dispose();
    },
  };
}

function createEmpty() {
  return {
    mesh: null,
    lines: null,
    positions: [],
    setOpacity() {},
    dispose() {},
  };
}

function randomOnSphere() {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = 1.3;
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  ];
}
