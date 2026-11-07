// cam3d.js: a tiny painter's-algorithm 3-D for flat-shaded painted sets (streets, forum, atrium,
// aerial city). World: x right, y up, z forward (metres). Polygons are clipped at the near plane.
import { css, mixc, clamp } from './util.js';

export class Cam {
  constructor(W, H, { pos = [0, 1.6, 0], yaw = 0, pitch = 0, roll = 0, fov = 55, near = 0.15 } = {}) {
    this.W = W; this.H = H; this.set({ pos, yaw, pitch, roll, fov }); this.near = near;
  }
  set({ pos, yaw, pitch, roll = 0, fov }) {
    if (pos) this.pos = pos; if (yaw !== undefined) this.yaw = yaw; if (pitch !== undefined) this.pitch = pitch;
    this.roll = roll; if (fov) this.fov = fov;
    this.f = (this.H / 2) / Math.tan((this.fov * Math.PI) / 360);
    this.cy = Math.cos(this.yaw); this.sy = Math.sin(this.yaw); this.cp = Math.cos(this.pitch); this.sp = Math.sin(this.pitch);
    this.cr = Math.cos(this.roll); this.sr = Math.sin(this.roll);
    return this;
  }
  // world -> camera space
  view(p) {
    const x = p[0] - this.pos[0], y = p[1] - this.pos[1], z = p[2] - this.pos[2];
    const x1 = x * this.cy - z * this.sy, z1 = x * this.sy + z * this.cy;     // yaw (positive = turn right)
    const y2 = y * this.cp - z1 * this.sp, z2 = y * this.sp + z1 * this.cp;    // pitch (positive = look up)
    return [x1 * this.cr + y2 * this.sr, y2 * this.cr - x1 * this.sr, z2];
  }
  toScreen(v) { return [this.W / 2 + (this.f * v[0]) / v[2], this.H / 2 - (this.f * v[1]) / v[2], v[2]]; }
  proj(p) { const v = this.view(p); return v[2] <= this.near ? null : this.toScreen(v); }
  // pixels per metre at a world point (for sprites)
  scaleAt(p) { const v = this.view(p); return v[2] <= this.near ? 0 : this.f / v[2]; }
  depth(p) { return this.view(p)[2]; }
}

function clipNear(vs, n) {
  const out = [];
  for (let i = 0; i < vs.length; i++) {
    const a = vs[i], b = vs[(i + 1) % vs.length];
    const ai = a[2] > n, bi = b[2] > n;
    if (ai) out.push(a);
    if (ai !== bi) { const t = (n - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, n]); }
  }
  return out;
}

// Trace a world polygon as a path; returns mean depth or -1 when fully clipped.
export function path(ctx, cam, pts) {
  let vs = pts.map((p) => cam.view(p));
  if (vs.every((v) => v[2] <= cam.near)) return -1;
  if (vs.some((v) => v[2] <= cam.near)) vs = clipNear(vs, cam.near);
  if (vs.length < 3) return -1;
  ctx.beginPath(); let d = 0;
  vs.forEach((v, i) => { const s = cam.toScreen(v); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); d += v[2]; });
  ctx.closePath(); return d / vs.length;
}
// Fill a polygon with an [r,g,b] colour fogged by its depth.
export function poly(ctx, cam, pts, rgb, lk, a = 1, fogDist = 140, tex = null) {
  const d = path(ctx, cam, pts); if (d < 0) return d;
  ctx.fillStyle = css(fog(rgb, d, lk, fogDist), a); ctx.fill();
  if (tex && TEX.fill) {
    const o = cam.proj(pts[0]); const k = o ? Math.max(0.15, Math.min(4, cam.f / Math.max(1, o[2]) * tex[1])) : 1;
    TEX.fill(ctx, tex[0], o ? o[0] : 0, o ? o[1] : 0, k, tex[2] ?? 0.4 * (1 - Math.min(1, d / fogDist)));
  }
  return d;
}
export const TEX = { fill: null };
export function fog(rgb, d, lk, fogDist = 140) {
  const k = clamp(1 - Math.exp(-(d / fogDist) * (lk.fogK * 2.2)));
  return mixc(rgb, lk.fog, k);
}
// Line segment in world space.
export function seg(ctx, cam, a, b) {
  let va = cam.view(a), vb = cam.view(b), n = cam.near;
  if (va[2] <= n && vb[2] <= n) return false;
  if (va[2] <= n) { const t = (n - va[2]) / (vb[2] - va[2]); va = [va[0] + (vb[0] - va[0]) * t, va[1] + (vb[1] - va[1]) * t, n]; }
  if (vb[2] <= n) { const t = (n - vb[2]) / (va[2] - vb[2]); vb = [vb[0] + (va[0] - vb[0]) * t, vb[1] + (va[1] - vb[1]) * t, n]; }
  const sa = cam.toScreen(va), sb = cam.toScreen(vb);
  ctx.moveTo(sa[0], sa[1]); ctx.lineTo(sb[0], sb[1]); return true;
}
// Axis-aligned wall rectangle helpers: on the plane x = X (facing ±x) or z = Z (facing ±z).
export const wallX = (X, z0, z1, y0, y1) => [[X, y0, z0], [X, y0, z1], [X, y1, z1], [X, y1, z0]];
export const wallZ = (Z, x0, x1, y0, y1) => [[x0, y0, Z], [x1, y0, Z], [x1, y1, Z], [x0, y1, Z]];
export const floorY = (Y, x0, x1, z0, z1) => [[x0, Y, z0], [x1, Y, z0], [x1, Y, z1], [x0, Y, z1]];

// Lambert-ish shade of a base colour by a face normal against the sun direction.
export function lit(base, n, sun, lk, amb = 0.42) {
  const d = Math.max(0, n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2]);
  const k = (amb + (1 - amb) * d) * lk.light;
  const warm = mixc(base, mixc(base, lk.sun, 0.35), d);
  const cool = mixc(warm, lk.amb, (1 - d) * 0.35);
  return [cool[0] * k, cool[1] * k, cool[2] * k];
}
