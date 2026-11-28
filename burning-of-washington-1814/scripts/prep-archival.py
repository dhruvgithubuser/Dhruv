"""Vox-style collage prep: crop the public-domain archival images, press them into a printed
(slightly halftoned, ink-on-paper) look, and give each a torn white-paper border with alpha.

    python3 scripts/prep-archival.py
Writes public/assets/archival/*.png and public/assets/backgrounds/paper_vox.jpg
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
RAW, OUT = ROOT / 'archival_raw', ROOT / 'public' / 'assets' / 'archival'
rng = np.random.default_rng(1814)

# name: (source file, crop box as fractions l,t,r,b, target width, mode) ; mode 'duo' = ink duotone, 'col' = muted colour
JOBS = {
    'burning': ("Burning_of_Washington_1814.jpg", (0, 0, 1, 1), 1000, 'duo'),
    'cockburn': ("Rear-Admiral_George_Cockburn_(1772-1853),_by_John_James_Hall.jpg", (0, 0.02, 1, 0.80), 760, 'col'),
    'ross': ("Major-General_Robert_Ross_(cropped).jpg", (0.08, 0.02, 0.92, 0.62), 700, 'col'),
    'madison': ("James_Madison.jpg", (0.12, 0.05, 0.88, 0.75), 700, 'col'),
    'whitehouse': ("The_President's_House_by_George_Munger,_1814-1815_-_Crop.jpg", (0.2, 0.08, 0.98, 0.7), 1000, 'col'),
    'mchenry': ("Ft._Henry_bombardement_1814.jpg", (0.0, 0.0, 1.0, 0.86), 1000, 'col'),
    'patent': ("Blodget's_Hotel,_built_1793.jpg", (0, 0, 1, 1), 900, 'duo'),
}
INK, PAPER = np.array([34, 30, 28]), np.array([244, 240, 230])


def halftone_grain(img):
    a = np.asarray(img).astype(np.float32)
    a += rng.normal(0, 5, a.shape[:2])[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def press(im, mode):
    if mode == 'duo':
        g = ImageOps.autocontrast(im.convert('L'), cutoff=1)
        t = (np.asarray(g).astype(np.float32) / 255)[..., None]
        out = Image.fromarray((INK * (1 - t) + PAPER * t).astype(np.uint8))
    else:
        im = ImageOps.autocontrast(im.convert('RGB'), cutoff=0.5)
        im = ImageEnhance.Color(im).enhance(0.72)
        a = np.asarray(im).astype(np.float32)
        warm = a * np.array([1.0, 0.97, 0.9]) + np.array([6, 4, 0])
        out = Image.fromarray(np.clip(warm, 0, 255).astype(np.uint8))
    return halftone_grain(out.filter(ImageFilter.UnsharpMask(2, 60, 2)))


def torn_mask(w, h, inset, rough):
    """Alpha for a sheet with a torn edge: a jittered rectangle, slightly blurred."""
    m = np.zeros((h, w), np.float32)
    yy, xx = np.mgrid[0:h, 0:w]
    def edge(n, s):
        v = np.cumsum(rng.normal(0, 1, n)); v = (v - np.linspace(v[0], v[-1], n)); v = v / (np.abs(v).max() + 1e-6)
        return inset + rough * (0.5 + 0.5 * v) + rng.uniform(0, rough * 0.35, n)
    top, bot, lef, rig = edge(w, 1), edge(w, 2), edge(h, 3), edge(h, 4)
    m[(yy > top[xx]) & (yy < h - bot[xx]) & (xx > lef[yy]) & (xx < w - rig[yy])] = 1
    return Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))


for name, (src, (l, t, r, b), tw, mode) in JOBS.items():
    im = Image.open(RAW / src).convert('RGB')
    W, H = im.size
    im = im.crop((int(l * W), int(t * H), int(r * W), int(b * H)))
    im = im.resize((tw, int(im.height * tw / im.width)), Image.LANCZOS)
    im = press(im, mode)
    pad = 26
    w, h = im.width + 2 * pad, im.height + 2 * pad
    sheet = Image.new('RGB', (w, h), tuple(PAPER))
    sheet.paste(im, (pad, pad))
    sheet.putalpha(torn_mask(w, h, 2, 9))
    sheet.save(OUT / f'{name}.png', optimize=True)
    print(name, sheet.size)

# off-white Vox paper: warm grey, fibres, faint blotches
H, W = 1920, 1080
base = np.ones((H, W, 3), np.float32) * np.array([236, 231, 220])
low = np.asarray(Image.fromarray((rng.random((48, 27)) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)).astype(np.float32) / 255
base += (low[..., None] - 0.5) * 10
fib = np.asarray(Image.fromarray((rng.random((H, W)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
base += (fib[..., None] - 0.5) * 14
Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).save(ROOT / 'public/assets/backgrounds/paper_vox.jpg', quality=92)
print('paper ok')
