import { useEffect, useRef } from "react";

const ContributionPattern = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 500;
    canvas.width = size;
    canvas.height = size;

    let time = 0;
    let animationFrameId: number | null = null;

    const CELL = 11;
    const GAP = 3;
    const RADIUS = 2.5;
    const GRID = 25;
    const OFFSET = (size - GRID * (CELL + GAP)) / 2;

    // Warm orange from the GitLife palette
    const HUE = 22;
    const SAT = 95;

    function easeWave(t: number): number {
      // Smooth sine-based easing
      return (Math.sin(t) + 1) / 2;
    }

    function drawRoundedRect(
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) {
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
      time += 0.008;

      // Clear to transparent (no background)
      ctx!.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;

      for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
          const x = OFFSET + col * (CELL + GAP);
          const y = OFFSET + row * (CELL + GAP);

          const cellCx = x + CELL / 2;
          const cellCy = y + CELL / 2;

          // Distance from center (normalized 0–1)
          const dx = (cellCx - cx) / (size / 2);
          const dy = (cellCy - cy) / (size / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          // Ripple wave from center
          const ripple = easeWave(dist * 6 - time * 2.5);

          // Slow spiral wave
          const spiral = easeWave(angle * 2 + dist * 3 - time * 1.2);

          // Breathing pulse
          const breath = easeWave(time * 0.8 + dist * 2);

          // Combine waves for opacity — higher base for richer color
          const combined = 0.3 + (ripple * 0.35 + spiral * 0.3 + breath * 0.25) * 0.7;

          // Skip cells well outside circular boundary
          if (dist > 1.0) continue;

          // Very soft circular fade — no visible perimeter
          const edgeFade = Math.max(0, 1 - Math.pow(dist / 0.75, 2));
          const opacity = combined * edgeFade;

          if (opacity < 0.03) continue;

          // Lightness varies: deeper orange for high opacity, lighter for low
          const lightness = 40 + (1 - opacity) * 30;

          ctx!.fillStyle = `hsla(${HUE}, ${SAT}%, ${lightness}%, ${Math.min(opacity * 1.3, 1)})`;

          // Subtle scale pulse per cell
          const scale = 0.85 + opacity * 0.15;
          const s = CELL * scale;
          const ox = x + (CELL - s) / 2;
          const oy = y + (CELL - s) / 2;

          drawRoundedRect(ox, oy, s, s, RADIUS * scale);
          ctx!.fill();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        className="w-full max-w-[500px] aspect-square rounded-full"
        style={{ imageRendering: "auto" }}
      />
    </div>
  );
};

export default ContributionPattern;
