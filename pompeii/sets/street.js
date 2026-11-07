// street.js: a Pompeian street in true perspective (tracking shots, push-ins, ash rising in the road).
// Layout follows excavated streets: basalt polygonal paving with cart ruts, raised pavements,
// stepping stones, two-storey frontages with tabernae (shops), a thermopolium counter with dolia,
// a public fountain, painted plaster with red lower dado, projecting tiled eaves, and an honorific
// arch closing the view with Vesuvius beyond (cf. Via di Mercurio). An ARTISTIC RECONSTRUCTION.
import { Cam, path, poly, fog, lit, wallX, wallZ, floorY } from '../lib/cam3d.js';
import { rng, hex, css, mixc, mulc, h01, clamp, smooth, lerp } from '../lib/util.js';
import { paintSky, puff, ART, drawVeiled, texFill } from '../lib/paint.js';
import { TEX } from '../lib/cam3d.js';
TEX.fill = texFill;
import { drawFigure, tinyFigure, crowdSpec, CHAR } from '../lib/figures.js';
import { fall, bounces, veil, lightning, column } from '../lib/fx.js';

const SW = 3.4, RW = 2.2, CURB = 0.32, END = 104;
const PLASTER = ['#e8d6b0', '#dcc49a', '#e6cfa2', '#d9b98c', '#efe2c6', '#c98a63', '#e4c48c', '#d8a77a'];
const DADO = ['#8e3426', '#9b3b2a', '#7d2f24', '#3b2e28', '#a4442d'];

let UNITS = null, STONES = null;
function build() {
  if (UNITS) return;
  UNITS = []; const r = rng(31);
  for (const s of [-1, 1]) {
    let z = -12;
    while (z < END - 4) {
      const len = 4 + r() * 6, h = r() < 0.2 ? 4.6 + r() : 6 + r() * 2.6;
      const kind = r() < 0.55 ? 'shop' : r() < 0.6 ? 'door' : 'wall';
      UNITS.push({ s, z0: z, z1: z + len, h, kind, col: hex(PLASTER[(r() * PLASTER.length) | 0]), dado: hex(DADO[(r() * DADO.length) | 0]),
        bal: r() < 0.25 && h > 6.2, win: 1 + ((r() * 3) | 0), notice: r() < 0.3, id: UNITS.length, crack: r() });
      z += len + (r() < 0.12 ? 0.6 : 0);
    }
  }
  // the hero shop (Marcus): right side around z 12..17, a thermopolium
  const hero = UNITS.find((u) => u.s === 1 && u.z1 > 13 && u.z0 < 13);
  if (hero) { hero.kind = 'thermo'; hero.hero = true; hero.h = 6.6; hero.col = hex('#e4c48c'); hero.dado = hex('#8e3426'); }
  STONES = []; const q = rng(41);
  for (let zi = -10; zi < 130; zi++) for (let xi = 0; xi < 7; xi++) {
    const z = zi * 0.62, x = -RW + (xi + (zi % 2) * 0.5) * (2 * RW / 7);
    STONES.push({ x: x + (q() - 0.5) * 0.12, z: z + (q() - 0.5) * 0.12, w: 0.5 + q() * 0.2, d: 0.46 + q() * 0.14, k: q(), rot: q() });
  }
}

// state: { cam: {pos,yaw,pitch,fov,roll}, lk, ash (m deposit), pumice, ashFall, ruin, night, dmg, collapse:{id,t0},
//          people: [{spec, x, z, view, face, walk, phase, cover, armUp, look, torch}], crowd, crowdT, flee, lamps,
//          vesuvius: {kind, erupt:{grow,spread,tone,glow}}, shutters (0 closed .. 1 open), excav }
export function drawStreet(ctx, W, H, t, st) {
  build();
  const lk = st.lk, cam = new Cam(W, H, st.cam);
  const ruin = st.ruin || 0, ash = st.ash || 0;
  const sun = [-0.55, 0.62, -0.25]; const sl = Math.hypot(...sun); sun.forEach((v, i) => (sun[i] = v / sl));
  // ---- sky + mountain backdrop
  const hz = cam.proj([cam.pos[0], cam.pos[1], cam.pos[2] + 5000]);
  const horizon = hz ? hz[1] : H * 0.5;
  paintSky(ctx, W, H, lk, horizon + 40, t, st.night ? 0.2 : 1);
  ctx.fillStyle = css(lk.sky[2]); ctx.fillRect(0, horizon, W, H - horizon);
  const mt = st.vesuvius === false ? null : (st.vesuvius || {});
  if (mt) {
    const far = cam.proj([cam.pos[0] + 300, cam.pos[1] + 900, cam.pos[2] + 6000]);
    const base = cam.proj([cam.pos[0] + 300, cam.pos[1] - 40, cam.pos[2] + 6000]);
    if (far && base) {
      const img = mt.kind === 'modern' ? ART.modern : ART.v79;
      const mh = (base[1] - far[1]) * 1.2, mw = mh * img.width / img.height;
      drawVeiled(ctx, img, base[0] - mw / 2, base[1] - mh, mw, mh, lk.fog, 0.35 + lk.fogK * 0.3);
      if (mt.erupt) { column(ctx, base[0] + mw * (img.peak[0] - 0.5), base[1] - mh * (1 - img.peak[1]), mh / 2.2, t, mt.erupt); }
    }
  }
  // ---- street end: honorific arch + far facades
  const fogD = st.night ? 45 : 120;
  const P = (pts, col, a = 1) => poly(ctx, cam, pts, col, lk, a, fogD);
  // ground beyond the end
  P(floorY(0, -40, 40, END, 400), mixc(hex('#a49478'), lk.fog, 0.4));
  if (!ruin || ruin < 1) {
    const arch = mulc(hex('#d8c9a8'), lk.light);
    const aZ = END - 6, aw = 0.9;
    for (const sx of [-1, 1]) {
      P(wallZ(aZ, sx * (RW + 0.1) - (sx < 0 ? aw : 0), sx * (RW + 0.1) + (sx > 0 ? aw : 0), 0, 7.5), lit(hex('#d6c6a4'), [0, 0, -1], sun, lk));
    }
    const top = []; for (let i = 0; i <= 16; i++) { const a = Math.PI * (i / 16); top.push([Math.cos(a) * (RW + 0.1), 5.2 + Math.sin(a) * 1.6, aZ]); }
    ctx.beginPath(); const pts = [[-(RW + 0.1 + aw), 7.5, aZ], [-(RW + 0.1 + aw), 9.6, aZ], [RW + 0.1 + aw, 9.6, aZ], [RW + 0.1 + aw, 7.5, aZ], ...top.map((p) => p)];
    P([[-(RW + 1), 6.9, aZ], [RW + 1, 6.9, aZ], [RW + 1, 9.6, aZ], [-(RW + 1), 9.6, aZ]], lit(hex('#d2c09c'), [0, 0, -1], sun, lk));
    P([[-(RW + 1.2), 9.6, aZ - 0.2], [RW + 1.2, 9.6, aZ - 0.2], [RW + 1.2, 10.0, aZ - 0.2], [-(RW + 1.2), 10.0, aZ - 0.2]], mulc(arch, 0.85));
    void pts;
  }
  // ---- road + paving
  const road = mulc(hex(ash > 0.05 ? '#55504a' : '#4a4642'), lk.light);
  poly(ctx, cam, floorY(0, -RW, RW, -20, END), road, lk, 1, fogD, ['stone', 0.006, 0.35]);
  const camZ = cam.pos[2];
  ctx.lineWidth = 1;
  for (const s of STONES) {
    if (s.z < camZ - 1 || s.z > camZ + 34) continue;
    const c = mixc(hex('#5f5a55'), hex('#77706a'), s.k);
    const a = s.rot * 0.6, cw = Math.cos(a) * 0.04;
    const pts = [[s.x - s.w / 2 + cw, 0.01, s.z - s.d / 2], [s.x + s.w / 2, 0.01, s.z - s.d / 2 - cw], [s.x + s.w / 2 - cw, 0.01, s.z + s.d / 2], [s.x - s.w / 2, 0.01, s.z + s.d / 2 + cw]];
    poly(ctx, cam, pts, mulc(c, lk.light * (0.85 + 0.3 * s.k)), lk, 1, fogD);
  }
  // cart ruts
  ctx.strokeStyle = css(mulc(road, 0.55), 0.6); ctx.lineWidth = 2;
  for (const rx of [-0.72, 0.72]) { ctx.beginPath(); for (let z = Math.max(-5, camZ); z < END; z += 2) { const p = cam.proj([rx, 0.02, z]); if (p) (z === Math.max(-5, camZ) ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1])); } ctx.stroke(); }
  // stepping stones
  for (const zz of [28, 66]) for (const sx of [-1.3, 0, 1.3]) {
    const c = lit(hex('#857d72'), [0, 1, 0], sun, lk);
    P([[sx - 0.42, 0.3, zz - 0.25], [sx + 0.42, 0.3, zz - 0.25], [sx + 0.42, 0.3, zz + 0.25], [sx - 0.42, 0.3, zz + 0.25]], c);
    P([[sx - 0.42, 0, zz - 0.25], [sx + 0.42, 0, zz - 0.25], [sx + 0.42, 0.3, zz - 0.25], [sx - 0.42, 0.3, zz - 0.25]], mulc(c, 0.7));
  }
  // ---- pavements (kerb face + top)
  for (const s of [-1, 1]) {
    const kc = lit(hex('#8c8478'), [-s, 0, 0], sun, lk);
    P(wallX(s * RW, -20, END, 0, CURB), kc);
    P(floorY(CURB, Math.min(s * RW, s * SW), Math.max(s * RW, s * SW), -20, END), lit(hex(ruin > 0.5 ? '#a49884' : '#b19d80'), [0, 1, 0], sun, lk));
  }
  // shadow cast by the left frontage across the road (sun from the left)
  if (!st.night && lk.light > 0.7) {
    ctx.save(); ctx.globalAlpha = 0.28 * clamp((lk.light - 0.7) * 3);
    P([[-SW, 0.02, -20], [-SW + 2.6, 0.02, -20], [-SW + 2.6, 0.02, END], [-SW, 0.02, END]], [30, 25, 40]);
    ctx.restore();
  }
  // ---- frontages: both sides, far to near
  const order = UNITS.filter((u) => u.z1 > camZ - 2).sort((a, b) => b.z0 - a.z0);
  for (const u of order) drawUnit(ctx, cam, u, st, lk, sun, t, fogD, P);
  // fountain on the left pavement
  drawFountain(ctx, cam, -2.8, 22, lk, sun, P, ruin);
  // ---- ash deposit filling the street
  if (ash > 0.01) {
    const ac = mulc(hex(ash > 1.2 ? '#9a9286' : '#b8b0a2'), lk.light * 1.05);
    if (ash < CURB) { P(floorY(ash, -RW, RW, -20, END), ac, clamp(ash * 8)); for (const s of [-1, 1]) P(floorY(CURB + 0.01, Math.min(s * RW, s * SW), Math.max(s * RW, s * SW), -20, END), ac, clamp(ash * 4)); }
    else P(floorY(ash, -SW, SW, -20, END), ac);
    // pumice texture on the surface near the camera
    for (let i = 0; i < 260; i++) {
      const x = -SW + h01(i, 3) * SW * 2, z = camZ + 1 + h01(i, 4) ** 1.6 * 30, p = cam.proj([x, ash + 0.01, z]); if (!p) continue;
      const sc = cam.scaleAt([x, ash, z]); ctx.fillStyle = css(mulc(mixc(hex('#d9d0c0'), hex('#857c70'), h01(i, 5)), lk.light), 0.8);
      ctx.beginPath(); ctx.ellipse(p[0], p[1], 0.04 * sc + 0.5, 0.025 * sc + 0.3, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  // ---- people (far to near)
  const people = [];
  if (st.crowd) {
    const n = Math.round(46 * st.crowd);
    for (let i = 0; i < n; i++) {
      const dir = h01(i, 61) < 0.5 ? 1 : -1, speed = (st.flee ? 1.9 : 1.05) * (0.8 + 0.4 * h01(i, 62));
      const span = 70, z0 = h01(i, 63) * span;
      let z = ((z0 + dir * speed * (st.crowdT ?? t)) % span + span) % span + camZ - 4;
      if (st.flee) z = camZ + 4 + ((z0 - speed * (st.crowdT ?? t)) % span + span) % span;
      const onPave = h01(i, 64) < 0.4;
      const x = onPave ? (h01(i, 65) < 0.5 ? -1 : 1) * (RW + 0.6 + h01(i, 66) * 0.5) : -1.7 + h01(i, 67) * 3.4;
      people.push({ spec: crowdSpec(i, 7), x, z, y: (onPave ? CURB : 0), view: st.flee ? 'back' : '3q', face: st.flee ? 1 : dir, walk: 1, phase: (st.crowdT ?? t) * speed * 0.9 + h01(i, 68), cover: st.cover || 0, crowd: true, torch: st.night && h01(i, 69) < 0.3 });
    }
  }
  for (const p of st.people || []) people.push(p);
  people.sort((a, b) => b.z - a.z);
  for (const p of people) {
    const y = Math.max(p.y || 0, ash);
    const sp = cam.proj([p.x, y, p.z]); if (!sp || sp[2] > 80 || sp[2] < (p.crowd ? 3.2 : 1.0)) continue;
    const ppm = cam.scaleAt([p.x, y, p.z]); const hpx = ppm * (p.spec.h || 1.7);
    if (sp[0] < -200 || sp[0] > W + 200) continue;
    const fogk = clamp(1 - Math.exp(-(sp[2] / fogD) * lk.fogK * 2.2));
    if (hpx < 26 && p.crowd) tinyFigure(ctx, sp[0], sp[1], hpx, css(mixc(mixc(hex(p.spec.tunic), [40, 35, 30], 0.35), lk.fog, fogk)), p.phase, p.walk);
    else {
      drawFigure(ctx, sp[0], sp[1], hpx, p.spec, { view: p.view, face: p.face, walk: p.walk, phase: p.phase, cover: p.cover, armUp: p.armUp, look: p.look, crouch: p.crouch });
      if (fogk > 0.04 || lk.light < 0.9) { // atmospheric veil over the figure: fake by a translucent fog-coloured silhouette pass
        ctx.save(); ctx.globalAlpha = Math.min(0.85, fogk * 0.9 + (st.night ? 0.25 : 0)); drawFigure(ctx, sp[0], sp[1], hpx, { ...p.spec, tunic: css(lk.fog), skin: css(lk.fog), hair: css(lk.fog), cloak: p.spec.cloak && css(lk.fog), palla: p.spec.palla && css(lk.fog), belt: null, sandal: css(lk.fog) }, { view: p.view, face: p.face, walk: p.walk, phase: p.phase, cover: p.cover, armUp: p.armUp, crouch: p.crouch, detail: 0 }); ctx.restore();
      }
    }
    if (p.torch) torch(ctx, sp[0] + hpx * 0.18 * (p.face || 1), sp[1] - hpx * 0.95, hpx, t + p.z);
  }
  // ---- falling material + air
  if (st.pumice) { fall(ctx, W, H, t, { kind: 'pumice', density: st.pumice, wind: 40 }); bounces(ctx, W, t, Math.max(horizon, H * 0.62), H, st.pumice * 0.8); }
  if (st.ashFall) fall(ctx, W, H, t, { kind: 'ash', density: st.ashFall, wind: 50 });
  if (st.dust) fall(ctx, W, H, t, { kind: 'dust', density: st.dust, wind: 8 });
  if (st.lightning) lightning(ctx, W * 0.62, horizon - H * 0.45, W * 0.58, horizon - H * 0.15, t, st.lightning);
  if (st.haze) veil(ctx, W, H, lk.fog, st.haze * 0.9, st.haze * 0.35, 0, H);
  if (st.collapse) collapseFx(ctx, cam, st.collapse, t);
}

function import_column(ctx, x, y, s, t, e) { columnRef(ctx, x, y, s, t, e); }
let columnRef = () => {};
export function setColumn(fn) { columnRef = fn; }

function drawUnit(ctx, cam, u, st, lk, sun, t, fogD, P) {
  const s = u.s, X = s * SW, ruin = st.ruin || 0;
  const n = [-s, 0, 0];
  let col = u.col, dado = u.dado;
  if (ruin) { col = mixc(col, hex('#b7ab95'), 0.55 * ruin); dado = mixc(dado, hex('#8a6a5a'), 0.6 * ruin); }
  if (u.hero && st.heroSign) col = mixc(col, hex('#f0d49c'), 0.2);
  const C0 = lit(col, n, sun, lk), CD = lit(dado, n, sun, lk);
  // wall height: full, or broken (ruins)
  const hTop = ruin ? lerp(u.h, 2.2 + 2.6 * h01(u.id, 5), ruin) : u.h;
  // facade
  if (ruin) {
    const pts = [[X, 0, u.z0], [X, 0, u.z1]]; const m = 7;
    for (let i = m; i >= 0; i--) { const zz = u.z0 + (u.z1 - u.z0) * (i / m); pts.push([X, hTop * (0.75 + 0.3 * h01(u.id * 13 + i, 8)), zz]); }
    P(pts, C0);
  } else poly(ctx, cam, wallX(X, u.z0, u.z1, 0, hTop), C0, lk, 1, fogD, ['plaster', 0.012]);
  // weathering: darker toward the pavement, sun-bleached at the top
  { const d = path(ctx, cam, wallX(X, u.z0, u.z1, 0, hTop)); if (d > 0) { const a = cam.proj([X, 0, Math.max(u.z0, cam.pos[2] + 1)]), b = cam.proj([X, hTop, Math.max(u.z0, cam.pos[2] + 1)]);
    if (a && b) { const g = ctx.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, 'rgba(60,40,25,0.22)'); g.addColorStop(0.5, 'rgba(60,40,25,0)'); g.addColorStop(1, 'rgba(255,240,215,0.10)'); ctx.fillStyle = g; ctx.fill(); } } }
  P(wallX(X, u.z0, u.z1, CURB, 1.15), CD);
  // openings
  const mid = (u.z0 + u.z1) / 2;
  const open = (z0, z1, y0, y1, depth = 1.6, inner = '#2a211b', withCounter = false) => {
    const d = path(ctx, cam, wallX(X, z0, z1, y0, y1)); if (d < 0) return;
    ctx.save(); ctx.clip();
    const ic = fog(mulc(hex(inner), lk.light), d, lk, fogD);
    ctx.fillStyle = css(ic); ctx.fill();
    // far reveal (jamb) catches light
    P(wallZ(z1, X, X + s * depth, y0, y1), lit(col, [0, 0, -1], sun, lk));
    P(floorY(y0 + 0.001, Math.min(X, X + s * depth), Math.max(X, X + s * depth), z0, z1), mulc(ic, 1.4));
    if (withCounter) {
      const cx0 = X + s * 0.15, cx1 = X + s * 0.75;
      P(wallX(cx0, z0 + 0.2, z1 - 1.0, y0, y0 + 1.05), lit(hex('#d8cfc0'), n, sun, lk));                 // marble-clad counter front
      P(floorY(y0 + 1.05, Math.min(cx0, cx1), Math.max(cx0, cx1), z0 + 0.2, z1 - 1.0), lit(hex('#e9e2d4'), [0, 1, 0], sun, lk));
      for (let i = 0; i < 3; i++) { // dolia mouths set into the counter
        const zz = z0 + 0.7 + i * ((z1 - z0 - 1.6) / 3); const c = cam.proj([(cx0 + cx1) / 2, y0 + 1.06, zz]); if (!c) continue;
        const r = cam.scaleAt([(cx0 + cx1) / 2, y0 + 1.06, zz]) * 0.2; ctx.fillStyle = css(fog(hex('#3a2a20'), d, lk, fogD)); ctx.beginPath(); ctx.ellipse(c[0], c[1], r, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = css(fog(hex('#9a6a4a'), d, lk, fogD)); ctx.lineWidth = Math.max(1, r * 0.25); ctx.stroke();
      }
      // shelves with jugs on the back wall
      for (let i = 0; i < 6; i++) { const p = cam.proj([X + s * 1.55, y0 + 1.7 + (i % 2) * 0.5, z0 + 0.6 + (i >> 1) * 0.9]); if (!p) continue; const r = cam.scaleAt([X + s * 1.5, 2, z0 + 1]) * 0.12; ctx.fillStyle = css(fog(hex('#9a5a3a'), d, lk, fogD)); ctx.beginPath(); ctx.ellipse(p[0], p[1], r * 0.7, r, 0, 0, Math.PI * 2); ctx.fill(); }
    }
    if (st.night && st.lamps && h01(u.id, 77) < 0.45) { const c = cam.proj([X + s * 0.6, y0 + 1.6, (z0 + z1) / 2]); if (c) glow(ctx, c[0], c[1], cam.scaleAt([X, 1, (z0 + z1) / 2]) * 1.6, t + u.id, 0.8); }
    ctx.restore();
  };
  if (u.kind === 'shop' || u.kind === 'thermo') {
    const z0 = u.z0 + 0.35, z1 = u.z1 - 0.35;
    open(z0, z1, CURB, CURB + 2.7, 2.4, '#2c231c', u.kind === 'thermo');
    // wooden shutter boards (closed shops): slide away as 'shutters' opens (hero shop only)
    const closed = u.hero ? 1 - (st.shutters ?? 1) : (st.night || st.ashShut ? 1 : 0) * (1 - ruin);
    if (closed > 0.01) {
      const nb = Math.round((z1 - z0) / 0.32);
      for (let i = 0; i < Math.ceil(nb * closed); i++) {
        const zz = z0 + i * (z1 - z0) / nb;
        P(wallX(X - s * 0.02, zz, zz + (z1 - z0) / nb - 0.02, CURB, CURB + 2.7), lit(hex(i % 2 ? '#6e4a2e' : '#7a5334'), n, sun, lk));
      }
    }
    // lintel beam
    P(wallX(X - s * 0.03, z0 - 0.1, z1 + 0.1, CURB + 2.7, CURB + 2.95), lit(hex(ruin ? '#7d756a' : '#5e4330'), n, sun, lk));
  } else if (u.kind === 'door') {
    open(mid - 0.75, mid + 0.75, CURB, CURB + 2.9, 1.2, '#1f1813');
    P(wallX(X - s * 0.02, mid - 0.95, mid + 0.95, CURB + 2.9, CURB + 3.15), lit(hex('#cbbb98'), n, sun, lk));
  }
  // upper windows (small, shuttered)
  if (hTop > 5) for (let i = 0; i < u.win; i++) {
    const zz = u.z0 + (i + 0.5) * (u.z1 - u.z0) / u.win;
    P(wallX(X - s * 0.01, zz - 0.35, zz + 0.35, 4.2, 4.9), mulc(lk.amb, 0.45));
  }
  // painted electoral notice (red letters on a white band)
  if (u.notice && !ruin) {
    P(wallX(X - s * 0.01, u.z0 + 0.4, u.z1 - 0.4, 3.25, 3.85), lit(hex('#eee6d4'), n, sun, lk));
    ctx.strokeStyle = css(fog(hex('#9b2a1e'), cam.depth([X, 3.5, mid]), lk, fogD), 0.9);
    const L = Math.max(3, Math.round((u.z1 - u.z0 - 0.8) / 0.32));
    for (let i = 0; i < L; i++) {
      const zz = u.z0 + 0.5 + i * (u.z1 - u.z0 - 1) / L, a = cam.proj([X - s * 0.02, 3.4, zz]), b = cam.proj([X - s * 0.02, 3.72, zz + 0.12]);
      if (!a || !b) continue; ctx.lineWidth = Math.max(0.6, cam.scaleAt([X, 3.5, zz]) * 0.05); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
  }
  // quake cracks
  if (st.dmg && u.crack < st.dmg) {
    ctx.strokeStyle = css([40, 30, 25], 0.7); ctx.lineWidth = 1.5; ctx.beginPath();
    let zz = u.z0 + (u.z1 - u.z0) * h01(u.id, 91), yy = hTop * 0.9;
    let p0 = cam.proj([X - s * 0.02, yy, zz]);
    for (let i = 0; i < 7 && p0; i++) { zz += (h01(u.id * 7 + i, 92) - 0.5) * 0.8; yy -= 0.5 + h01(u.id + i, 93) * 0.4; const p1 = cam.proj([X - s * 0.02, yy, zz]); if (!p1) break; ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); p0 = p1; }
    ctx.stroke();
  }
  // balcony (maenianum) + eaves
  if (!ruin) {
    if (u.bal) {
      const by = 3.6, bd = 1.0;
      P(floorY(by, Math.min(X, X - s * bd), Math.max(X, X - s * bd), u.z0 + 0.4, u.z1 - 0.4), mulc(hex('#4e3a2a'), lk.light * 0.8));
      P(wallX(X - s * bd, u.z0 + 0.4, u.z1 - 0.4, by, by + 1.0), lit(hex('#c9b48e'), n, sun, lk));
      P(wallX(X - s * bd, u.z0 + 0.4, u.z1 - 0.4, by + 1.0, by + 1.15), mulc(hex('#8a4a32'), lk.light));
    }
    const ey = hTop, ed = 0.75;
    P(floorY(ey, Math.min(X, X - s * ed), Math.max(X, X - s * ed), u.z0, u.z1), mulc(hex('#3a2a20'), lk.light * 0.9)); // underside
    P(wallX(X - s * ed, u.z0, u.z1, ey, ey + 0.28), lit(hex('#a8543a'), [0, 0.3, -s], sun, lk));                   // tile edge
    // roof slope: only visible from above the eaves
    if (cam.pos[1] > ey + 1.7) P([[X - s * ed, ey + 0.28, u.z0], [X - s * ed, ey + 0.28, u.z1], [X + s * 2.5, ey + 1.6, u.z1], [X + s * 2.5, ey + 1.6, u.z0]], lit(hex('#b45d3c'), [0, 1, 0], sun, lk));
    if (cam.pos[1] > ey + 1.7) {
    const segs = Math.round((u.z1 - u.z0) / 0.32);
    ctx.strokeStyle = css(fog(hex('#6e2f1f'), cam.depth([X, ey, mid]), lk, fogD), 0.55); ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i <= segs; i++) { const zz = u.z0 + i * (u.z1 - u.z0) / segs, a = cam.proj([X - s * ed, ey + 0.28, zz]), b = cam.proj([X + s * 2.5, ey + 1.6, zz]); if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }
    ctx.stroke(); }
  } else if (ruin > 0.5) {
    // grass on the broken wall tops
    for (let i = 0; i < 6; i++) { const zz = u.z0 + (i + 0.5) * (u.z1 - u.z0) / 6, p = cam.proj([X, hTop * (0.8 + 0.25 * h01(u.id * 13 + i, 8)), zz]); if (!p) continue; const sc = cam.scaleAt([X, 3, zz]); ctx.fillStyle = css(mulc(hex('#6b7a45'), lk.light), 0.8); ctx.beginPath(); ctx.ellipse(p[0], p[1], sc * 0.25, sc * 0.12, 0, 0, Math.PI * 2); ctx.fill(); }
  }
}

function drawFountain(ctx, cam, x, z, lk, sun, P, ruin) {
  const c = lit(hex('#9c958a'), [1, 0, 0], sun, lk), top = lit(hex('#b8b0a2'), [0, 1, 0], sun, lk);
  P(wallX(x + 0.55, z - 0.7, z + 0.7, CURB, CURB + 0.8), c);
  P(wallZ(z - 0.7, x - 0.55, x + 0.55, CURB, CURB + 0.8), mulc(c, 0.9));
  P(floorY(CURB + 0.8, x - 0.55, x + 0.55, z - 0.7, z + 0.7), top);
  P(floorY(CURB + 0.78, x - 0.42, x + 0.42, z - 0.57, z + 0.57), mixc(hex('#7a95a2'), lk.sky[1], 0.4));
  P(wallZ(z + 0.2, x - 0.55, x - 0.2, CURB + 0.8, CURB + 1.8), lit(hex('#a59d90'), [0, 0, -1], sun, lk)); // spout block
  if (!ruin) { const a = cam.proj([x - 0.3, CURB + 1.45, z + 0.15]), b = cam.proj([x - 0.05, CURB + 0.8, z + 0.05]); if (a && b) { ctx.strokeStyle = 'rgba(210,230,240,0.6)'; ctx.lineWidth = Math.max(1, cam.scaleAt([x, 1, z]) * 0.04); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(b[0] - 4, a[1], b[0], b[1]); ctx.stroke(); } }
}

export function glow(ctx, x, y, r, t, a = 1) {
  const f = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7.3);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * f);
  g.addColorStop(0, `rgba(255,200,120,${0.75 * a})`); g.addColorStop(0.25, `rgba(255,140,60,${0.35 * a})`); g.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function torch(ctx, x, y, hpx, t) {
  ctx.fillStyle = '#4a3020'; ctx.fillRect(x - hpx * 0.01, y, hpx * 0.02, hpx * 0.25);
  const f = 1 + 0.2 * Math.sin(t * 17) + 0.1 * Math.sin(t * 29);
  ctx.fillStyle = 'rgba(255,190,90,0.95)'; ctx.beginPath(); ctx.ellipse(x, y - hpx * 0.03, hpx * 0.025, hpx * 0.06 * f, 0, 0, Math.PI * 2); ctx.fill();
  glow(ctx, x, y, hpx * 0.9, t, 0.9);
}
function collapseFx(ctx, cam, c, t) {
  const k = t - c.t0; if (k < 0) return;
  const base = cam.proj([c.x, c.y, c.z]); if (!base) return;
  const sc = cam.scaleAt([c.x, c.y, c.z]);
  for (let i = 0; i < 26; i++) { // tiles + beams falling
    const tt = k - h01(i, 3) * 0.4; if (tt < 0 || tt > 1.6) continue;
    const x = base[0] + (h01(i, 4) - 0.5) * sc * 4 + (h01(i, 6) - 0.5) * sc * 2 * tt, y = base[1] + 0.5 * 9.8 * sc * tt * tt;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tt * 6 * (h01(i, 5) - 0.5)); ctx.fillStyle = i % 4 ? '#9a4a30' : '#4e3a2a'; ctx.fillRect(-sc * 0.25, -sc * 0.06, sc * 0.5, sc * 0.12); ctx.restore();
  }
  for (let i = 0; i < 40; i++) { // dust billow
    const tt = k - 0.3 - h01(i, 7) * 0.5; if (tt < 0) continue;
    const r = sc * (0.8 + tt * 2.2) * (0.6 + 0.6 * h01(i, 8)), a = Math.max(0, 0.7 - tt * 0.25);
    puff(ctx, 'brown', i, base[0] + (h01(i, 9) - 0.5) * sc * 6 * (0.5 + tt), base[1] + sc * 3.5 - tt * sc * 1.4 * h01(i, 10), r, a);
  }
}
