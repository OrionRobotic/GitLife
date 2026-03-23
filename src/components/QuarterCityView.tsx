import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Goal } from "@/types/database/Goal";
import type { QuarterEffortEntry } from "@/context/GoalsContext";

const CITY_R   = 1.1;
const BASE_W   = 0.75;
const MAX_H    = 1.8;
const MIN_H    = 0.55;
const DOT_SIZE    = 0.17;
const DOTS_MAX    = 600; // particles at 100%
const FLUID_COLOR = 0xe86228;

const PARTICLE_SHADES = [
  new THREE.Color(0xff8040),
  new THREE.Color(0xff6020),
  new THREE.Color(0xf05010),
  new THREE.Color(0xffa560),
  new THREE.Color(0xd04015),
  new THREE.Color(0xff9848),
  new THREE.Color(0xe06830),
];

// ── Building wireframe helpers ────────────────────────────────────────────────
function buildingBorderGeo(w: number, h: number, d: number): THREE.BufferGeometry {
  const box = new THREE.BoxGeometry(w, h, d);
  const geo = new THREE.EdgesGeometry(box);
  box.dispose();
  return geo;
}

function buildingInnerGeo(w: number, h: number, d: number, segW: number): THREE.BufferGeometry {
  const hw = w / 2, hd = d / 2;
  const verts: number[] = [];
  for (const fz of [-hd, hd]) {
    for (let i = 1; i < segW; i++) {
      const x = -hw + (i / segW) * w;
      verts.push(x, 0, fz,  x, h, fz);
    }
  }
  for (const fx of [-hw, hw]) {
    for (let i = 1; i < segW; i++) {
      const z = -hd + (i / segW) * d;
      verts.push(fx, 0, z,  fx, h, z);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  return geo;
}

// ── Percentage sprite ─────────────────────────────────────────────────────────
function buildPctSprite(pct: number): { sprite: THREE.Sprite; mat: THREE.SpriteMaterial; tex: THREE.CanvasTexture } {
  const offCanvas = document.createElement("canvas");
  offCanvas.width = 320; offCanvas.height = 110;
  const ctx = offCanvas.getContext("2d")!;
  ctx.clearRect(0, 0, 320, 110);
  ctx.font = `400 72px "Crimson Pro", Georgia, serif`;
  ctx.fillStyle = "rgba(120, 20, 10, 1.0)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${Math.round(pct * 100)}%`, 160, 55);
  const tex = new THREE.CanvasTexture(offCanvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  return { sprite: new THREE.Sprite(mat), mat, tex };
}

// ── L-shaped elbow corner ─────────────────────────────────────────────────────
function elbowCorner(ax: number, az: number, bx: number, bz: number): THREE.Vector3 {
  const c1 = new THREE.Vector3(ax, 0, bz);
  const c2 = new THREE.Vector3(bx, 0, az);
  return (c1.x * c1.x + c1.z * c1.z) >= (c2.x * c2.x + c2.z * c2.z) ? c1 : c2;
}

// ── Building particles ────────────────────────────────────────────────────────
interface BuildingParticles {
  geo:    THREE.BufferGeometry;
  px:     Float32Array;
  py:     Float32Array;
  pz:     Float32Array;
  vx:     Float32Array;
  vy:     Float32Array;
  vz:     Float32Array;
  hw:     number; // half-width of the bounding box
  fluidH: number;
}

function initBuildingParticles(n: number, hw: number, fluidH: number): BuildingParticles {
  const px = new Float32Array(n);
  const py = new Float32Array(n);
  const pz = new Float32Array(n);
  const vx = new Float32Array(n);
  const vy = new Float32Array(n);
  const vz = new Float32Array(n);
  const positions = new Float32Array(n * 3);
  const colors    = new Float32Array(n * 3);

  for (let i = 0; i < n; i++) {
    px[i] = (Math.random() - 0.5) * 2 * hw;
    py[i] = Math.random() * fluidH;
    pz[i] = (Math.random() - 0.5) * 2 * hw;

    const speed = 0.006;
    vx[i] = (Math.random() - 0.5) * speed;
    vy[i] = (Math.random() - 0.5) * speed * 0.5;
    vz[i] = (Math.random() - 0.5) * speed;

    positions[i * 3]     = px[i];
    positions[i * 3 + 1] = py[i];
    positions[i * 3 + 2] = pz[i];

    const c = PARTICLE_SHADES[Math.floor(Math.random() * PARTICLE_SHADES.length)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color",    new THREE.BufferAttribute(colors,    3));
  return { geo, px, py, pz, vx, vy, vz, hw, fluidH };
}

function stepBuildingParticles(p: BuildingParticles) {
  const pos = p.geo.attributes.position as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;
  const n   = p.px.length;

  for (let i = 0; i < n; i++) {
    // Speed scales with height: bottom crawls, top flows
    const heightFrac = Math.max(0, Math.min(1, p.py[i] / p.fluidH));
    const speedMul   = 0.12 + 0.88 * heightFrac;

    p.px[i] += p.vx[i] * speedMul;
    p.py[i] += p.vy[i] * speedMul;
    p.pz[i] += p.vz[i] * speedMul;

    if (p.px[i] < -p.hw)    { p.px[i] = -p.hw;    p.vx[i] *= -1; }
    if (p.px[i] >  p.hw)    { p.px[i] =  p.hw;    p.vx[i] *= -1; }
    if (p.py[i] <  0)       { p.py[i] =  0;        p.vy[i] *= -1; }
    if (p.py[i] >  p.fluidH){ p.py[i] =  p.fluidH; p.vy[i] *= -1; }
    if (p.pz[i] < -p.hw)    { p.pz[i] = -p.hw;    p.vz[i] *= -1; }
    if (p.pz[i] >  p.hw)    { p.pz[i] =  p.hw;    p.vz[i] *= -1; }

    arr[i * 3]     = p.px[i];
    arr[i * 3 + 1] = p.py[i];
    arr[i * 3 + 2] = p.pz[i];
  }

  pos.needsUpdate = true;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface Props {
  goals: Goal[];
  effort: QuarterEffortEntry[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  canvasHeight?: number;
}

export function QuarterCityView({ goals, effort, selectedId, onSelect, canvasHeight = 420 }: Props) {
  const mountRef    = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  const sceneKey = goals.map((g) => g.id).join("|") + "|" + effort.map((e) => e.percentage).join("|");

  useEffect(() => {
    const el = mountRef.current;
    if (!el || goals.length === 0) return;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 2.4, 5.5);
    camera.lookAt(0, 0.6, 0);

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

    // ── Materials ──────────────────────────────────────────────────────────────
    const matWire       = new THREE.LineBasicMaterial({ color: 0xb89880, transparent: true, opacity: 0.35 });
    const matWireBright = new THREE.LineBasicMaterial({ color: 0xe8a882, transparent: true, opacity: 0.85 });
    const matWireDim    = new THREE.LineBasicMaterial({ color: 0xc8b0a0, transparent: true, opacity: 0.22 });
    const matDots    = new THREE.PointsMaterial({ vertexColors: true, size: DOT_SIZE, sizeAttenuation: true, transparent: true, opacity: 0.42 });
    const matRoad    = new THREE.LineBasicMaterial({ color: 0xb09878, transparent: true, opacity: 0.55 });
    const hitMat     = new THREE.MeshBasicMaterial({ visible: false });

    const group = new THREE.Group();
    const toDispose:   THREE.BufferGeometry[] = [];
    const toDisposeM:  THREE.Material[]       = [];
    const particles:   BuildingParticles[]    = [];
    const hitMeshes:   THREE.Mesh[]           = [];
    const spriteMats:  THREE.SpriteMaterial[] = [];
    const spriteTexes: THREE.CanvasTexture[]  = [];

    const N      = goals.length;
    const maxPct = Math.max(...effort.map((e) => e.percentage), 0.001);

    // Precompute building centres
    const bldPos: { x: number; z: number }[] = [];
    for (let i = 0; i < N; i++) {
      const θ = (2 * Math.PI * i) / N;
      bldPos.push({ x: CITY_R * Math.cos(θ), z: CITY_R * Math.sin(θ) });
    }

    // ── Grid floor ─────────────────────────────────────────────────────────────
    const gridSize = CITY_R * 2.8;
    const grid = new THREE.GridHelper(gridSize, 10, 0xc8b0a0, 0xd8c4b4);
    const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
    gridMats.forEach((m) => {
      (m as THREE.LineBasicMaterial).transparent = true;
      (m as THREE.LineBasicMaterial).opacity = 0.35;
      toDisposeM.push(m);
    });
    toDispose.push(grid.geometry);
    group.add(grid);

    // ── 2D roads ───────────────────────────────────────────────────────────────
    for (let i = 0; i < N; i++) {
      const j  = (i + 1) % N;
      const pa = bldPos[i], pb = bldPos[j];
      const corner = elbowCorner(pa.x, pa.z, pb.x, pb.z);
      const pts = [
        new THREE.Vector3(pa.x, 0.003, pa.z),
        new THREE.Vector3(corner.x, 0.003, corner.z),
        new THREE.Vector3(pb.x, 0.003, pb.z),
      ];
      const roadGeo = new THREE.BufferGeometry().setFromPoints(pts);
      toDispose.push(roadGeo);
      group.add(new THREE.Line(roadGeo, matRoad));
    }

    // ── Buildings ─────────────────────────────────────────────────────────────
    for (let i = 0; i < N; i++) {
      const goal  = goals[i];
      const entry = effort.find((e) => e.goalId === goal.id);
      const pct   = entry?.percentage ?? 0;
      const h     = MIN_H + (MAX_H - MIN_H) * (pct / maxPct);
      const { x: bx, z: bz } = bldPos[i];

      const borderGeo = buildingBorderGeo(BASE_W, h, BASE_W);
      toDispose.push(borderGeo);
      const wire = new THREE.LineSegments(borderGeo, goal.completed ? matWireBright : matWire);
      wire.position.set(bx, h / 2, bz);

      const innerGeo = buildingInnerGeo(BASE_W, h, BASE_W, 2);
      toDispose.push(innerGeo);
      const inner = new THREE.LineSegments(innerGeo, matWireDim);
      inner.position.set(bx, 0, bz);
      group.add(inner);
      group.add(wire);

      if (pct > 0) {
        const fluidH = h * pct;
        const hw     = BASE_W * 0.44;

        const n = Math.max(60, Math.round(DOTS_MAX * pct));
        const p = initBuildingParticles(n, hw, fluidH);
        particles.push(p);
        const pts = new THREE.Points(p.geo, matDots);
        pts.position.set(bx, 0, bz);
        group.add(pts);
      }

      // Percentage label
      const { sprite: pctSprite, mat: pctMat, tex: pctTex } = buildPctSprite(pct);
      spriteMats.push(pctMat); spriteTexes.push(pctTex);
      pctSprite.position.set(bx, h + 0.30, bz);
      pctSprite.scale.set(1.10, 0.38, 1);
      group.add(pctSprite);

      // Hit mesh
      const hitGeo  = new THREE.BoxGeometry(BASE_W * 1.2, h, BASE_W * 1.2);
      toDispose.push(hitGeo);
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.set(bx, h / 2, bz);
      hitMesh.userData.goalId = goal.id;
      group.add(hitMesh);
      hitMeshes.push(hitMesh);
    }

    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // ── Drag (X and Y axes) ───────────────────────────────────────────────────
    let isDragging = false, lastMouseX = 0, lastMouseY = 0, dragVelocity = 0;
    const onMouseDown  = (e: MouseEvent) => { isDragging = true; lastMouseX = e.clientX; lastMouseY = e.clientY; dragVelocity = 0; };
    const onMouseMove  = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      group.rotation.y += dx * 0.012;
      dragVelocity = dx * 0.012;
      // Clamp X rotation so city stays right-side up
      group.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, group.rotation.x + dy * 0.012));
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };
    const onMouseUp    = () => { isDragging = false; };
    const onMouseLeave = () => { isDragging = false; };
    el.addEventListener("mousedown",  onMouseDown);
    el.addEventListener("mousemove",  onMouseMove);
    el.addEventListener("mouseup",    onMouseUp);
    el.addEventListener("mouseleave", onMouseLeave);

    // ── Click ─────────────────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const onClick = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const ndc  = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width)  *  2 - 1,
        -((e.clientY - rect.top) / rect.height) *  2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(hitMeshes);
      onSelectRef.current(hits.length > 0 ? hits[0].object.userData.goalId as string : null);
    };
    el.addEventListener("click", onClick);

    // ── Animate ───────────────────────────────────────────────────────────────
    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isDragging) dragVelocity *= 0.85;
      for (const p of particles) stepBuildingParticles(p);
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      el.removeEventListener("mousedown",  onMouseDown);
      el.removeEventListener("mousemove",  onMouseMove);
      el.removeEventListener("mouseup",    onMouseUp);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("click",      onClick);
      toDispose.forEach((g)  => g.dispose());
      toDisposeM.forEach((m) => m.dispose());
      particles.forEach((p)  => p.geo.dispose());
      spriteMats.forEach((m) => m.dispose());
      spriteTexes.forEach((t) => t.dispose());
      matWire.dispose(); matWireBright.dispose(); matWireDim.dispose(); matDots.dispose();
      matRoad.dispose(); hitMat.dispose();
      renderer.dispose();
      if (el.contains(canvas)) el.removeChild(canvas);
    };
  }, [sceneKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (goals.length === 0) return null;
  return (
    <div
      ref={mountRef}
      className="w-full h-full"
      style={{ cursor: "grab" }}
    />
  );
}
