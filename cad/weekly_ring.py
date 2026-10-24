"""Weekly Ring: CAD model of the in-app weekly torus (src/components/WeeklyTorusRing.tsx).

An octagonal-section torus split into one segment per week, separated by gaps.
Same proportions as the three.js version (scene units x 100 = mm).

Outputs:
  cad/weekly_ring.step   assembly, one solid per week (week_1..week_N)
"""

import math
from pathlib import Path

import cadquery as cq

# ── Parameters (mm) ───────────────────────────────────────────────────────────
TORUS_RADIUS = 80.0  # ring centre radius        (TORUS_RADIUS = 0.8)
TUBE_APOTHEM = 58.0  # centre -> flat face        (TUBE_RADIUS = 0.58)
SIDES = 8  # octagonal section                     (N_SIDES = 8)
WEEKS = 4
GAP_HALF_DEG = math.degrees(0.08)  # half gap between weeks (GAP_HALF = 0.08 rad)

STEP_OUT = Path(__file__).with_name("weekly_ring.step")

CORNER_R = TUBE_APOTHEM / math.cos(math.pi / SIDES)  # circumscribed octagon


def section() -> cq.Workplane:
    """Octagon in the XZ plane centred at (TORUS_RADIUS, 0, 0), a vertex pointing outward."""
    pts = [
        (
            TORUS_RADIUS + CORNER_R * math.cos(2 * math.pi * k / SIDES),
            CORNER_R * math.sin(2 * math.pi * k / SIDES),
        )
        for k in range(SIDES)
    ]
    return cq.Workplane("XZ").polyline(pts).close()


def week_segment(i: int) -> cq.Workplane:
    span = 360.0 / WEEKS
    start = i * span + GAP_HALF_DEG
    sweep = span - 2 * GAP_HALF_DEG
    solid = section().revolve(sweep, (0, 0, 0), (0, 1, 0))
    # XZ revolves about the plane's Y (= world Z); rotate to the week's start angle.
    return solid.rotate((0, 0, 0), (0, 0, 1), start)


def build() -> cq.Assembly:
    asm = cq.Assembly(name="weekly_ring")
    for i in range(WEEKS):
        asm.add(week_segment(i), name=f"week_{i + 1}")
    return asm


if __name__ == "__main__":
    ring = build()
    ring.export(str(STEP_OUT))
    # Self-check: N separate solids, each one week's share of a full torus minus gaps.
    solids = [week_segment(i).val() for i in range(WEEKS)]
    area = SIDES * TUBE_APOTHEM**2 * math.tan(math.pi / SIDES)  # octagon area
    full = area * 2 * math.pi * TORUS_RADIUS  # Pappus
    expected = full * (1 - WEEKS * 2 * GAP_HALF_DEG / 360) / WEEKS
    for s in solids:
        assert abs(s.Volume() - expected) / expected < 1e-3, (s.Volume(), expected)
    print(f"wrote {STEP_OUT.name}: {WEEKS} segments, {expected / 1000:.1f} cm3 each")
