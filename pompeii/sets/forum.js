// forum.js: the Forum of Pompeii looking north: Temple of Jupiter on its high podium, flanking
// arches, two-storey colonnades, statue bases, and Vesuvius beyond. ARTISTIC RECONSTRUCTION.
import { Cam, path, poly, fog, lit, wallX, wallZ, floorY } from '../lib/cam3d.js';
import { hex, css, mixc, mulc, h01, clamp, lerp } from '../lib/util.js';
import { paintSky, ART, drawVeiled, puff } from '../lib/paint.js';
import { drawFigure, tinyFigure, crowdSpec } from '../lib/figures.js';
import { column as eruptColumn, fall, veil } from '../lib/fx.js';

const FW = 19, TZ = 150;

function col(ctx, cam, x, y0, z, h, r, lk, sun, fogD, tilt = 0, base = '#e7dfcf') {
  const a = cam.proj([x, y0, z]), b = cam.proj([x + Math.sin(tilt) * h, y0 + Math.cos(tilt) * h, z]); if (!a || !b) return;
  const w = cam.scaleAt([x, y0 + h / 2, z]) * r * 2;
  const c = fog(mulc(hex(base), lk.light), a[2], lk, fogD), d = fog(mulc(mixc(hex(base), lk.amb, 0.5), lk.light * 0.55), a[2], lk, fogD);
  const g = ctx.createLinearGradient(a[0] - w / 2, 0, a[0] + w / 2, 0);
  g.addColorStop(0, css(mixc(c, lk.sun, 0.25))); g.addColorStop(0.35, css(c)); g.addColorStop(1, css(d));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(a[0] - w / 2, a[1]); ctx.lineTo(b[0] - w * 0.42, b[1]); ctx.lineTo(b[0] + w * 0.42, b[1]); ctx.lineTo(a[0] + w / 2, a[1]); ctx.fill();
  ctx.fillStyle = css(c); ctx.fillRect(b[0] - w * 0.62, b[1] - w * 0.18, w * 1.24, w * 0.2); // capital
  if (w > 6) { ctx.strokeStyle = css(d, 0.35); ctx.lineWidth = 1; ctx.beginPath(); for (let i = 1; i < 4; i++) { const xx = a[0] - w / 2 + (w * i) / 4; ctx.moveTo(xx, a[1]); ctx.lineTo(xx + (b[0] - a[0]), b[1]); } ctx.stroke(); }
}

// st: { cam, lk, crowd, crowdT, ash, ashFall, scaffold, dmg (quake), vesuvius:{erupt}, people, haze, empty }
export function drawForum(ctx, W, H, t, st) {
  const lk = st.lk, cam = new Cam(W, H, st.cam);
  const sun = [-0.5, 0.7, -0.4]; const sl = Math.hypot(...sun); sun.forEach((v, i) => (sun[i] = v / sl));
  const fogD = 260;
  const P = (pts, c, a = 1, tex) => poly(ctx, cam, pts, c, lk, a, fogD, tex);
  const hz = cam.proj([cam.pos[0], cam.pos[1], cam.pos[2] + 9000]); const horizon = hz ? hz[1] : H * 0.45;
  paintSky(ctx, W, H, lk, horizon + 30, t);
  // Vesuvius beyond, slightly left of the temple axis
  const mb = cam.proj([-400, -60, TZ + 9000]), mt = cam.proj([-400, 1300, TZ + 9000]);
  if (mb && mt) { const mh = (mb[1] - mt[1]), mw = mh * 4.6; drawVeiled(ctx, ART.v79, mb[0] - mw / 2, mb[1] - mh, mw, mh, lk.fog, 0.3 + lk.fogK * 0.25);
    if (st.vesuvius && st.vesuvius.erupt) eruptColumn(ctx, mb[0], mb[1] - mh * 0.93, mh / 2, t, st.vesuvius.erupt); }
  ctx.fillStyle = css(mixc(lk.sky[2], lk.fog, 0.5)); ctx.fillRect(0, horizon, W, H);
  // paving: big travertine slabs
  P(floorY(0, -40, 40, -10, 400), mulc(hex('#cdbf9f'), lk.light), 1, ['stone', 0.03, 0.3]);
  ctx.strokeStyle = css(mulc(hex('#9d8f74'), lk.light), 0.45); ctx.lineWidth = 1; ctx.beginPath();
  for (let z = Math.ceil(cam.pos[2] + 1); z < TZ; z += 2.4) { const a = cam.proj([-FW, 0, z]), b = cam.proj([FW, 0, z]); if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }
  for (let x = -FW; x <= FW; x += 2.4) { const a = cam.proj([x, 0, Math.max(cam.pos[2] + 1, 0)]), b = cam.proj([x, 0, TZ]); if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }
  ctx.stroke();
  // ---- temple of Jupiter (far end) + arches
  const tc = hex('#e9e0cc');
  P(wallZ(TZ + 34, -9, 9, 0, 22), lit(tc, [0, 0, -1], sun, lk));                                   // cella back mass
  P(wallZ(TZ, -9, 9, 0, 3.2), lit(hex('#d7cbb1'), [0, 0, -1], sun, lk), 1, ['plaster', 0.02]);        // podium
  for (let i = 0; i < 9; i++) { const y = i * 0.36; P([[-5, y, TZ - 4 + i * 0.44], [5, y, TZ - 4 + i * 0.44], [5, y + 0.36, TZ - 4 + i * 0.44], [-5, y + 0.36, TZ - 4 + i * 0.44]], lit(hex('#ddd2ba'), [0, 0, -1], sun, lk)); }
  P(floorY(3.2, -9, 9, TZ, TZ + 34), lit(hex('#d2c6ab'), [0, 1, 0], sun, lk));
  P(wallZ(TZ + 8, -6.5, 6.5, 3.2, 14), mulc(hex('#3a2e26'), lk.light));                              // dark pronaos
  for (let i = 0; i < 6; i++) col(ctx, cam, -7.5 + i * 3, 3.2, TZ + 0.8, 10.2, 0.55, lk, sun, fogD, st.dmg ? (h01(i, 4) - 0.5) * 0.05 * st.dmg : 0);
  P(wallZ(TZ + 0.4, -8.8, 8.8, 13.4, 15), lit(hex('#e4dac4'), [0, 0, -1], sun, lk));                 // entablature
  P([[-9.2, 15, TZ + 0.3], [9.2, 15, TZ + 0.3], [0, 19, TZ + 0.3]], lit(hex('#ece3d0'), [0, 0, -1], sun, lk)); // pediment
  ctx.strokeStyle = css(mulc(hex('#b9ad94'), lk.light), 0.8); ctx.lineWidth = 2; ctx.beginPath(); const p1 = cam.proj([-9.2, 15, TZ + 0.2]), p2 = cam.proj([0, 19, TZ + 0.2]), p3 = cam.proj([9.2, 15, TZ + 0.2]); if (p1 && p2 && p3) { ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); } ctx.stroke();
  for (const sx of [-1, 1]) { // flanking arches
    const x0 = sx * 13.5; P(wallZ(TZ - 2, x0 - 2.6, x0 + 2.6, 0, 10), lit(hex('#d9c9a6'), [0, 0, -1], sun, lk), 1, ['plaster', 0.02]);
    const top = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (i / 12); top.push([x0 + Math.cos(a) * 1.5, 5 + Math.sin(a) * 1.5, TZ - 2.01]); }
    P([[x0 - 1.5, 0, TZ - 2.01], [x0 + 1.5, 0, TZ - 2.01], ...top.slice().reverse().map((p) => p).reverse()], mulc(hex('#4a3a2e'), lk.light));
  }
  // ---- colonnades (both sides), far to near
  for (const s of [-1, 1]) {
    const X = s * FW;
    P(wallX(s * (FW + 6), -10, TZ - 4, 0, 13), lit(hex('#dcc9a5'), [-s, 0, 0], sun, lk), 1, ['plaster', 0.02]); // back wall
    P(wallX(s * (FW + 6) - s * 0.01, -10, TZ - 4, 0, 4.6), mulc(hex('#4a3b30'), lk.light * 0.9));               // shade under portico
    P(floorY(13, Math.min(X, s * (FW + 6)), Math.max(X, s * (FW + 6)), -10, TZ - 4), lit(hex('#b45d3c'), [0, 1, 0], sun, lk));
    P(wallX(X, -10, TZ - 4, 5.6, 6.6), lit(hex('#e6dcc7'), [-s, 0, 0], sun, lk));                            // lower entablature
    P(wallX(X, -10, TZ - 4, 10.4, 11.2), lit(hex('#e6dcc7'), [-s, 0, 0], sun, lk));                          // upper
    P(wallX(X - s * 0.02, -10, TZ - 4, 11.2, 11.6), lit(hex('#a8543a'), [-s, 0, 0], sun, lk));
    const zs = []; for (let z = TZ - 6; z > cam.pos[2] - 3; z -= 3.6) zs.push(z);
    for (const z of zs) { col(ctx, cam, X, 0, z, 5.6, 0.32, lk, sun, fogD, st.dmg ? (h01(z | 0, 7) - 0.5) * 0.08 * st.dmg : 0); col(ctx, cam, X, 6.6, z, 3.8, 0.24, lk, sun, fogD); }
    // statue bases along the edge
    for (let z = TZ - 20; z > 0; z -= 18) { const x = s * (FW - 2.4); P(wallZ(z, x - 0.8, x + 0.8, 0, 1.8), lit(hex('#d8ceb8'), [0, 0, -1], sun, lk)); P(floorY(1.8, x - 0.8, x + 0.8, z, z + 1.6), lit(hex('#e6dcc8'), [0, 1, 0], sun, lk)); }
    // scaffolding (repairs after the earthquake)
    if (st.scaffold) for (let z = 40 + (s > 0 ? 30 : 0); z < 40 + (s > 0 ? 30 : 0) + 22; z += 2.2) {
      ctx.strokeStyle = css(mulc(hex('#6e5134'), lk.light), 0.95); ctx.lineWidth = Math.max(1, cam.scaleAt([X, 4, z]) * 0.12); ctx.beginPath();
      for (const y of [0, 12]) { void y; }
      const a = cam.proj([X - s * 1.2, 0, z]), b = cam.proj([X - s * 1.2, 12.5, z]); if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      for (const y of [4, 8, 12]) { const c = cam.proj([X - s * 1.2, y, z]), d = cam.proj([X - s * 1.2, y, z + 2.2]); if (c && d) { ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); } }
      ctx.stroke();
    }
  }
  if (st.scaffold) { // temple scaffold + a crane-like hoist
    ctx.strokeStyle = css(mulc(hex('#6e5134'), lk.light), 0.9); ctx.lineWidth = 3; ctx.beginPath();
    for (let x = -8; x <= 8; x += 2) { const a = cam.proj([x, 3.2, TZ - 1.4]), b = cam.proj([x, 18, TZ - 1.4]); if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }
    for (const y of [7, 11, 15]) { const a = cam.proj([-8.5, y, TZ - 1.4]), b = cam.proj([8.5, y, TZ - 1.4]); if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } }
    ctx.stroke();
  }
  // ash deposit
  if (st.ash) P(floorY(st.ash, -FW - 6, FW + 6, -10, TZ), mulc(hex('#a9a196'), lk.light));
  // people
  const people = [...(st.people || [])];
  if (st.crowd) for (let i = 0; i < Math.round(110 * st.crowd); i++) {
    const tt = st.crowdT ?? t, dir = h01(i, 2) * Math.PI * 2, sp = 0.9 + 0.6 * h01(i, 3), stand = h01(i, 4) < 0.35;
    const x0 = (h01(i, 5) - 0.5) * 34, z0 = 6 + h01(i, 6) * 120;
    const x = clamp(x0 + (stand ? 0 : Math.cos(dir) * sp * tt), -17, 17), z = z0 + (stand ? 0 : Math.sin(dir) * sp * tt);
    people.push({ spec: crowdSpec(i, 21), x, z, view: '3q', face: Math.cos(dir) >= 0 ? 1 : -1, walk: stand ? 0 : 1, phase: tt * sp * 0.9 + h01(i, 8), crowd: true });
  }
  people.sort((a, b) => b.z - a.z);
  for (const p of people) {
    const y = st.ash || 0, sp = cam.proj([p.x, y, p.z]); if (!sp || sp[2] < 3 || sp[2] > 200) continue;
    const hpx = cam.scaleAt([p.x, y, p.z]) * (p.spec.h || 1.7);
    if (hpx < 24 && p.crowd) tinyFigure(ctx, sp[0], sp[1], hpx, css(fog(mixc(hex(p.spec.tunic), [40, 35, 30], 0.3), sp[2], lk, fogD)), p.phase, p.walk);
    else drawFigure(ctx, sp[0], sp[1], hpx, p.spec, p);
  }
  if (st.ashFall) fall(ctx, W, H, t, { kind: 'ash', density: st.ashFall, wind: 40 });
  if (st.haze) veil(ctx, W, H, lk.fog, st.haze * 0.8, st.haze * 0.3);
  if (st.dust) for (let i = 0; i < 16; i++) puff(ctx, 'brown', i, W * h01(i, 3), H * (0.3 + 0.4 * h01(i, 4)) - (t % 4) * 10, 80 + 120 * h01(i, 5), 0.25 * st.dust);
}
