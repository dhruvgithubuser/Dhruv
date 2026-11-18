"""Paint the sunset backgrounds (all original procedural art) and save them as PNG plates."""
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ORANGE = [(0.0, (38, 28, 88)), (0.30, (120, 52, 110)), (0.55, (215, 92, 82)),
          (0.78, (245, 140, 70)), (0.93, (255, 186, 98)), (1.0, (255, 214, 150))]
VICE = [(0.0, (22, 16, 70)), (0.30, (92, 36, 140)), (0.55, (186, 58, 160)),
        (0.78, (245, 92, 160)), (0.93, (255, 146, 170)), (1.0, (255, 196, 190))]


def grad(stops, n):
    xs = np.linspace(0, 1, n)
    out = np.zeros((n, 3))
    for c in range(3):
        out[:, c] = np.interp(xs, [s[0] for s in stops], [s[1][c] for s in stops])
    return out


def glow(W, H, cx, cy, r, color, power=2.0):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    g = np.clip(1 - d, 0, 1) ** power
    return g[..., None] * np.array(color, np.float32)[None, None]


def sky_ocean(W, H, hy, sun, pal, ocean_end):
    img = np.zeros((H, W, 3), np.float32)
    img[:hy] = grad(pal, hy)[:, None, :]
    # ocean: reflect the lower sky, darker and bluer toward the shore
    n = ocean_end - hy
    sk = grad(pal, 400)[::-1]
    oc = np.zeros((n, 3))
    for i in range(n):
        f = i / max(1, n - 1)
        base = sk[int(min(399, f * 520))] * (1 - 0.62 * f ** 0.8)
        oc[i] = base * np.array([0.92, 0.95, 1.08])
    img[hy:ocean_end] = oc[:, None, :]
    sx, sy, sr = sun
    hot = pal[-1][1]
    img += glow(W, H, sx, sy, sr * 12, [c * 0.45 for c in hot], 2.2)
    img += glow(W, H, sx, sy, sr * 4.5, [c * 0.5 for c in hot], 1.6)
    yy, xx = np.mgrid[0:H, 0:W]
    disc = ((xx - sx) ** 2 + (yy - sy) ** 2 < sr ** 2) & (yy < hy)
    img[disc] = [255, 246, 220]
    return img


def clouds(img, W, hy, pal, seed):
    rnd = random.Random(seed)
    layer = Image.new("RGBA", (W, hy), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(26):
        y = rnd.uniform(0.18, 0.86) * hy
        x = rnd.uniform(-200, W)
        w = rnd.uniform(220, 900)
        h = rnd.uniform(18, 50) * (0.6 + y / hy)
        f = y / hy
        col = grad(pal, 100)[int(min(99, f * 100 + 8))]
        col = tuple(int(min(255, c * 1.12 + 18)) for c in col)
        d.ellipse([x, y, x + w, y + h], fill=col + (int(rnd.uniform(60, 120)),))
    layer = layer.filter(ImageFilter.GaussianBlur(20))
    base = Image.fromarray(np.clip(img[:hy], 0, 255).astype(np.uint8))
    base.alpha_composite if False else None
    base = base.convert("RGBA"); base.alpha_composite(layer)
    img[:hy] = np.asarray(base.convert("RGB"), np.float32)


def palm(d, x, y, h, lean, col, rnd):
    """Silhouette palm: trunk base at (x, y), height h, lean in px at the top."""
    pts = []
    for i in range(41):
        f = i / 40
        px = x + lean * f ** 1.6
        py = y - h * f
        r = h * (0.028 - 0.012 * f)
        d.ellipse([px - r, py - r, px + r, py + r], fill=col)
        pts.append((px, py))
    cx, cy = pts[-1]
    for k in range(11):
        ang = -math.pi / 2 + (k - 5) * 0.33 + rnd.uniform(-0.12, 0.12)
        L = h * rnd.uniform(0.32, 0.46)
        droop = rnd.uniform(0.5, 0.9)
        spine = []
        for j in range(25):
            s = j / 24
            sx = cx + math.cos(ang) * L * s
            sy = cy + math.sin(ang) * L * s + droop * L * s * s
            spine.append((sx, sy))
        for j in range(1, 24):
            s = j / 24
            ax, ay = spine[j]
            bx, by = spine[j + 1]
            nx, ny = -(by - ay), (bx - ax)
            nl = math.hypot(nx, ny) or 1
            nx, ny = nx / nl, ny / nl
            wl = h * 0.06 * math.sin(math.pi * s) + 2
            for side in (-1, 1):
                d.polygon([(ax, ay), (bx, by),
                           (ax + side * nx * wl + (bx - ax) * 2.2, ay + side * ny * wl + (by - ay) * 2.2 + wl * 0.5)],
                          fill=col)
        d.line(spine, fill=col, width=max(2, int(h * 0.008)))


def ferris(d, cx, cy, r, col, lights):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=col, width=max(2, int(r * 0.04)))
    d.ellipse([cx - r * 0.93, cy - r * 0.93, cx + r * 0.93, cy + r * 0.93], outline=col, width=max(1, int(r * 0.02)))
    for k in range(16):
        a = k * math.pi / 8
        d.line([(cx, cy), (cx + r * math.cos(a), cy + r * math.sin(a))], fill=col, width=max(1, int(r * 0.015)))
    for k in range(32):
        a = k * math.pi / 16
        lx, ly = cx + r * math.cos(a), cy + r * math.sin(a)
        c = lights[k % len(lights)]
        d.ellipse([lx - 3, ly - 3, lx + 3, ly + 3], fill=c)
    d.polygon([(cx, cy), (cx - r * 0.55, cy + r * 1.15), (cx - r * 0.45, cy + r * 1.15)], fill=col)
    d.polygon([(cx, cy), (cx + r * 0.55, cy + r * 1.15), (cx + r * 0.45, cy + r * 1.15)], fill=col)


def glitter_layers(W, H, hy, oy, sunx, seed, n=6):
    out = []
    for v in range(n):
        rnd = random.Random(seed * 100 + v)
        L = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(L)
        for _ in range(2600):
            f = rnd.random() ** 1.4
            y = hy + 3 + f * (oy - hy - 6)
            spread = 30 + (y - hy) * 0.75
            x = rnd.gauss(sunx, spread)
            near = math.exp(-((x - sunx) / spread) ** 2)
            ln = rnd.uniform(4, 26) * (0.5 + f)
            b = int(255 * near * rnd.uniform(0.35, 1.0))
            d.line([(x - ln / 2, y), (x + ln / 2, y)], fill=b, width=1 if f < 0.4 else 2)
        out.append(L.filter(ImageFilter.GaussianBlur(0.8)))
    return out


def railing(d, W, top, bottom, col, hi):
    d.rectangle([0, top, W, top + 16], fill=col)
    d.line([(0, top), (W, top)], fill=hi, width=3)
    d.rectangle([0, bottom - 10, W, bottom], fill=col)
    for x in range(0, W + 40, 36):
        d.rectangle([x, top + 16, x + 7, bottom - 10], fill=col)
    for x in range(-20, W + 340, 340):
        d.rectangle([x, top - 18, x + 22, bottom + 40], fill=col)
        d.line([(x, top - 18), (x + 22, top - 18)], fill=hi, width=3)


def plate_promenade(pal, seed=1):
    """Plate A: beach promenade facing the ocean. 1500x3000, horizon 1700."""
    W, H, hy, oy = 1500, 3000, 1700, 2250
    sun = (900, 1662, 92)
    img = sky_ocean(W, H, hy, sun, pal, oy)
    clouds(img, W, hy, pal, seed)
    # beach + walkway
    sand = grad([(0, (214, 140, 96)), (1, (150, 88, 70))], 180)
    img[oy:oy + 180] = sand[:, None, :] * (0.85 if pal is VICE else 1.0)
    walk = grad([(0, (128, 84, 74)), (1, (52, 36, 40))], H - (oy + 180))
    img[oy + 180:] = walk[:, None, :]
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(im)
    haze = (92, 46, 70, 255) if pal is ORANGE else (70, 36, 96, 255)
    # pier + Ferris wheel far left on the horizon
    d.rectangle([0, hy - 22, 470, hy - 8], fill=haze)
    for x in range(0, 470, 26):
        d.rectangle([x, hy - 8, x + 5, hy + 6], fill=haze)
    ferris(d, 250, hy - 170, 140, haze, [(255, 210, 120, 255), (255, 120, 170, 255), (140, 220, 255, 255)])
    rnd = random.Random(seed)
    for x in (560, 640, 1180, 1260, 1330):
        palm(d, x, oy + 10, rnd.uniform(240, 330), rnd.uniform(-40, 40), (70, 34, 52, 255), rnd)
    col = (18, 12, 18, 255)
    palm(d, 1380, H, 1650, -140, col, rnd)
    palm(d, 110, H, 1420, 120, col, rnd)
    railing(d, W, oy + 190, oy + 420, (22, 16, 22, 255), (255, 170, 90, 255))
    return im.convert("RGB"), glitter_layers(W, H, hy, oy, sun[0], seed), sun


def plate_road(pal, seed=2):
    """Plate B: palm-lined coastal road receding to the sun. 1500x3000, horizon 1500."""
    W, H, hy = 1500, 3000, 1500
    vx = 760
    sun = (vx, 1468, 80)
    img = sky_ocean(W, H, hy, sun, pal, 1720)
    clouds(img, W, hy, pal, seed)
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(im)
    # ground right side (land) and left verge
    d.polygon([(vx + 10, hy), (W, hy + 40), (W, H), (vx, H)], fill=(70, 46, 50, 255))
    d.polygon([(vx - 10, hy), (0, hy + 230), (0, H), (vx, H)], fill=(96, 64, 62, 255))
    # road surface with gradient, done in numpy
    a = np.asarray(im.convert("RGB"), np.float32).copy()
    yy, xx = np.mgrid[0:H, 0:W]
    depth = np.clip((yy - hy) / (H - hy), 0, 1)
    half = 18 + depth * 1300
    road = (np.abs(xx - vx) < half) & (yy > hy)
    base = np.stack([62 + 40 * (1 - depth), 46 + 22 * (1 - depth), 52 + 12 * (1 - depth)], -1)
    glare = np.exp(-((xx - vx) / (40 + depth * 420)) ** 2) * (1 - depth) ** 1.3
    base = base + glare[..., None] * np.array([210, 120, 60])
    a[road] = base[road]
    # sidewalk strips
    side = (np.abs(xx - vx) >= half) & (np.abs(xx - vx) < half * 1.18) & (yy > hy)
    a[side] = np.stack([150 - 60 * depth, 100 - 40 * depth, 88 - 34 * depth], -1)[side]
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(im)
    # centre double-yellow and dashed edge lines
    for off in (-5, 5):
        pts = [(vx + off * (0.05 + f * 1.2), hy + f * (H - hy)) for f in np.linspace(0, 1, 60)]
        for p, q in zip(pts, pts[1:]):
            w = max(1, int(1 + (p[1] - hy) / (H - hy) * 14))
            d.line([p, q], fill=(235, 180, 60, 255), width=w)
    for side_ in (-1, 1):
        k = 0.0
        while k < 1:
            f0, f1 = k, k + 0.012 + k * 0.05
            y0, y1 = hy + f0 ** 1.9 * (H - hy), hy + min(1, f1) ** 1.9 * (H - hy)
            x0 = vx + side_ * (18 + (y0 - hy) / (H - hy) * 1300) * 0.55
            x1 = vx + side_ * (18 + (y1 - hy) / (H - hy) * 1300) * 0.55
            w = max(1, int(1 + (y0 - hy) / (H - hy) * 12))
            d.line([(x0, y0), (x1, y1)], fill=(240, 220, 200, 230), width=w)
            k = f1 + 0.01 + k * 0.05
    # railing on the left (ocean side) in perspective
    rail_col = (24, 16, 24, 255)
    for f in np.linspace(0.0, 1, 60):
        y = hy + f ** 2 * (H - hy)
        x = vx - (18 + (y - hy) / (H - hy) * 1300) * 1.2
        hgt = 6 + f ** 2 * 260
        d.line([(x, y), (x, y - hgt)], fill=rail_col, width=max(1, int(1 + f * 6)))
    top = [(vx - (18 + (hy + f ** 2 * (H - hy) - hy) / (H - hy) * 1300) * 1.2, hy + f ** 2 * (H - hy) - (6 + f ** 2 * 260)) for f in np.linspace(0, 1, 60)]
    d.line(top, fill=rail_col, width=8)
    # palms receding on both sides
    rnd = random.Random(seed)
    for i in range(14, 0, -1):
        f = (i / 14) ** 2.2
        y = hy + f * (H - hy)
        s = 0.06 + f
        for side_ in (-1, 1):
            x = vx + side_ * (18 + f * 1300) * (1.42 if side_ > 0 else 1.32)
            haze = int(120 * (1 - f))
            col = (18 + haze // 2, 12 + haze // 4, 20 + haze // 3, 255)
            palm(d, x, y, 1300 * s, side_ * rnd.uniform(20, 60) * s, col, rnd)
    rnd2 = random.Random(seed + 5)
    for x in range(vx + 60, W, 70):   # low buildings far right
        hh = rnd2.uniform(20, 70)
        d.rectangle([x, hy + 8 - hh, x + 60, hy + 14], fill=(90, 50, 70, 255))
    return im.convert("RGB"), glitter_layers(W, H, hy, 1720, sun[0], seed), sun


def plate_roadside(pal, seed=3):
    """Plate C: side view across the coastal road to the ocean. 1500x2800, horizon 1350."""
    W, H, hy, oy = 1500, 2800, 1350, 1700
    sun = (1040, 1312, 84)
    img = sky_ocean(W, H, hy, sun, pal, oy)
    clouds(img, W, hy, pal, seed)
    img[oy:oy + 110] = grad([(0, (206, 132, 96)), (1, (160, 96, 76))], 110)[:, None, :]
    img[oy + 110:2000] = grad([(0, (110, 74, 70)), (1, (80, 56, 58))], 2000 - oy - 110)[:, None, :]
    # road band with the sun reflected
    road = grad([(0, (66, 50, 58)), (1, (40, 30, 38))], 400)
    img[2000:2400] = road[:, None, :]
    xx = np.arange(W)
    g = np.exp(-((xx - sun[0]) / 300.0) ** 2)
    img[2000:2400] += (g[None, :, None] * np.array([120, 66, 34])[None, None]) * np.linspace(1, 0.3, 400)[:, None, None]
    img[2400:] = grad([(0, (150, 104, 92)), (1, (70, 48, 50))], H - 2400)[:, None, :]
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")
    d = ImageDraw.Draw(im)
    haze = (92, 46, 70, 255) if pal is ORANGE else (70, 36, 96, 255)
    d.rectangle([980, hy - 20, W, hy - 6], fill=haze)
    ferris(d, 1300, hy - 160, 135, haze, [(255, 210, 120, 255), (255, 120, 170, 255), (140, 220, 255, 255)])
    rnd = random.Random(seed)
    for x in (120, 420, 760):
        palm(d, x, 1870, rnd.uniform(620, 760), rnd.uniform(-60, 60), (24, 14, 24, 255), rnd)
    railing(d, W, 1800, 1990, (22, 16, 22, 255), (255, 170, 90, 255))
    d.rectangle([0, 1996, W, 2008], fill=(170, 130, 120, 255))
    for x in range(0, W, 120):
        d.rectangle([x, 2196, x + 70, 2206], fill=(236, 178, 60, 255))
    d.rectangle([0, 2396, W, 2412], fill=(190, 150, 136, 255))
    return im.convert("RGB"), glitter_layers(W, H, hy, oy, sun[0], seed), sun


if __name__ == "__main__":
    import os
    os.makedirs("plates", exist_ok=True)
    for name, fn in (("A", plate_promenade), ("B", plate_road), ("C", plate_roadside)):
        for pn, pal in (("o", ORANGE), ("v", VICE)):
            if pn == "v" and name != "C":
                continue
            im, gl, sun = fn(pal)
            im.save(f"plates/{name}{pn}.png")
            for i, g in enumerate(gl):
                g.save(f"plates/{name}{pn}_g{i}.png")
            print(name, pn, im.size, sun, flush=True)
