import { useEffect, useRef } from "react";
import * as THREE from "three";

const PENCIL      = 0xc4a898;
const PENCIL_OPAC = 0.55;

// ── Mandala 1: Archimedes Spiral Vortex ──────────────────────────────────────
function buildSpiralMandala(): THREE.BufferGeometry {
  const pos: number[] = [];
  const RINGS = 24;
  const BASE_PTS = 10;

  const rings: THREE.Vector3[][] = [];
  for (let r = 0; r < RINGS; r++) {
    const radius = 0.06 + (r / (RINGS - 1)) * 0.94;
    const nPts   = BASE_PTS + r * 2;
    const offset = r * ((Math.PI * 2) / BASE_PTS) * 0.38;
    // Bowl shape: high at mid-radius, dips at center and outer edge
    const z = 0.45 * Math.sin((radius) * Math.PI);

    const ring: THREE.Vector3[] = [];
    for (let p = 0; p < nPts; p++) {
      const theta = (p / nPts) * Math.PI * 2 + offset;
      ring.push(new THREE.Vector3(radius * Math.cos(theta), radius * Math.sin(theta), z));
    }
    rings.push(ring);
  }

  // Ring arcs
  for (const ring of rings) {
    for (let p = 0; p < ring.length; p++) {
      const a = ring[p];
      const b = ring[(p + 1) % ring.length];
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }

  // Radial + diagonal cross-connections between consecutive rings
  for (let r = 0; r < RINGS - 1; r++) {
    const cur = rings[r];
    const nxt = rings[r + 1];
    for (let p = 0; p < cur.length; p++) {
      const a = cur[p];
      let bestJ = 0, bestDist = Infinity;
      for (let j = 0; j < nxt.length; j++) {
        const d = a.distanceTo(nxt[j]);
        if (d < bestDist) { bestDist = d; bestJ = j; }
      }
      const b  = nxt[bestJ];
      const b2 = nxt[(bestJ + 1) % nxt.length];
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      if (a.distanceTo(b2) < 0.22)
        pos.push(a.x, a.y, a.z, b2.x, b2.y, b2.z);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return geo;
}

// ── Mandala 2: Radial Polygon Flower ─────────────────────────────────────────
function buildFlowerMandala(): THREE.BufferGeometry {
  const pos: number[] = [];
  const SECTORS = 13;
  const RINGS   = 10;

  const pt = (ring: number, sector: number): THREE.Vector3 => {
    const r     = ring / RINGS;
    const offset = ring % 2 === 0 ? 0 : Math.PI / SECTORS;
    const theta  = ((sector % SECTORS) / SECTORS) * Math.PI * 2 + offset;
    const z      = 0.35 * Math.sin(r * Math.PI);
    return new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), z);
  };

  for (let ring = 1; ring <= RINGS; ring++) {
    for (let s = 0; s < SECTORS; s++) {
      const a = pt(ring,     s);
      const b = pt(ring,     s + 1);
      const c = pt(ring - 1, s);
      const d = pt(ring - 1, s + 1);

      pos.push(a.x, a.y, a.z, b.x, b.y, b.z); // arc
      pos.push(a.x, a.y, a.z, c.x, c.y, c.z); // spoke
      pos.push(a.x, a.y, a.z, d.x, d.y, d.z); // diagonal
      pos.push(b.x, b.y, b.z, c.x, c.y, c.z); // cross-diagonal
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return geo;
}

// ── Mandala 3: Fibonacci Vortex (dense/chaotic) ───────────────────────────────
function buildVortexMandala(): THREE.BufferGeometry {
  const pos: number[] = [];
  const N   = 750;
  const PHI = Math.PI * (3 - Math.sqrt(5));

  let seed = 97531;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < N; i++) {
    const t      = i / N;
    const r      = Math.sqrt(t);
    const theta  = i * PHI + (rand() - 0.5) * 0.25;
    const rJ     = r + (rand() - 0.5) * 0.035;
    const z      = 0.45 * Math.sin(r * Math.PI) + (rand() - 0.5) * 0.08 * r;
    pts.push(new THREE.Vector3(rJ * Math.cos(theta), rJ * Math.sin(theta), z));
  }

  const NEIGHBORS = [1, 8, 9, 13, 21];
  for (let i = 0; i < N; i++) {
    for (const dn of NEIGHBORS) {
      const j = i + dn;
      if (j >= N) continue;
      if (pts[i].distanceTo(pts[j]) < 0.17)
        pos.push(pts[i].x, pts[i].y, pts[i].z, pts[j].x, pts[j].y, pts[j].z);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return geo;
}

// ── Scene initializer ─────────────────────────────────────────────────────────
function initScene(container: HTMLDivElement, geo: THREE.BufferGeometry): () => void {
  const w = container.clientWidth || 240;
  const h = container.clientHeight || 240;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, w / h, 0.01, 50);
  // Face the mandala straight-on, like the weekly torus (camera.position.z)
  camera.position.set(0, 0, 2.4);
  camera.lookAt(0, 0, 0);

  const mat = new THREE.LineBasicMaterial({
    color: new THREE.Color(PENCIL),
    transparent: true,
    opacity: PENCIL_OPAC,
  });

  scene.add(new THREE.LineSegments(geo, mat));
  renderer.render(scene, camera);

  return () => {
    mat.dispose();
    renderer.dispose();
    if (container.contains(renderer.domElement))
      container.removeChild(renderer.domElement);
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function QuarterMandala() {
  const r1 = useRef<HTMLDivElement>(null);
  const r2 = useRef<HTMLDivElement>(null);
  const r3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!r1.current || !r2.current || !r3.current) return;

    const geos = [buildSpiralMandala(), buildFlowerMandala(), buildVortexMandala()];

    const cleanups = [
      initScene(r1.current, geos[0]),
      initScene(r2.current, geos[1]),
      initScene(r3.current, geos[2]),
    ];

    return () => {
      cleanups.forEach(fn => fn());
      geos.forEach(g => g.dispose());
    };
  }, []);

  return (
    <div className="flex gap-1 w-full">
      <div ref={r1} className="flex-1 overflow-hidden" style={{ height: 240 }} />
      <div ref={r2} className="flex-1 overflow-hidden" style={{ height: 240 }} />
      <div ref={r3} className="flex-1 overflow-hidden" style={{ height: 240 }} />
    </div>
  );
}
