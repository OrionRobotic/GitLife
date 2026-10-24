"""Mechanical Wheel: segmented spur-gear rim on a spoked carrier with a ball-bearing hub.

Outputs (next to this script / in public/models):
  cad/mechanical_wheel.step         CAD source of truth (full assembly)
  public/models/mechanical_wheel.glb web mesh, one node per part:
                                     rim_0..rim_3 (weekly quadrants, CCW from +X), carrier,
                                     bearing, fasteners, shaft
All dimensions in mm. Gear axis = Z.
"""

from math import acos, cos, pi, radians, sin, tan
from pathlib import Path

import cadquery as cq
import numpy as np
import trimesh

# ── Parameters ───────────────────────────────────────────────────────────────
MODULE = 2.5  # gear module
TEETH = 60  # must be divisible by SEGMENTS
PRESSURE_ANGLE = 20.0  # deg
FACE_WIDTH = 14.0  # rim / gear thickness
SEGMENTS = 4  # weekly quadrants
SEGMENT_GAP = 1.2  # slot width between rim segments
RIM_INNER_R = 60.0
RIM_CHAMFER = 0.8
RIM_BOLTS_PER_SEG = 3
RIM_BOLT_R = 66.0  # bolt circle radius
RIM_BOLT_D = 4.5
BOLT_HEAD_D = 7.0
BOLT_HEAD_H = 3.0
BOLT_SOCKET = 3.0  # hex socket across flats

CARRIER_INNER_R = 50.0  # carrier ring r 50..60
CARRIER_WIDTH = 10.0
SPOKES = 8
SPOKE_W = 7.0
SPOKE_T = 6.0

HUB_OUTER_R = 26.0
HUB_BORE_R = 16.0
HUB_WIDTH = 22.0
HUB_CHAMFER = 1.2
HUB_BOLTS = 6
HUB_BOLT_R = 21.0
HUB_BOLT_D = 3.2

BEARING_OUTER_RACE = (11.0, HUB_BORE_R)  # r_in, r_out
BEARING_INNER_RACE = (5.0, 8.5)
BEARING_WIDTH = 10.0
BALLS = 9

SHAFT_R = 5.0
SHAFT_LEN = 34.0
SHAFT_FLAT = 0.8  # depth of D-flat

MESH_TOL = 0.08  # linear tessellation tolerance (mm)
MESH_ANG = 0.35  # angular tolerance (rad)

HERE = Path(__file__).resolve().parent
STEP_OUT = HERE / "mechanical_wheel.step"
GLB_OUT = HERE.parent / "public" / "models" / "mechanical_wheel.glb"


# ── Geometry ─────────────────────────────────────────────────────────────────
def inv(a: float) -> float:
    return tan(a) - a


def gear_profile() -> cq.Workplane:
    """Involute spur gear outline: root/tip arcs + spline flanks through exact involute points."""
    rp = MODULE * TEETH / 2
    rb = rp * cos(radians(PRESSURE_ANGLE))
    ra = rp + MODULE
    rr = rp - 1.25 * MODULE
    half = pi / (2 * TEETH) + inv(radians(PRESSURE_ANGLE))  # half-tooth angle at base circle
    # ponytail: involute starts at the root circle (true while rr >= rb, i.e. TEETH >= ~42)
    flank = [(r, half - inv(acos(min(1.0, rb / r)))) for r in np.linspace(max(rb, rr), ra, 6)]
    pitch = 2 * pi / TEETH

    def pt(r: float, a: float) -> tuple[float, float]:
        return (r * cos(a), r * sin(a))

    wp = cq.Workplane("XY").moveTo(*pt(rr, -pitch / 2))
    for i in range(TEETH):
        c = i * pitch
        th0 = flank[0][1]
        wp = wp.threePointArc(pt(rr, (c - pitch / 2 + c - th0) / 2), pt(rr, c - th0))
        wp = wp.spline([pt(r, c - th) for r, th in flank[1:]], includeCurrent=True)
        wp = wp.threePointArc(pt(ra, c), pt(ra, c + flank[-1][1]))
        wp = wp.spline([pt(r, c + th) for r, th in reversed(flank[:-1])], includeCurrent=True)
        wp = wp.threePointArc(pt(rr, (c + th0 + c + pitch / 2) / 2), pt(rr, c + pitch / 2))
    return wp.close()


def ring(r_in: float, r_out: float, width: float) -> cq.Workplane:
    return (
        cq.Workplane("XY")
        .circle(r_out)
        .circle(r_in)
        .extrude(width)
        .translate((0, 0, -width / 2))
    )


def rim_segments() -> list[cq.Workplane]:
    gear = (
        gear_profile()
        .extrude(FACE_WIDTH)
        .translate((0, 0, -FACE_WIDTH / 2))
    )
    bore = cq.Workplane("XY").circle(RIM_INNER_R).extrude(FACE_WIDTH).translate((0, 0, -FACE_WIDTH / 2))
    gear = gear.cut(bore).edges(cq.selectors.RadiusNthSelector(0)).chamfer(RIM_CHAMFER)  # bore edges

    pitch = 2 * pi / TEETH
    seg_angle = 2 * pi / SEGMENTS
    big = RIM_INNER_R * 2
    segs = []
    for s in range(SEGMENTS):
        # boundaries sit on valley centres so no tooth is cut
        a0 = s * seg_angle - pitch / 2
        a1 = (s + 1) * seg_angle - pitch / 2
        wedge = (
            cq.Workplane("XY")
            .moveTo(0, 0)
            .lineTo(big * cos(a0), big * sin(a0))
            .threePointArc(
                (big * cos((a0 + a1) / 2), big * sin((a0 + a1) / 2)),
                (big * cos(a1), big * sin(a1)),
            )
            .close()
            .extrude(FACE_WIDTH * 2)
            .translate((0, 0, -FACE_WIDTH))
        )
        seg = gear.intersect(wedge)
        for a in (a0, a1):  # slot between segments
            slot = (
                cq.Workplane("XY")
                .center(RIM_INNER_R * 1.2, 0)
                .rect(RIM_INNER_R * 0.5, SEGMENT_GAP)
                .extrude(FACE_WIDTH * 2)
                .translate((0, 0, -FACE_WIDTH))
                .rotate((0, 0, 0), (0, 0, 1), a * 180 / pi)
            )
            seg = seg.cut(slot)
        bolt_pts = [
            (RIM_BOLT_R * cos(a0 + (k + 0.5) * seg_angle / RIM_BOLTS_PER_SEG),
             RIM_BOLT_R * sin(a0 + (k + 0.5) * seg_angle / RIM_BOLTS_PER_SEG))
            for k in range(RIM_BOLTS_PER_SEG)
        ]
        holes = (
            cq.Workplane("XY")
            .pushPoints(bolt_pts)
            .circle(RIM_BOLT_D / 2)
            .extrude(FACE_WIDTH * 2)
            .translate((0, 0, -FACE_WIDTH))
        )
        segs.append(seg.cut(holes))
    return segs


def carrier() -> cq.Workplane:
    outer = ring(CARRIER_INNER_R, RIM_INNER_R, CARRIER_WIDTH).faces("<Z or >Z").edges().chamfer(0.6)
    hub = ring(HUB_BORE_R, HUB_OUTER_R, HUB_WIDTH).faces("<Z or >Z").edges().chamfer(HUB_CHAMFER)
    spoke_len = CARRIER_INNER_R - HUB_OUTER_R + 2
    body = outer.union(hub)
    for k in range(SPOKES):
        a = k * 360 / SPOKES + 180 / SPOKES  # offset so spokes don't line up with segment slots
        spoke = (
            cq.Workplane("XY")
            .center(HUB_OUTER_R - 1 + spoke_len / 2, 0)
            .rect(spoke_len, SPOKE_W)
            .extrude(SPOKE_T)
            .translate((0, 0, -SPOKE_T / 2))
            .edges("|X")
            .chamfer(0.8)
            .rotate((0, 0, 0), (0, 0, 1), a)
        )
        body = body.union(spoke)
    holes = (
        cq.Workplane("XY")
        .polarArray(HUB_BOLT_R, 0, 360, HUB_BOLTS)
        .circle(HUB_BOLT_D / 2)
        .extrude(HUB_WIDTH * 2)
        .translate((0, 0, -HUB_WIDTH))
    )
    return body.cut(holes)


def bearing() -> cq.Workplane:
    races = ring(*BEARING_OUTER_RACE, BEARING_WIDTH).union(ring(*BEARING_INNER_RACE, BEARING_WIDTH))
    races = races.faces("<Z or >Z").edges().chamfer(0.4)
    ball_r = (BEARING_OUTER_RACE[0] - BEARING_INNER_RACE[1]) / 2
    pitch_r = BEARING_INNER_RACE[1] + ball_r
    balls = cq.Workplane("XY").polarArray(pitch_r, 0, 360, BALLS).sphere(ball_r * 0.98)
    return races.union(balls)


def fasteners() -> cq.Workplane:
    """Socket-head cap screw heads on the front face of every rim bolt hole."""
    seg_angle = 2 * pi / SEGMENTS
    pitch = 2 * pi / TEETH
    pts = []
    for s in range(SEGMENTS):
        a0 = s * seg_angle - pitch / 2
        for k in range(RIM_BOLTS_PER_SEG):
            a = a0 + (k + 0.5) * seg_angle / RIM_BOLTS_PER_SEG
            pts.append((RIM_BOLT_R * cos(a), RIM_BOLT_R * sin(a)))
    heads = (
        cq.Workplane("XY")
        .workplane(offset=FACE_WIDTH / 2)
        .pushPoints(pts)
        .circle(BOLT_HEAD_D / 2)
        .extrude(BOLT_HEAD_H)
        .faces(">Z")
        .edges()
        .chamfer(0.4)
    )
    sockets = (
        cq.Workplane("XY")
        .workplane(offset=FACE_WIDTH / 2 + BOLT_HEAD_H * 0.4)
        .pushPoints(pts)
        .polygon(6, BOLT_SOCKET / cos(pi / 6))
        .extrude(BOLT_HEAD_H)
    )
    return heads.cut(sockets)


def shaft() -> cq.Workplane:
    body = (
        cq.Workplane("XY")
        .circle(SHAFT_R)
        .extrude(SHAFT_LEN)
        .translate((0, 0, -SHAFT_LEN / 2))
        .faces("<Z or >Z")
        .edges()
        .chamfer(0.6)
    )
    flat = cq.Workplane("XY").center(SHAFT_R * 2 - SHAFT_FLAT, 0).rect(SHAFT_R * 2, SHAFT_R * 2).extrude(SHAFT_LEN)
    return body.cut(flat.translate((0, 0, -SHAFT_LEN / 2)))


# ── Export ───────────────────────────────────────────────────────────────────
def to_mesh(wp: cq.Workplane) -> trimesh.Trimesh:
    verts, tris = wp.val().tessellate(MESH_TOL, MESH_ANG)
    return trimesh.Trimesh(
        vertices=[v.toTuple() for v in verts], faces=tris, process=False
    )


def main() -> None:
    parts = {f"rim_{i}": seg for i, seg in enumerate(rim_segments())}
    parts.update(carrier=carrier(), bearing=bearing(), fasteners=fasteners(), shaft=shaft())

    assy = cq.Assembly(name="mechanical_wheel")
    for name, wp in parts.items():
        assy.add(wp, name=name)
    assy.export(str(STEP_OUT))

    scene = trimesh.Scene()
    for name, wp in parts.items():
        scene.add_geometry(to_mesh(wp), node_name=name, geom_name=name)
    GLB_OUT.parent.mkdir(parents=True, exist_ok=True)
    GLB_OUT.write_bytes(scene.export(file_type="glb", include_normals=True))

    assert len(parts) == SEGMENTS + 4 and TEETH % SEGMENTS == 0
    print(f"{STEP_OUT.name}: {STEP_OUT.stat().st_size // 1024} KB, {GLB_OUT.name}: {GLB_OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
