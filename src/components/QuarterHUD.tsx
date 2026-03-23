import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Goal } from "@/types/database/Goal";
import type { QuarterEffortEntry } from "@/context/GoalsContext";

// ── Constants ─────────────────────────────────────────────────────────────────
const RING_INNER_R  = 1.4;
const RING_STEP     = 1.0;
const HALF_BAND     = 0.07;
const DOTS_PER_RING = 260;
const SCAN_EXTRA    = 0.35;
const TICK_COUNT    = 36;
const START_A       = -Math.PI / 2;   // top of clock
const AUTO_ROT      = 0.0005;

const ORANGE_SHADES = [
  new THREE.Color(0xff8040),
  new THREE.Color(0xff6020),
  new THREE.Color(0xf05010),
  new THREE.Color(0xffa560),
  new THREE.Color(0xd04015),
  new THREE.Color(0xff9848),
  new THREE.Color(0xe06830),
];

// ── Arc geometry (partial circle in XZ plane) ─────────────────────────────────
function buildArc(r: number, pct: number): THREE.BufferGeometry {
  const filled = Math.max(pct, 0.008);
  const segs   = Math.max(4, Math.round(96 * filled));
  const pts: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const a = START_A + (i / segs) * 2 * Math.PI * filled;
    pts.push(Math.cos(a) * r, 0, Math.sin(a) * r);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

// ── Full track circle ─────────────────────────────────────────────────────────
function buildTrack(r: number): THREE.BufferGeometry {
  const pts: number[] = [];
  const segs = 96;
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * 2 * Math.PI;
    pts.push(Math.cos(a) * r, 0, Math.sin(a) * r);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return geo;
}

// ── Ring particle state ───────────────────────────────────────────────────────
interface RingParticles {
  geo:    THREE.BufferGeometry;
  angle:  Float32Array;
  radOff: Float32Array;
  dAngle: Float32Array;
  dRad:   Float32Array;
  minA:   number;
  maxA:   number;
  ringR:  number;
}

function initRingParticles(ringR: number, pct: number): RingParticles | null {
  if (pct <= 0) return null;
  const n    = DOTS_PER_RING;
  const minA = START_A;
  const maxA = START_A + 2 * Math.PI * pct;
  const angle  = new Float32Array(n);
  const radOff = new Float32Array(n);
  const dAngle = new Float32Array(n);
  const dRad   = new Float32Array(n);
  const pos    = new Float32Array(n * 3);
  const col    = new Float32Array(n * 3);

  for (let i = 0; i < n; i++) {
    angle[i]  = minA + Math.random() * (maxA - minA);
    radOff[i] = (Math.random() - 0.5) * 2 * HALF_BAND;
    dAngle[i] = (Math.random() - 0.5) * 0.009;
    dRad[i]   = (Math.random() - 0.5) * 0.004;

    const r   = ringR + radOff[i];
    pos[i*3]   = Math.cos(angle[i]) * r;
    pos[i*3+1] = 0;
    pos[i*3+2] = Math.sin(angle[i]) * r;

    const c = ORANGE_SHADES[Math.floor(Math.random() * ORANGE_SHADES.length)];
    col[i*3]   = c.r;
    col[i*3+1] = c.g;
    col[i*3+2] = c.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color",    new THREE.BufferAttribute(col, 3));
  return { geo, angle, radOff, dAngle, dRad, minA, maxA, ringR };
}

function stepRingParticles(p: RingParticles) {
  const pos = p.geo.attributes.position as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;
  for (let i = 0; i < DOTS_PER_RING; i++) {
    p.angle[i]  += p.dAngle[i];
    p.radOff[i] += p.dRad[i];
    if (p.angle[i]  < p.minA)  { p.angle[i]  = p.minA;              p.dAngle[i] *= -1; }
    if (p.angle[i]  > p.maxA)  { p.angle[i]  = p.maxA;              p.dAngle[i] *= -1; }
    if (Math.abs(p.radOff[i]) > HALF_BAND) { p.radOff[i] = Math.sign(p.radOff[i]) * HALF_BAND; p.dRad[i] *= -1; }
    const r = p.ringR + p.radOff[i];
    arr[i*3]   = Math.cos(p.angle[i]) * r;
    arr[i*3+1] = 0;
    arr[i*3+2] = Math.sin(p.angle[i]) * r;
  }
  pos.needsUpdate = true;
}

// ── Label sprite ──────────────────────────────────────────────────────────────
function buildLabel(title: string, pct: number): {
  sprite: THREE.Sprite; mat: THREE.SpriteMaterial; tex: THREE.CanvasTexture;
} {
  const w = 320, h = 56;
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const ctx = off.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  const alpha = pct > 0 ? 0.90 : 0.35;
  ctx.font = "bold 13px sans-serif";
  ctx.fillStyle = `rgba(255, 160, 80, ${alpha})`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const label = title.length > 18 ? title.substring(0, 18) + "…" : title;
  ctx.fillText(`${label}`, 10, 22);
  ctx.font = "11px sans-serif";
  ctx.fillStyle = `rgba(255, 200, 140, ${alpha * 0.85})`;
  ctx.fillText(`${Math.round(pct * 100)}%`, 10, 40);
  const tex = new THREE.CanvasTexture(off);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  return { sprite, mat, tex };
}

// ── Props ─────────────────────────────────────────────────────────────────────
export interface QuarterHUDProps {
  monthlyGoals: Goal[];
  effort:       QuarterEffortEntry[];
  activeId:     string | null;
  onRingClick:  (id: string | null) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function QuarterHUD({ monthlyGoals, effort, activeId, onRingClick }: QuarterHUDProps) {
  const mountRef      = useRef<HTMLDivElement>(null);
  const onClickRef    = useRef(onRingClick);
  const ringMeshRefs  = useRef<Map<string, { arcLine: THREE.Line; trackLine: THREE.Line }>>(new Map());

  useEffect(() => { onClickRef.current = onRingClick; }, [onRingClick]);

  // Highlight active ring without scene rebuild
  useEffect(() => {
    ringMeshRefs.current.forEach((meshes, goalId) => {
      const isAct = goalId === activeId;
      (meshes.arcLine.material   as THREE.LineBasicMaterial).opacity   = isAct ? 1.0  : 0.88;
      (meshes.trackLine.material as THREE.LineBasicMaterial).opacity   = isAct ? 0.50 : 0.20;
      meshes.arcLine.scale.setScalar(isAct ? 1.015 : 1.0);
    });
  }, [activeId]);

  const sceneKey =
    monthlyGoals.map((g) => g.id).join("|") + "|" +
    effort.map((e) => `${e.goalId}:${e.percentage.toFixed(3)}`).join("|");

  useEffect(() => {
    const el = mountRef.current;
    if (!el || monthlyGoals.length === 0) return;
    ringMeshRefs.current.clear();

    const n        = monthlyGoals.length;
    const outerR   = RING_INNER_R + (n - 1) * RING_STEP + SCAN_EXTRA;
    const fovRad   = (48 * Math.PI) / 180;
    const fitR     = outerR * 1.15;
    const camDist  = fitR / Math.tan(fovRad / 2);
    const TILT     = (18 * Math.PI) / 180;   // shallow tilt — rings stay circular

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, Math.sin(TILT) * camDist, Math.cos(TILT) * camDist);
    camera.lookAt(0, 0, 0);

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

    // ── Shared materials ──────────────────────────────────────────────────────
    const matDots = new THREE.PointsMaterial({
      vertexColors: true, size: 0.072, sizeAttenuation: true,
      transparent: true, opacity: 0.80,
    });
    const matHit  = new THREE.MeshBasicMaterial({ visible: false });
    const matHub  = new THREE.MeshBasicMaterial({ color: 0xff8040, transparent: true, opacity: 0.65, wireframe: true });
    const matScan = new THREE.MeshBasicMaterial({ color: 0xff8040, transparent: true, opacity: 0.14, wireframe: true });
    const matTick = new THREE.LineBasicMaterial({ color: 0xc2410c, transparent: true, opacity: 0.30 });

    const group = new THREE.Group();

    // disposal lists
    const trackGeos:  THREE.BufferGeometry[]   = [];
    const arcGeos:    THREE.BufferGeometry[]   = [];
    const hitGeos:    THREE.BufferGeometry[]   = [];
    const particles:  RingParticles[]          = [];
    const spriteMats: THREE.SpriteMaterial[]   = [];
    const spriteTexs: THREE.CanvasTexture[]    = [];
    const trackMats:  THREE.LineBasicMaterial[] = [];
    const arcMats:    THREE.LineBasicMaterial[] = [];
    const hitMeshes:  THREE.Mesh[]             = [];

    // ── Per-goal rings ────────────────────────────────────────────────────────
    for (let i = 0; i < n; i++) {
      const goal  = monthlyGoals[i];
      const entry = effort.find((e) => e.goalId === goal.id);
      const pct   = entry?.percentage ?? 0;
      const r     = RING_INNER_R + i * RING_STEP;

      // Track
      const trackGeo = buildTrack(r);
      trackGeos.push(trackGeo);
      const trackMat = new THREE.LineBasicMaterial({
        color: 0xc2410c, transparent: true, opacity: 0.20,
      });
      trackMats.push(trackMat);
      const trackLine = new THREE.Line(trackGeo, trackMat);
      group.add(trackLine);

      // Progress arc
      const arcGeo = buildArc(r, pct);
      arcGeos.push(arcGeo);
      const arcMat = new THREE.LineBasicMaterial({
        color: pct > 0 ? 0xff6020 : 0xc2410c,
        transparent: true,
        opacity: pct > 0 ? 0.88 : 0.20,
        linewidth: 2,
      });
      arcMats.push(arcMat);
      const arcLine = new THREE.Line(arcGeo, arcMat);
      group.add(arcLine);

      // Store for highlight effect
      ringMeshRefs.current.set(goal.id, { arcLine, trackLine });

      // End-of-arc dot
      const endA   = START_A + 2 * Math.PI * Math.max(pct, 0.008);
      const dotGeo = new THREE.SphereGeometry(0.09, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({
        color: pct > 0 ? 0xff8040 : 0xc2410c,
        transparent: true, opacity: pct > 0 ? 0.95 : 0.25,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.set(Math.cos(endA) * r, 0, Math.sin(endA) * r);
      group.add(dot);

      // Start dot
      const startDotGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const startDotMat = new THREE.MeshBasicMaterial({ color: 0xff6020, transparent: true, opacity: 0.50 });
      const startDot = new THREE.Mesh(startDotGeo, startDotMat);
      startDot.position.set(Math.cos(START_A) * r, 0, Math.sin(START_A) * r);
      group.add(startDot);

      // Particles
      const p = initRingParticles(r, pct);
      if (p) {
        particles.push(p);
        group.add(new THREE.Points(p.geo, matDots));
      }

      // Label at arc endpoint (slightly outside ring)
      const labelR = r + 0.32;
      const { sprite, mat: sMat, tex: sTex } = buildLabel(goal.title, pct);
      sprite.position.set(Math.cos(endA) * labelR, 0.10, Math.sin(endA) * labelR);
      sprite.scale.set(1.8, 0.42, 1);
      group.add(sprite);
      spriteMats.push(sMat);
      spriteTexs.push(sTex);

      // Invisible torus for hit detection (lies in XZ plane)
      const hitGeo  = new THREE.TorusGeometry(r, 0.22, 6, 64);
      hitGeos.push(hitGeo);
      const hitMesh = new THREE.Mesh(hitGeo, matHit);
      hitMesh.rotation.x     = -Math.PI / 2;
      hitMesh.userData.goalId = goal.id;
      group.add(hitMesh);
      hitMeshes.push(hitMesh);
    }

    // ── Decorations ───────────────────────────────────────────────────────────

    // Central hub
    const hubGeo = new THREE.SphereGeometry(0.13, 12, 12);
    const hub    = new THREE.Mesh(hubGeo, matHub);
    group.add(hub);

    // Outer scan ring
    const scanGeo  = new THREE.TorusGeometry(outerR, 0.012, 6, 128);
    const scanMesh = new THREE.Mesh(scanGeo, matScan);
    scanMesh.rotation.x = -Math.PI / 2;
    group.add(scanMesh);

    // Tick marks on scan ring
    const tickPts: number[] = [];
    for (let t = 0; t < TICK_COUNT; t++) {
      const a  = (t / TICK_COUNT) * Math.PI * 2;
      const r0 = outerR - 0.07;
      const r1 = outerR + 0.07;
      tickPts.push(Math.cos(a)*r0, 0, Math.sin(a)*r0, Math.cos(a)*r1, 0, Math.sin(a)*r1);
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute("position", new THREE.Float32BufferAttribute(tickPts, 3));
    group.add(new THREE.LineSegments(tickGeo, matTick));

    scene.add(group);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // ── Drag rotation ─────────────────────────────────────────────────────────
    let isDragging = false, lastX = 0;
    const onPointerDown  = (e: PointerEvent) => { isDragging = true;  lastX = e.clientX; };
    const onPointerMove  = (e: PointerEvent) => {
      if (!isDragging) return;
      group.rotation.y += (e.clientX - lastX) * 0.008;
      lastX = e.clientX;
    };
    const onPointerUp    = () => { isDragging = false; };

    // ── Click → raycast ───────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouseNDC  = new THREE.Vector2();
    const onClick   = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      mouseNDC.set(
        ((e.clientX - rect.left) / rect.width)  * 2 - 1,
        -((e.clientY - rect.top)  / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(mouseNDC, camera);
      const hits = raycaster.intersectObjects(hitMeshes);
      if (hits.length > 0) {
        onClickRef.current(hits[0].object.userData.goalId as string);
      } else {
        onClickRef.current(null);
      }
    };

    el.addEventListener("pointerdown",  onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup",   onPointerUp);
    el.addEventListener("click", onClick);

    // ── Animate ───────────────────────────────────────────────────────────────
    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (!isDragging) group.rotation.y += AUTO_ROT;
      for (const p of particles) stepRingParticles(p);
      // Pulse scan ring
      matScan.opacity = 0.10 + 0.06 * Math.sin(Date.now() * 0.0012);
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      el.removeEventListener("pointerdown",  onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup",   onPointerUp);
      el.removeEventListener("click", onClick);
      trackGeos.forEach((g)  => g.dispose());
      arcGeos.forEach((g)    => g.dispose());
      hitGeos.forEach((g)    => g.dispose());
      particles.forEach((p)  => p.geo.dispose());
      spriteMats.forEach((m) => m.dispose());
      spriteTexs.forEach((t) => t.dispose());
      trackMats.forEach((m)  => m.dispose());
      arcMats.forEach((m)    => m.dispose());
      tickGeo.dispose();
      scanGeo.dispose();
      hubGeo.dispose();
      [matDots, matHit, matHub, matScan, matTick].forEach((m) => m.dispose());
      renderer.dispose();
      if (el.contains(canvas)) el.removeChild(canvas);
    };
  }, [sceneKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (monthlyGoals.length === 0) return null;

  const canvasH = Math.round(360 + monthlyGoals.length * 40);
  return (
    <div
      ref={mountRef}
      className="w-full cursor-grab active:cursor-grabbing"
      style={{ height: canvasH }}
    />
  );
}
