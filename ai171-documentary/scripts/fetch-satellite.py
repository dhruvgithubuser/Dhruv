"""Stitch Sentinel-2 cloudless (EOX, 2016 edition, CC BY 4.0) Web-Mercator tiles into one mosaic per
zoom level, each centred on the AI171 area. Writes public/sat/z{N}.jpg and public/sat/meta.json.

Attribution (required, shown in the film's credits): "Sentinel-2 cloudless - https://s2maps.eu by EOX
IT Services GmbH (Contains modified Copernicus Sentinel data 2016)".
"""
import io, json, math, subprocess, sys
from pathlib import Path
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "public" / "sat"
OUT.mkdir(parents=True, exist_ok=True)
URL = "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/{z}/{y}/{x}.jpg"
CENTER = (23.066, 72.623)          # between the airport and the crash site
LEVELS = {4: (20.5, 76.0), 6: (22.5, 73.5), 8: CENTER, 10: CENTER, 12: CENTER, 14: CENTER}
COLS, ROWS = 12, 7                 # 3072 x 1792 px per level


def world_px(lat, lon, z):
    s = 256 * 2 ** z
    x = (lon + 180) / 360 * s
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * s
    return x, y


meta = {}
for z, (lat, lon) in LEVELS.items():
    cx, cy = world_px(lat, lon, z)
    tx0, ty0 = int(cx // 256) - COLS // 2, int(cy // 256) - ROWS // 2
    mosaic = Image.new("RGB", (COLS * 256, ROWS * 256))
    for j in range(ROWS):
        for i in range(COLS):
            x, y = (tx0 + i) % (2 ** z), ty0 + j
            if not 0 <= y < 2 ** z:
                continue
            data = subprocess.run(["curl", "-sSf", URL.format(z=z, y=y, x=x)], capture_output=True).stdout
            if data:
                mosaic.paste(Image.open(io.BytesIO(data)).convert("RGB"), (i * 256, j * 256))
    mosaic.save(OUT / f"z{z}.jpg", quality=90)
    meta[z] = {"x0": tx0 * 256, "y0": ty0 * 256, "w": COLS * 256, "h": ROWS * 256}
    print("z", z, "done", flush=True)
(OUT / "meta.json").write_text(json.dumps(meta, indent=1))
