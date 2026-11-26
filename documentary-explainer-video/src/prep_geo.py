"""Clip Natural Earth 1:10m layers to the US Gulf coast and save a compact geo.json for the renderer."""
import json, sys
from shapely.geometry import shape, box, mapping
from shapely.ops import unary_union

DATA, OUT = sys.argv[1], sys.argv[2]
BB = box(-108, 14.0, -68, 47.0)

def load(name):
    return json.load(open(f"{DATA}/{name}.geojson"))["features"]

def rings(geom):
    polys = [geom] if geom.geom_type == "Polygon" else list(getattr(geom, "geoms", []))
    out = []
    for p in polys:
        if p.geom_type != "Polygon" or p.is_empty:
            continue
        out.append([[round(x, 4), round(y, 4)] for x, y in p.exterior.coords])
        for h in p.interiors:
            out.append([[round(x, 4), round(y, 4)] for x, y in h.coords])
    return out

land = unary_union([shape(f["geometry"]).intersection(BB) for f in load("ne_10m_land") + load("ne_10m_minor_islands")
                    if shape(f["geometry"]).intersects(BB)]).simplify(0.0015)
lakes = [shape(f["geometry"]).intersection(BB).simplify(0.0015) for f in load("ne_10m_lakes")
         if shape(f["geometry"]).intersects(BB)]
states = {}
for f in load("ne_10m_admin_1"):
    p = f["properties"]
    if p.get("adm0_a3") == "USA" and p.get("name") in ("Louisiana", "Mississippi", "Alabama", "Florida", "Texas", "Georgia", "Arkansas", "Tennessee", "Oklahoma", "South Carolina"):
        states[p["name"]] = rings(shape(f["geometry"]).intersection(BB).simplify(0.002))
lines = []
for f in [f for f in load("ne_10m_admin_1_states_provinces_lines") if f.get("geometry")]:
    g = shape(f["geometry"])
    if g.intersects(BB) and f["properties"].get("adm0_a3") in ("USA", None):
        g = g.intersection(BB).simplify(0.002)
        for ln in ([g] if g.geom_type == "LineString" else list(getattr(g, "geoms", []))):
            if ln.geom_type == "LineString":
                lines.append([[round(x, 4), round(y, 4)] for x, y in ln.coords])

geo = dict(land=rings(land), lakes=[r for l in lakes for r in rings(l)], states=states, state_lines=lines)
json.dump(geo, open(OUT, "w"), separators=(",", ":"))
print({k: (len(v) if not isinstance(v, dict) else {s: len(r) for s, r in v.items()}) for k, v in geo.items()},
      "pts:", sum(len(r) for r in geo["land"]))
