// aerial.js: Pompeii from the air, looking north-west to Vesuvius (AD 79: a single cone; modern: the
// Somma rim + Gran Cono). The walled town on its lava spur, insulae on a grid, the Forum, the
// amphitheatre at the east end, vineyards and the Sarno plain, the sea to the west.
// ARTISTIC RECONSTRUCTION (layout simplified; not a survey).
import { Cam, path, poly, fog, lit, wallX, wallZ, floorY } from '../lib/cam3d.js';
import { rng, hex, css, mixc, mulc, h01, clamp, lerp, smooth } from '../lib/util.js';
import { paintSky, puff, ART, drawVeiled } from '../lib/paint.js';
import { column, current, fall, veil, lightning } from '../lib/fx.js';

const ROT = 0.42; // town grid rotation (rad)
let B = null, FIELDS = null, TREES = null;
const rotp = (x, z) => [x * Math.cos(ROT) - z * Math.sin(ROT), x * Math.sin(ROT) + z * Math.cos(ROT)];
const inTown = (x, z) => (x / 640) ** 2 + (z / 330) ** 2 < 1;

function build() {
  if (B) return;
  B = []; const r = rng(17);
  // insulae on a grid (local coords before rotation)
  for (let ix = -8; ix <= 8; ix++) for (let iz = -5; iz <= 5; iz++) {
    const cx = ix * 78, cz = iz * 58;
    if (!inTown(cx, cz)) continue;
    if (Math.abs(cx + 90) < 60 && Math.abs(cz - 20) < 30) continue; // forum
    if (cx > 470) continue;                                             // amphitheatre zone
    const n = 3 + ((r() * 4) | 0);
    let x0 = cx - 34;
    for (let k = 0; k < n; k++) {
      const w = 68 / n, h = 6 + r() * 4, rich = r() < 0.3;
      for (const half of [-1, 1]) {
        const d = 24;
        B.push({ x0, x1: x0 + w - 1.5, z0: half < 0 ? cz - 26 : cz + 2, z1: half < 0 ? cz - 2 : cz + 26, h, rich: rich && half < 0, k: r(), garden: rich && r() < 0.6 });
        void d;
      }
      x0 += w;
    }
  }
  // public buildings: temple of Jupiter (forum north end), basilica, theatre block
  B.push({ x0: -104, x1: -76, z0: 46, z1: 78, h: 17, temple: true, k: 0.5 });
  B.push({ x0: -160, x1: -112, z0: -10, z1: 50, h: 12, k: 0.3 });
  FIELDS = []; const q = rng(23);
  for (let gx = -16; gx <= 16; gx++) for (let gz = -9; gz <= 30; gz++) {
    const x = gx * 290 + (q() - 0.5) * 60, z = gz * 290 + (q() - 0.5) * 60;
    if ((x / 700) ** 2 + (z / 380) ** 2 < 1.05) continue;
    if (x < -2600 + z * 0.12 + 150) continue; // sea
    if (x < -900 && z > 6500) continue;        // the mountain's foot
    FIELDS.push({ x, z, w: 290 + q() * 40, d: 290 + q() * 40, a: (q() - 0.5) * 0.06 + ROT, c: q(), vines: q() < 0.55 });
  }
  TREES = []; for (let i = 0; i < 520; i++) { const x = (q() - 0.5) * 7000, z = -1500 + q() * 6500; if ((x / 700) ** 2 + (z / 380) ** 2 < 1.15 || x < -2600 + z * 0.12) continue; TREES.push({ x, z, k: q() }); }
}

// st: { cam:{pos,yaw,pitch,fov}, lk, bury 0..1 (deposits cover the town), ruin 0..1 (roofless, excavated),
//       green 0..1 (vegetation over the buried plain), mountain 'v79'|'modern', erupt:{grow,spread,tone,glow,collapse},
//       pdc:{p, thick} (current down the flank toward the town), smoke, night, lightning:[t..], ashFall, labels }
export function drawAerial(ctx, W, H, t, st) {
  build();
  const lk = st.lk, cam = new Cam(W, H, { near: 5, ...st.cam });
  const sun = [-0.45, 0.75, -0.35]; const sl = Math.hypot(...sun); sun.forEach((v, i) => (sun[i] = v / sl));
  const hz = cam.proj([cam.pos[0], 0, cam.pos[2] + 60000]);
  const horizon = hz ? hz[1] : H * 0.35;
  paintSky(ctx, W, H, lk, horizon + 10, t, st.night ? 0.15 : 1);
  // sea (west/left) and land
  const fogD = 9000;
  const P = (pts, col, a = 1) => poly(ctx, cam, pts, col, lk, a, fogD);
  poly(ctx, cam, [[-60000, 0, -3000], [60000, 0, -3000], [60000, 0, 60000], [-60000, 0, 60000]], mixc(hex('#5f86a0'), lk.sky[1], 0.35), lk, 1, 1e9);
  // distant Apennine hills (right) + Lattari (left far)
  const far = cam.proj([0, 0, 40000]);
  if (far) {
    const hh = H * 0.13;
    drawVeiled(ctx, ART.hills, W * 0.35, far[1] - hh, W * 1.2, hh * 1.05, lk.fog, 0.55);
  }
  // land mass: coast running roughly N-S to the west of the town
  const land = mulc(mixc(hex(st.bury > 0.6 && st.green < 0.5 ? '#9b948a' : '#7d8051'), hex('#b8a77c'), 0.25), lk.light);
  const coast = []; for (let i = 0; i <= 30; i++) { const z = -3000 + i * 1500; coast.push([-2600 + z * 0.12 + 300 * Math.sin(i * 0.9), 0, z]); }
  poly(ctx, cam, [...coast, [40000, 0, 45000 - 3000 + 1500], [40000, 0, -3000]], mixc(mixc(land, hex('#8f8a7a'), st.bury || 0), hex('#6f7a43'), st.green ?? 0), lk, 1, 1e9);
  veil(ctx, W, H, lk.fog, 0.7, 0.0, horizon, horizon + H * 0.22);
  // fields + vineyards
  for (const f of FIELDS) {
    const c = mixc(mixc(mixc(hex('#5f6d3a'), hex('#9a9358'), f.c), hex('#7b6a45'), f.c > 0.85 ? 0.6 : 0), hex('#8f8a80'), (st.bury || 0) * (1 - (st.green ?? 0)));
    const ca = Math.cos(f.a), sa = Math.sin(f.a), pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [f.x + (u * f.w * ca - v * f.d * sa) / 2, 0, f.z + (u * f.w * sa + v * f.d * ca) / 2]);
    const d = P(pts, mulc(c, lk.light * (0.9 + 0.2 * f.c)), 1);
    if (f.vines && d > 0 && d < 3500 && !(st.bury > 0.5 && (st.green ?? 0) < 0.6)) {
      ctx.strokeStyle = css(fog(mulc(hex('#3f4a2a'), lk.light), d, lk, fogD), 0.45); ctx.lineWidth = 1; ctx.beginPath();
      for (let k = -4; k <= 4; k++) { const a = [f.x + (-f.w * ca - k * f.d / 10 * sa) / 2, 0, f.z + (-f.w * sa + k * f.d / 10 * ca) / 2], b = [f.x + (f.w * ca - k * f.d / 10 * sa) / 2, 0, f.z + (f.w * sa + k * f.d / 10 * ca) / 2]; const pa = cam.proj(a), pb = cam.proj(b); if (pa && pb) { ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); } }
      ctx.stroke();
    }
  }
  // the Sarno river (south of the town, to the sea)
  ctx.strokeStyle = css(mixc(hex('#6f93a6'), lk.sky[1], 0.4), 0.9); ctx.lineCap = 'round';
  ctx.beginPath(); let first = true;
  for (let i = 0; i <= 40; i++) { const x = 4000 - i * 160, z = -700 + 160 * Math.sin(i * 0.35) - i * 6; const p = cam.proj([x, 0, z]); if (!p) continue; ctx.lineWidth = Math.max(1, cam.scaleAt([x, 0, z]) * 14); first ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); first = false; }
  ctx.stroke();
  // Vesuvius
  const mk = st.mountain === 'modern' ? ART.modern : ART.v79;
  const mb = cam.proj([-1500, 0, 9500]), mtop = cam.proj([-1500, 1900, 9500]);
  let vent = null;
  if (mb && mtop) {
    const mh = (mb[1] - mtop[1]) * 1.06, mw = mh * 5.2;
    const veilC = st.bury > 0.3 ? mixc(lk.fog, hex('#8a847c'), 0.5 * st.bury * (1 - (st.green ?? 0))) : lk.fog;
    drawVeiled(ctx, mk, mb[0] - mw / 2, mb[1] - mh, mw, mh, veilC, 0.16 + lk.fogK * 0.22 + 0.3 * (st.bury || 0) * (1 - (st.green ?? 0)));
    if (st.mountainMix > 0) { ctx.save(); ctx.globalAlpha = clamp(st.mountainMix); drawVeiled(ctx, ART.modern, mb[0] - mw / 2, mb[1] - mh, mw, mh, lk.fog, 0.2 + lk.fogK * 0.2); ctx.restore(); }
    vent = [mb[0] + mw * (mk.peak[0] - 0.5), mb[1] - mh * (1 - mk.peak[1])];
    st._vent = vent; st._mpx = mh / 1.9; // px per km at the mountain
    if (st.smoke) for (let i = 0; i < 14; i++) puff(ctx, 'grey', i, vent[0] + (h01(i, 3) - 0.3) * mh * 0.3 + t * 3, vent[1] - mh * 0.08 * i * 0.6, mh * (0.05 + 0.02 * i), 0.35 * st.smoke);
  }
  // haze band over the plain
  veil(ctx, W, H, lk.fog, 0.0, 0.0, horizon, horizon + H * 0.3);
  // ---- the town
  const town = [];
  const tg = (x, z) => rotp(x, z);
  for (const b of B) {
    const [cx, cz] = tg((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
    town.push({ b, d: Math.hypot(cx - cam.pos[0], cz - cam.pos[2]) });
  }
  town.sort((a, b) => b.d - a.d);
  // town ground + walls
  const tp = []; for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; tp.push([...[0, 0]]); const [x, z] = rotp(Math.cos(a) * 660, Math.sin(a) * 345); tp[i] = [x, 0.5, z]; }
  const bury = st.bury || 0, ruin = st.ruin || 0;
  const tcol = mixc(mixc(hex('#b6a385'), hex('#a19a8f'), clamp(bury * 1.5)), hex('#6f7a43'), (st.green ?? 0) * (ruin ? 0 : 1));
  P(tp, mulc(tcol, lk.light), bury > 0.9 && !ruin ? 1 - (st.green ?? 0) * 0.85 : 1);
  for (const { b } of town) {
    const q = (x, z) => { const [a, c] = tg(x, z); return [a, c]; };
    const h = b.h * (1 - bury * 0.85);
    if ((h < 0.3 || bury > 0.9) && !ruin) continue;
    const corners = [q(b.x0, b.z0), q(b.x1, b.z0), q(b.x1, b.z1), q(b.x0, b.z1)];
    const wallc = mixc(hex(b.temple ? '#e3d8c2' : '#dccaa6'), hex('#a8a196'), bury);
    const roofc = mixc(mixc(hex('#c0643f'), hex('#9c4c34'), b.k), hex('#a09a90'), Math.max(bury, ruin * 0.6));
    const hh = ruin ? 2 + 3 * b.k : h;
    // walls: the two faces toward the camera (south + east sides after rotation; draw all 4, painter order handles)
    for (let i = 0; i < 4; i++) {
      const a = corners[i], c = corners[(i + 1) % 4];
      const nx = c[1] - a[1], nz = -(c[0] - a[0]); const nl = Math.hypot(nx, nz);
      const n = [nx / nl, 0, nz / nl];
      const toCam = [cam.pos[0] - a[0], 0, cam.pos[2] - a[1]];
      if (n[0] * toCam[0] + n[2] * toCam[2] < 0) continue;
      P([[a[0], 0, a[1]], [c[0], 0, c[1]], [c[0], hh, c[1]], [a[0], hh, a[1]]], lit(wallc, n, sun, lk));
    }
    if (!ruin) {
      const top = corners.map(([x, z]) => [x, hh, z]);
      if (b.temple) {
        P(top, lit(roofc, [0, 1, 0], sun, lk));
      } else {
        // hipped roof: four slopes to a ridge
        const [cx, cz] = q((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
        const rH = hh + 2.6;
        for (let i = 0; i < 4; i++) { const a = corners[i], c = corners[(i + 1) % 4]; const mid = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2]; const n = [mid[0] - cx, 1.2, mid[1] - cz]; const nl = Math.hypot(...n); P([[a[0], hh, a[1]], [c[0], hh, c[1]], [cx, rH, cz]], lit(roofc, n.map((v) => v / nl), sun, lk)); }
        if (b.rich) { const [ax, az] = q((b.x0 + b.x1) / 2, b.z0 + (b.z1 - b.z0) * 0.35); const s2 = 2.5; P([[ax - s2, rH - 0.4, az - s2], [ax + s2, rH - 0.4, az - s2], [ax + s2, rH - 0.4, az + s2], [ax - s2, rH - 0.4, az + s2]], mulc(hex('#2a201a'), lk.light)); }
      }
    } else {
      // excavated: roofless rooms (dark interiors + wall tops)
      const top = corners.map(([x, z]) => [x, hh, z]); P(top, mulc(hex('#7d7366'), lk.light * 0.8));
      const inset = corners.map(([x, z]) => { const [cx, cz] = q((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2); return [cx + (x - cx) * 0.82, hh + 0.05, cz + (z - cz) * 0.82]; });
      P(inset, mulc(hex('#a29682'), lk.light * 0.7));
    }
  }
  // amphitheatre (east end)
  { const [ax, az] = rotp(540, -60); const ring = (r1, r2, y) => { const pts = []; for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([ax + Math.cos(a) * r1, y, az + Math.sin(a) * r2]); } return pts; };
    P(ring(68, 52, 9 * (1 - bury * 0.8)), lit(mixc(hex('#cdb995'), hex('#a39d92'), bury), [0, 1, 0], sun, lk)); P(ring(36, 22, 9.1 * (1 - bury * 0.8)), mulc(hex(bury > 0.5 ? '#9a948a' : '#c8b58c'), lk.light * 0.85)); }
  // olive / umbrella trees around the town
  for (const tr of TREES) {
    const p = cam.proj([tr.x, 0, tr.z]); if (!p || p[2] > 6000) continue;
    const s = cam.scaleAt([tr.x, 0, tr.z]) * 9 * (0.7 + 0.6 * tr.k); if (s < 0.8) continue;
    if (bury > 0.6 && (st.green ?? 0) < 0.4) { ctx.fillStyle = css(mulc(hex('#5a524a'), lk.light), 0.7); ctx.fillRect(p[0] - s * 0.08, p[1] - s, s * 0.16, s); continue; }
    ctx.globalAlpha = 0.9; ctx.drawImage(ART.tree[(tr.k * 3) | 0], p[0] - s * 0.5, p[1] - s * 1.05, s, s * 1.1); ctx.globalAlpha = 1;
  }
  // pyroclastic current down the flank toward the town
  if (st.pdc && vent) {
    const pts = [[-1500, 1100, 9200], [-1300, 500, 7000], [-900, 150, 4500], [-400, 40, 2200], [0, 15, 400], [300, 10, -800]].map((p) => cam.proj(p)).filter(Boolean).map((p) => [p[0], p[1]]);
    current(ctx, pts, st.pdc.p, (st.pdc.thick || 1) * H * 0.09, t, { tone: 'grey', glow: 0.18 });
  }
  // the eruption column
  if (st.erupt && vent) column(ctx, vent[0], vent[1], st._mpx || 30, t, { ...st.erupt, H: st.erupt.H || 26 });
  if (st.lightning && vent) lightning(ctx, vent[0] + 40, vent[1] - (st._mpx || 30) * 12, vent[0] + 10, vent[1] - (st._mpx || 30) * 3, t, st.lightning);
  if (st.ashFall) fall(ctx, W, H, t, { kind: 'ash', density: st.ashFall, wind: 60, depth: 0.6 });
  if (st.haze) veil(ctx, W, H, lk.fog, st.haze * 0.7, st.haze * 0.4);
  if (st.night) { ctx.fillStyle = `rgba(10,6,4,${0.35 * st.night})`; ctx.fillRect(0, 0, W, H); }
  // projected anchors for overlays (labels)
  st._p = (x, y, z) => cam.proj([x, y, z]);
  st._town = cam.proj([0, 10, 0]);
  st._outline = []; for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; const [x, z] = rotp(Math.cos(a) * 660, Math.sin(a) * 345); const p = cam.proj([x, 2, z]); if (p) st._outline.push(p); }
  st._grid = []; for (let ix = -8; ix <= 8; ix++) { const a = rotp(ix * 78 - 39, -330), b = rotp(ix * 78 - 39, 330); st._grid.push([cam.proj([a[0], 2, a[1]]), cam.proj([b[0], 2, b[1]])]); }
  for (let iz = -5; iz <= 5; iz++) { const a = rotp(-660, iz * 58 - 29), b = rotp(660, iz * 58 - 29); st._grid.push([cam.proj([a[0], 2, a[1]]), cam.proj([b[0], 2, b[1]])]); }
}
