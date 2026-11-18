import sys
from rembg import remove, new_session
from PIL import Image
sess = new_session(sys.argv[1] if len(sys.argv)>1 else "isnet-general-use")
jobs = {
 "me": ("src/me.jpg", None),
 "michael": ("src/michael.webp", None),
 "trevor": ("src/trevor.webp", None),
 "franklin": ("src/franklin.webp", None),
 "jason": ("src/jason.png", (120, 0, 680, 470)),
 "lucia": ("src/lucia.jpg", None),
 "redcar": ("src/redcar.jpg", None),
 "blackcar": ("src/blackcar.jpg", None),
}
for k,(p,crop) in jobs.items():
    im = Image.open(p).convert("RGB")
    if crop: im = im.crop(crop)
    out = remove(im, session=sess)
    out.save(f"cut/{k}.png"); print(k, out.size, flush=True)
