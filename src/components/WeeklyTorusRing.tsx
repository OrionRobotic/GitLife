import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Goal } from "@/types/database/Goal";

const TORUS_RADIUS = 0.80;
const TUBE_RADIUS  = 0.58;
const CORNER_R     = TUBE_RADIUS / Math.cos(Math.PI / 8); // circumscribed octagon
const N_SIDES      = 8;
const WIRE_ARC     = 16;
const WIRE_RINGS   = 5;
const GAP_HALF     = 0.08;
const DOTS_PER_SEG = 500;
const DOT_SIZE     = 0.10;

const ORANGE_SHADES = [
  new THREE.Color(0xff8040),
  new THREE.Color(0xff6020),
  new THREE.Color(0xf05010),
  new THREE.Color(0xffa560),
  new THREE.Color(0xd04015),
  new THREE.Color(0xff9848),
  new THREE.Color(0xe06830),
];

// ── Wireframe cage ────────────────────────────────────────────────────────────
function buildCage(start: number, end: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const all: THREE.Vector3[][] = Array.from({ length: WIRE_ARC + 1 }, (_, s) => {
    const a = start + (s / WIRE_ARC) * (end - start);
    const cx = Math.cos(a) * TORUS_RADIUS;
    const cy = Math.sin(a) * TORUS_RADIUS;
    return Array.from({ length: N_SIDES }, (__, k) => {
      const phi = (k / N_SIDES) * Math.PI * 2;
      return new THREE.Vector3(
        cx + Math.cos(phi) * CORNER_R * Math.cos(a),
        cy + Math.cos(phi) * CORNER_R * Math.sin(a),
        Math.sin(phi) * CORNER_R
      );
    });
  });

  const step = Math.max(1, Math.round(WIRE_ARC / (WIRE_RINGS - 1)));
  for (let s = 0; s <= WIRE_ARC; s += step) {
    for (let k = 0; k < N_SIDES; k++) {
      const a = all[s][k], b = all[s][(k + 1) % N_SIDES];
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  for (let k = 0; k < N_SIDES; k++) {
    for (let s = 0; s < WIRE_ARC; s++) {
      const a = all[s][k], b = all[s + 1][k];
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return geo;
}

// ── Particle state for one completed segment ──────────────────────────────────
interface SegmentParticles {
  geo: THREE.BufferGeometry;
  u:   Float32Array;
  v:   Float32Array;
  r:   Float32Array;
  du:  Float32Array;
  dv:  Float32Array;
  dr:  Float32Array;
  start: number;
  end:   number;
}

function initParticles(start: number, end: number): SegmentParticles {
  const n = DOTS_PER_SEG;
  const u  = new Float32Array(n);
  const v  = new Float32Array(n);
  const r  = new Float32Array(n);
  const du = new Float32Array(n);
  const dv = new Float32Array(n);
  const dr = new Float32Array(n);
  const positions = new Float32Array(n * 3);
  const colors    = new Float32Array(n * 3);

  for (let i = 0; i < n; i++) {
    u[i]  = start + Math.random() * (end - start);
    v[i]  = Math.random() * Math.PI * 2;
    r[i]  = Math.sqrt(Math.random()) * TUBE_RADIUS;

    du[i] = (Math.random() - 0.5) * 0.006;
    dv[i] = (Math.random() - 0.5) * 0.010;
    dr[i] = (Math.random() - 0.5) * 0.005;

    const cx = (TORUS_RADIUS + r[i] * Math.cos(v[i])) * Math.cos(u[i]);
    const cy = (TORUS_RADIUS + r[i] * Math.cos(v[i])) * Math.sin(u[i]);
    const cz = r[i] * Math.sin(v[i]);
    positions[i * 3]     = cx;
    positions[i * 3 + 1] = cy;
    positions[i * 3 + 2] = cz;

    const c = ORANGE_SHADES[Math.floor(Math.random() * ORANGE_SHADES.length)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color",    new THREE.BufferAttribute(colors,    3));
  return { geo, u, v, r, du, dv, dr, start, end };
}

function stepParticles(p: SegmentParticles) {
  const n   = DOTS_PER_SEG;
  const pos = p.geo.attributes.position as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;

  for (let i = 0; i < n; i++) {
    p.u[i] += p.du[i];
    p.v[i] += p.dv[i];
    p.r[i] += p.dr[i];

    if (p.u[i] < p.start) { p.u[i] = p.start; p.du[i] *= -1; }
    if (p.u[i] > p.end)   { p.u[i] = p.end;   p.du[i] *= -1; }
    p.v[i] = ((p.v[i] % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (p.r[i] < 0)            { p.r[i] = 0;            p.dr[i] *= -1; }
    if (p.r[i] > TUBE_RADIUS)  { p.r[i] = TUBE_RADIUS;  p.dr[i] *= -1; }

    const rr = TORUS_RADIUS + p.r[i] * Math.cos(p.v[i]);
    arr[i * 3]     = rr * Math.cos(p.u[i]);
    arr[i * 3 + 1] = rr * Math.sin(p.u[i]);
    arr[i * 3 + 2] = p.r[i] * Math.sin(p.v[i]);
  }

  pos.needsUpdate = true;
}

// ── Label sprite ───────────────────────────────────────────────────────────────
function buildLabelSprite(title: string, completed: boolean): {
  sprite: THREE.Sprite;
  mat: THREE.SpriteMaterial;
  tex: THREE.CanvasTexture;
} {
  const offCanvas = document.createElement("canvas");
  offCanvas.width = 256;
  offCanvas.height = 64;
  const ctx = offCanvas.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 64);
  ctx.font = "bold 13px sans-serif";
  const alpha = completed ? 1.0 : 0.28;
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let label = title;
  if (label.length > 12) label = label.substring(0, 12) + "…";
  ctx.fillText(label, 128, 32);

  const tex = new THREE.CanvasTexture(offCanvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  return { sprite, mat, tex };
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  goals: Goal[];
  onHoverChange: (hovering: boolean, mouseX: number, mouseY: number) => void;
}

export function WeeklyTorusRing({ goals, onHoverChange }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onHoverChangeRef = useRef(onHoverChange);
  const goalsRef = useRef(goals);

  useEffect(() => { onHoverChangeRef.current = onHoverChange; }, [onHoverChange]);
  useEffect(() => { goalsRef.current = goals; }, [goals]);

  // Recompute stable key so the scene only rebuilds when content changes
  const goalsKey = goals.map((g) => `${g.id}:${g.completed}:${g.title}`).join("|");

  useEffect(() => {
    const el = mountRef.current;
    const total = goalsRef.current.length;
    if (!el || total === 0) return;

    const currentGoals = goalsRef.current;
    const completedCount = currentGoals.filter((g) => g.completed).length;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.0;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = renderer.domElement;
    canvas.style.cssText = "display:block;width:100%;height:100%;";
    el.appendChild(canvas);

    const resize = () => {
      const W = el.offsetWidth, H = el.offsetHeight;
      if (W > 0 && H > 0) {
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
      }
    };
    resize();

    const matDim    = new THREE.LineBasicMaterial({ color: 0xc4a898, transparent: true, opacity: 0.30 });
    const matBright = new THREE.LineBasicMaterial({ color: 0xe8a882, transparent: true, opacity: 0.85, linewidth: 2 });
    const matDots   = new THREE.PointsMaterial({ vertexColors: true, size: DOT_SIZE, sizeAttenuation: true, transparent: true, opacity: 0.55 });
    const hitMat    = new THREE.MeshBasicMaterial({ visible: false });

    const group = new THREE.Group();
    group.rotation.x = (20 * Math.PI) / 180;

    const cageGeos: THREE.BufferGeometry[]   = [];
    const particles: SegmentParticles[]      = [];
    const hitMeshes: THREE.Mesh[]            = [];
    const hitGeos: THREE.BufferGeometry[]    = [];
    const spriteMats: THREE.SpriteMaterial[] = [];
    const spriteTexes: THREE.CanvasTexture[] = [];

    for (let i = 0; i < total; i++) {
      const start     = (i / total) * Math.PI * 2 + GAP_HALF;
      const end       = ((i + 1) / total) * Math.PI * 2 - GAP_HALF;
      const completed = i < completedCount;

      // Wireframe cage
      const cageGeo = buildCage(start, end);
      cageGeos.push(cageGeo);
      group.add(new THREE.LineSegments(cageGeo, completed ? matBright : matDim));

      // Particles (completed only)
      if (completed) {
        const p = initParticles(start, end);
        particles.push(p);
        group.add(new THREE.Points(p.geo, matDots));
      }

      // Invisible hit mesh for raycasting
      const arcPoints: THREE.Vector3[] = [];
      const numArcPts = 12;
      for (let k = 0; k <= numArcPts; k++) {
        const u = start + (k / numArcPts) * (end - start);
        arcPoints.push(new THREE.Vector3(
          Math.cos(u) * TORUS_RADIUS,
          Math.sin(u) * TORUS_RADIUS,
          0
        ));
      }
      const curve  = new THREE.CatmullRomCurve3(arcPoints);
      const hitGeo = new THREE.TubeGeometry(curve, 12, TUBE_RADIUS * 1.1, 6, false);
      hitGeos.push(hitGeo);
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.userData.goalIndex = i;
      group.add(hitMesh);
      hitMeshes.push(hitMesh);

      // Label sprite
      const mid = (i + 0.5) / total * Math.PI * 2;
      const { sprite, mat: sMat, tex: sTex } = buildLabelSprite(currentGoals[i].title, completed);
      spriteMats.push(sMat);
      spriteTexes.push(sTex);
      sprite.position.set(
        Math.cos(mid) * TORUS_RADIUS,
        Math.sin(mid) * TORUS_RADIUS,
        0
      );
      sprite.scale.set(0.8, 0.2, 1);
      group.add(sprite);
    }

    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // Raycaster
    const raycaster   = new THREE.Raycaster();
    const mouseNDC    = new THREE.Vector2(-999, -999);
    const mouseClient = { x: 0, y: 0 };
    let isHovering = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseNDC.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      mouseClient.x = e.clientX;
      mouseClient.y = e.clientY;
      // Continuously update popup position while hovering
      if (isHovering) {
        onHoverChangeRef.current(true, e.clientX, e.clientY);
      }
    };

    const handleMouseLeave = () => {
      mouseNDC.set(-999, -999);
      if (isHovering) {
        isHovering = false;
        onHoverChangeRef.current(false, 0, 0);
      }
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      group.rotation.y += 0.001;
      for (const p of particles) stepParticles(p);
      renderer.render(scene, camera);

      // Raycast after render so world matrices are up to date
      raycaster.setFromCamera(mouseNDC, camera);
      const intersects = raycaster.intersectObjects(hitMeshes);
      const nowHovering = intersects.length > 0;
      if (nowHovering !== isHovering) {
        isHovering = nowHovering;
        onHoverChangeRef.current(isHovering, mouseClient.x, mouseClient.y);
      }
    };
    animate();

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      cageGeos.forEach((g) => g.dispose());
      hitGeos.forEach((g) => g.dispose());
      particles.forEach((p) => p.geo.dispose());
      spriteMats.forEach((m) => m.dispose());
      spriteTexes.forEach((t) => t.dispose());
      matDim.dispose();
      matBright.dispose();
      matDots.dispose();
      hitMat.dispose();
      renderer.dispose();
      if (el.contains(canvas)) el.removeChild(canvas);
    };
  }, [goalsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (goals.length === 0) return null;
  return <div ref={mountRef} className="w-full" style={{ height: "320px", marginTop: "20px", marginBottom: "8px" }} />;
}
