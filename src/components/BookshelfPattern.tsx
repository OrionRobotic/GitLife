import { useEffect, useRef } from "react";

const BookshelfPattern = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 560;
    const H = 400;
    canvas.width = W;
    canvas.height = H;

    let time = 0;
    let animId: number | null = null;

    const CELL = 5;
    const GAP = 3.5;
    const STEP = CELL + GAP;
    const PAD = 10;
    const INNER_X = PAD + 10;
    const INNER_Y = PAD + 10;
    const INNER_W = W - INNER_X * 2;
    const INNER_H = H - INNER_Y * 2;
    const COLS = Math.floor(INNER_W / STEP);
    const ROWS = Math.floor(INNER_H / STEP);
    const GRID_W = COLS * STEP - GAP;
    const GRID_H = ROWS * STEP - GAP;
    const GX = INNER_X + (INNER_W - GRID_W) / 2;
    const GY = INNER_Y + (INNER_H - GRID_H) / 2;
    const SPINE_COL = Math.floor(COLS / 2);

    const HUE = 162;
    const SAT = 18;

    function easeWave(t: number): number {
      return (Math.sin(t) + 1) / 2;
    }

    function drawRoundedRect(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath();
      ctx!.moveTo(x + r, y);
      ctx!.lineTo(x + w - r, y);
      ctx!.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx!.lineTo(x + w, y + h - r);
      ctx!.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx!.lineTo(x + r, y + h);
      ctx!.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx!.lineTo(x, y + r);
      ctx!.quadraticCurveTo(x, y, x + r, y);
      ctx!.closePath();
    }

    function animate() {
      time += 0.007;
      ctx!.clearRect(0, 0, W, H);

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const x = GX + col * STEP;
          const y = GY + row * STEP;

          const distFromSpine = Math.abs(col - SPINE_COL) / (COLS / 2);
          const side = col < SPINE_COL ? -1 : 1;
          const pageCol = col < SPINE_COL
            ? (SPINE_COL - 1 - col)
            : (col - SPINE_COL);

          const sweep   = easeWave((pageCol * 0.35 + row * 0.25) * side - time * 1.6);
          const texture = easeWave(row * 0.6 - pageCol * 0.2 * side + time * 0.9);
          const breath  = easeWave(time * 0.5 + distFromSpine * 1.5);

          const combined = 0.18 + (sweep * 0.45 + texture * 0.30 + breath * 0.25) * 0.82;

          const ex = 1 - Math.pow(distFromSpine, 1.8);
          const ey = 1 - Math.abs((row / (ROWS - 1)) * 2 - 1);
          const edgeFade = Math.min(ex * 2, 1) * Math.pow(ey + 0.3, 0.6);
          const opacity = combined * Math.min(edgeFade, 1);

          if (opacity < 0.04) continue;

          // Depth perspective: rows at the top appear slightly smaller and
          // compressed toward the horizontal center — simulates 3D tilt
          const depth = row / (ROWS - 1); // 0 = top (far), 1 = bottom (near)
          const perspScale = 0.72 + depth * 0.28;
          const cx = W / 2;
          const projX = cx + (x + CELL / 2 - cx) * perspScale;
          const projY = GY + (y + CELL / 2 - GY) * perspScale;

          const lightness = 44 + (1 - opacity) * 42;
          const alpha = Math.min(opacity * 1.3, 1);
          ctx!.fillStyle = `hsla(${HUE}, ${SAT}%, ${lightness}%, ${alpha})`;

          // Shadow gives each cell a raised, 3D feel
          ctx!.shadowColor = `hsla(${HUE}, 30%, 30%, ${opacity * 0.35})`;
          ctx!.shadowBlur = 3;
          ctx!.shadowOffsetX = 0.5;
          ctx!.shadowOffsetY = 1.5;

          const scaleH = 0.75 + opacity * 0.25 + (1 - distFromSpine) * 0.1;
          const scaleW = 0.82 + opacity * 0.18;
          const sw = CELL * scaleW * perspScale;
          const sh = CELL * scaleH * perspScale;

          drawRoundedRect(projX - sw / 2, projY - sh / 2, sw, sh, 1);
          ctx!.fill();
        }
      }

      // Reset shadow
      ctx!.shadowColor = "transparent";
      ctx!.shadowBlur = 0;
      ctx!.shadowOffsetX = 0;
      ctx!.shadowOffsetY = 0;

      animId = requestAnimationFrame(animate);
    }

    animate();
    return () => { if (animId) cancelAnimationFrame(animId); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-[400px] h-[286px] flex-shrink-0"
      style={{
        imageRendering: "auto",
        transform: "perspective(600px) rotateX(22deg) rotateY(-6deg)",
        transformOrigin: "center center",
      }}
    />
  );
};

export default BookshelfPattern;
