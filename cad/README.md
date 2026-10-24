# CAD

Parametric mechanical designs, modelled in [CadQuery](https://cadquery.readthedocs.io). Each design is one script with its parameters (mm) at the top.

| Design | Script | Outputs |
| --- | --- | --- |
| Mechanical Wheel (weekly ring) | `mechanical_wheel.py` | `mechanical_wheel.step`, `../public/models/mechanical_wheel.glb` |

The `.step` file is the CAD source of truth (open it in Fusion, FreeCAD, Onshape…). The `.glb` is the web mesh used by `src/components/WeeklyTorusRing.tsx`; its nodes `rim_0..rim_3` are the weekly quadrants (counter-clockwise from +X), coloured by completion at runtime.

## Regenerate

```sh
uv venv -p 3.12 .venv-cad
VIRTUAL_ENV=.venv-cad uv pip install cadquery trimesh
.venv-cad/bin/python cad/mechanical_wheel.py
```
