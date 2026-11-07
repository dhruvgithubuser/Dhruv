// fx.js: atmosphere. Every particle's position is a closed-form function of t (seeded), so frames
// rendered out of order agree.
import { h01, hrange, css, hex, mixc, clamp, smooth, vnoise, fbm } from './util.js';
import { puff, ART } from './paint.js';

const TAU = Math.PI * 2;

// Falling ash / pumice in screen space. density 0..1, size scale, wind px/s, t seconds.
// kind 'ash' (fine streaks), 'pumice' (stones that tumble), 'dust' (motes in light)
export function fall(ctx, W, H, t, { density = 1, kind = 'ash', wind = 30, seed = 1, depth = 1, color = null, groundY = null } = {}) {
  const n = Math.round((kind === 'ash' ? 900 : kind === 'pumice' ? 260 : 140) * density);
  for (let i = 0; i < n; i++) {
    const z = 0.25 + h01(i, seed) * 0.75 * depth;          // nearer particles are bigger + faster
    const sp = kind === 'dust' ? 12 + 20 * z : kind === 'ash' ? 60 + 140 * z : 180 + 420 * z;
    const life = (H + 200) / sp;
    const ph = (t / life + h01(i, seed + 1)) % 1;
    let y = -100 + ph * (H + 200);
    let x = ((h01(i, seed + 2) * (W + 400) + (wind * z) * t + (kind === 'dust' ? 30 * Math.sin(t * 0.3 + i) : 0)) % (W + 400) + (W + 400)) % (W + 400) - 200;
    if (groundY !== null) { const gy = groundY(x, z); if (y > gy) continue; }
    if (kind === 'ash') {
      const len = 3 + 9 * z, a = (0.25 + 0.5 * z) * density;
      ctx.strokeStyle = color || css([160 + 40 * z, 150 + 35 * z, 140 + 30 * z], Math.min(0.9, a)); ctx.lineWidth = 0.8 + 1.6 * z;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - wind * z * 0.03, y - len); ctx.stroke();
    } else if (kind === 'pumice') {
      const r = 1.5 + 6 * z * z;
      ctx.fillStyle = css(mixc(hex('#d8cdb8'), hex('#8c8274'), h01(i, seed + 3)), 0.95);
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 4 * (h01(i, seed + 4) - 0.5) * 4);
      ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.75, 0, 0, TAU); ctx.fill(); ctx.restore();
      if (z > 0.7) { ctx.strokeStyle = css([210, 200, 185], 0.25); ctx.lineWidth = r * 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - wind * 0.02, y - r * 4); ctx.stroke(); }
    } else {
      ctx.fillStyle = color || css([255, 236, 200], 0.18 + 0.3 * z * Math.abs(Math.sin(t * 0.7 + i)));
      ctx.beginPath(); ctx.arc(x, y, 0.8 + 1.8 * z, 0, TAU); ctx.fill();
    }
  }
}

// Little bounces where pumice hits the ground plane (screen-space band y0..y1).
export function bounces(ctx, W, t, y0, y1, density = 1, seed = 9) {
  const n = Math.round(120 * density);
  for (let i = 0; i < n; i++) {
    const per = 0.6 + h01(i, seed) * 0.9, ph = ((t + h01(i, seed + 1) * per) % per) / per;
    const x = h01(i, seed + 2) * W, gy = y0 + (y1 - y0) * h01(i, seed + 3), z = (gy - y0) / (y1 - y0 + 1);
    const hgt = (1 - ph) * ph * 4 * (6 + 22 * z);
    ctx.fillStyle = css([200, 190, 175], 0.85 * (1 - ph));
    ctx.beginPath(); ctx.ellipse(x + ph * 12 * (h01(i, seed + 4) - 0.5), gy - hgt, 1.5 + 3 * z, 1.2 + 2.2 * z, 0, 0, TAU); ctx.fill();
  }
}

// Haze veil (aerial perspective / ash fog): vertical gradient band.
export function veil(ctx, W, H, rgb, a0, a1, y0 = 0, y1 = H) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, css(rgb, a0)); g.addColorStop(1, css(rgb, a1));
  ctx.fillStyle = g; ctx.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0));
}

// God rays from (x, y) downward.
export function rays(ctx, x, y, len, spread, a, col = [255, 230, 180], n = 7, t = 0) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const ang = Math.PI / 2 + (i / (n - 1) - 0.5) * spread + 0.02 * Math.sin(t * 0.4 + i);
    const w = 30 + 60 * h01(i, 3);
    const g = ctx.createLinearGradient(x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    g.addColorStop(0, css(col, a * (0.5 + 0.5 * h01(i, 5)))); g.addColorStop(1, css(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w * 0.2, y); ctx.lineTo(x + w * 0.2, y);
    ctx.lineTo(x + Math.cos(ang) * len + w, y + Math.sin(ang) * len); ctx.lineTo(x + Math.cos(ang) * len - w, y + Math.sin(ang) * len); ctx.fill();
  }
  ctx.restore();
}

// Volcanic lightning: a jagged bolt that flickers for ~0.25 s at each strike time.
export function lightning(ctx, x0, y0, x1, y1, t, strikes, seed = 2) {
  for (const ts of strikes) {
    const k = t - ts; if (k < 0 || k > 0.32) continue;
    const a = (k < 0.06 ? 1 : k < 0.12 ? 0.3 : k < 0.18 ? 0.9 : 1 - (k - 0.18) / 0.14);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const [lw, al] of [[9, 0.12], [3.5, 0.45], [1.4, 1]]) {
      ctx.strokeStyle = css([215, 225, 255], al * a); ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0, y0);
      const n = 9; for (let i = 1; i <= n; i++) { const u = i / n; ctx.lineTo(x0 + (x1 - x0) * u + (i < n ? (h01(i, seed + ts * 7) - 0.5) * 60 : 0), y0 + (y1 - y0) * u); }
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- the eruption column
// A Plinian column from a vent at (vx, vy) in screen px. s = px per km (height scale).
// grow: 0..1 how far the column has risen; spread: 0..1 umbrella spreading; tone: 0 light .. 1 dark;
// collapse: 0..1 (column falls back + feeds ground currents). t drives the billowing.
export function column(ctx, vx, vy, s, t, { grow = 1, spread = 1, tone = 0.3, collapse = 0, wind = 0.35, glow = 0, seed = 4, H = 26 } = {}) {
  const top = H * s * grow;            // column height (H km, the brief's "towering")
  const kinds = tone < 0.33 ? ['light', 'grey'] : tone < 0.66 ? ['grey', 'dark'] : ['dark', 'dark'];
  // umbrella: wide, flat, drifting downwind
  if (spread > 0 && grow > 0.7) {
    const uY = vy - top * 0.92, uw = s * (6 + 22 * spread), n = 70;
    for (let i = 0; i < n; i++) {
      const u = h01(i, seed + 40) * 2 - 1, d = h01(i, seed + 41);
      const x = vx + u * uw + wind * s * 18 * spread * (0.5 + 0.5 * u) + 10 * Math.sin(t * 0.3 + i);
      const y = uY + (d - 0.5) * s * 2.6 + Math.abs(u) * s * 1.6;
      const r = s * (1.6 + 2.2 * h01(i, seed + 42)) * (0.6 + 0.4 * spread);
      puff(ctx, kinds[(u > 0.2) | 0], i, x, y, r, 0.65 * smooth(0.7, 0.95, grow) * spread, 0.0);
    }
  }
  // the convecting stem: puffs rising along the axis, bigger with height
  const n = 170;
  for (let i = 0; i < n; i++) {
    const per = 7 + 5 * h01(i, seed);
    const ph = ((t / per + h01(i, seed + 1)) % 1);
    const hgt = ph * top;
    if (hgt > top) continue;
    const w = s * (0.7 + 3.4 * Math.pow(ph, 0.8));
    const x = vx + (h01(i, seed + 2) - 0.5) * w * 1.3 + wind * hgt * 0.25 * ph + 6 * Math.sin(t * 0.8 + i);
    const y = vy - hgt + collapse * hgt * 0.5 * ph;
    const r = s * (0.85 + 2.5 * ph) * (0.8 + 0.4 * h01(i, seed + 3));
    const a = (0.55 + 0.35 * (1 - ph)) * Math.min(1, ph * 8);
    puff(ctx, kinds[(h01(i, seed + 5) < 0.4) | 0], i, x, y, r, a, ph * 2);
  }
  // incandescent base
  if (glow > 0) {
    const g = ctx.createRadialGradient(vx, vy, 0, vx, vy, s * 3);
    g.addColorStop(0, `rgba(255,170,90,${0.7 * glow})`); g.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(vx - s * 3, vy - s * 3, s * 6, s * 6); ctx.restore();
    for (let i = 0; i < 4; i++) puff(ctx, 'glow', i, vx + (h01(i, 7) - 0.5) * s, vy - s * 0.3 * i, s * (0.5 + 0.2 * i), 0.25 * glow);
  }
}

// A pyroclastic current: a ground-hugging billowing front advancing along a path of screen points.
// p: 0..1 progress of the front; thick: px height of the cloud; tone dark|grey|brown
export function current(ctx, pts, p, thick, t, { tone = 'grey', seed = 8, glow = 0.15 } = {}) {
  const L = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; }
  const at = (u) => { let d = u * tot; for (let i = 0; i < L.length; i++) { if (d <= L[i]) { const k = d / L[i]; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k]; } d -= L[i]; } return pts[pts.length - 1]; };
  const n = 150;
  for (let i = 0; i < n; i++) {
    const u = h01(i, seed) * p; const [x, y] = at(u);
    const front = 1 - (p - u) / Math.max(p, 1e-3);
    const r = thick * (0.35 + 0.75 * (1 - front * 0.4)) * (0.6 + 0.6 * h01(i, seed + 1));
    const lift = r * (0.3 + 0.9 * (1 - front)) + 6 * Math.sin(t * 1.2 + i);
    puff(ctx, h01(i, seed + 2) < 0.25 ? 'brown' : tone, i, x + (h01(i, seed + 3) - 0.5) * r, y - lift, r, 0.85, t * 0.2 + i);
  }
  if (glow > 0) for (let i = 0; i < 20; i++) {
    const u = p * (0.75 + 0.25 * h01(i, seed + 9)); const [x, y] = at(u);
    puff(ctx, 'glow', i, x, y - thick * 0.2, thick * 0.35, glow);
  }
}
