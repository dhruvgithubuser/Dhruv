// atrium.js: the atrium of a well-to-do Pompeian house: compluvium opening in the roof above the
// impluvium basin, Fourth-Style red wall panels over a dark dado, a lararium shrine, and the
// tablinum opening onto a colonnaded garden (peristyle). ARTISTIC RECONSTRUCTION.
import { Cam, path, poly, fog, lit, wallX, wallZ, floorY } from '../lib/cam3d.js';
import { hex, css, mixc, mulc, h01, clamp } from '../lib/util.js';
import { paintSky, ART, puff } from '../lib/paint.js';
import { drawFigure } from '../lib/figures.js';
import { rays, fall } from '../lib/fx.js';
import { glow } from './street.js';

const RX = 6, RZ = 14, RH = 6.4, IMP = [-2, 2, 5, 9];

// st: { cam, lk, people, ruin, night (lamp-lit), dust (ceiling dust falling), shake, ashFall (through compluvium) }
export function drawAtrium(ctx, W, H, t, st) {
  const lk = st.lk, cam = new Cam(W, H, st.cam), ruin = st.ruin || 0, night = st.night || 0;
  const sun = [-0.3, 0.9, 0.3];
  const fogD = 600;
  const amb = night ? 0.35 : 1;
  const P = (pts, c, a = 1, tex) => poly(ctx, cam, pts, mulc(c, amb), lk, a, fogD, tex);
  ctx.fillStyle = css(mulc(lk.sky[1], amb)); ctx.fillRect(0, 0, W, H);
  // peristyle garden seen through the tablinum (far, bright)
  P(floorY(0, -12, 12, RZ, RZ + 22), mixc(hex('#6f8048'), lk.sun, 0.15));
  P(wallZ(RZ + 22, -12, 12, 0, 9), lit(hex('#d9c7a2'), [0, 0, -1], sun, lk));
  for (let x = -9; x <= 9; x += 3) { // garden colonnade: red lower drum, white fluted shaft
    const a = cam.proj([x, 0, RZ + 12]), b = cam.proj([x, 4.2, RZ + 12]); if (!a || !b) continue; const w = cam.scaleAt([x, 2, RZ + 12]) * 0.5;
    ctx.fillStyle = css(mulc(hex('#f0e8d8'), lk.light * amb)); ctx.fillRect(a[0] - w / 2, b[1], w, a[1] - b[1]);
    ctx.fillStyle = css(mulc(hex('#a23a2a'), lk.light * amb)); ctx.fillRect(a[0] - w / 2, a[1] - (a[1] - b[1]) * 0.33, w, (a[1] - b[1]) * 0.33);
  }
  for (let i = 0; i < 26; i++) { const x = -10 + h01(i, 2) * 20, z = RZ + 4 + h01(i, 3) * 14, p = cam.proj([x, 0, z]); if (!p) continue; const s = cam.scaleAt([x, 0, z]) * (1.2 + h01(i, 4) * 1.4); ctx.globalAlpha = amb; ctx.drawImage(ART.tree[i % 3], p[0] - s / 2, p[1] - s, s, s * 1.08); ctx.globalAlpha = 1; }
  // floor: opus signinum with scattered white tesserae
  P(floorY(0, -RX, RX, -2, RZ), mulc(hex(ruin ? '#8a7766' : '#9b5a44'), lk.light * 0.95), 1, ['ground', 0.01, 0.35]);
  for (let i = 0; i < 380; i++) { const x = -RX + h01(i, 5) * 2 * RX, z = -1 + h01(i, 6) * (RZ + 1); if (x > IMP[0] - 0.3 && x < IMP[1] + 0.3 && z > IMP[2] - 0.3 && z < IMP[3] + 0.3) continue; const p = cam.proj([x, 0.01, z]); if (!p) continue; const r = cam.scaleAt([x, 0, z]) * 0.035; ctx.fillStyle = css(mulc(hex('#efe6d6'), amb), 0.8); ctx.fillRect(p[0] - r, p[1] - r * 0.5, r * 2, r); }
  // impluvium: marble kerb + water mirroring the sky
  P(floorY(0.02, IMP[0] - 0.3, IMP[1] + 0.3, IMP[2] - 0.3, IMP[3] + 0.3), mulc(hex('#e8e0d0'), lk.light));
  P(floorY(0.03, IMP[0], IMP[1], IMP[2], IMP[3]), ruin ? mixc(hex('#6f7a48'), lk.amb, 0.3) : mixc(hex('#557b8c'), lk.sky[1], 0.55));
  // side walls: dado, red panels, white upper zone, painted frames
  for (const s of [-1, 1]) {
    const X = s * RX, n = [-s, 0, 0];
    const wallc = ruin ? '#b5a58c' : '#a3352a';
    P(wallX(X, -2, RZ, 0, RH), lit(hex(ruin ? '#c2b39a' : '#efe4cc'), n, sun, lk), 1, ['plaster', 0.012]);
    P(wallX(X, -2, RZ, 0, 1.0), lit(hex(ruin ? '#7a6a5a' : '#2a2320'), n, sun, lk));
    for (let k = 0; k < 4; k++) {
      const z0 = 0.2 + k * 3.4, z1 = z0 + 2.8, door = (s < 0 && k === 1) || (s > 0 && k === 2);
      if (door) { P(wallX(X - s * 0.01, z0 + 0.6, z1 - 0.6, 0, 2.7), mulc(hex('#1c1512'), lk.light)); continue; }
      P(wallX(X - s * 0.01, z0, z1, 1.15, 3.9), lit(hex(wallc), n, sun, lk));
      if (!ruin || h01(k + s, 3) < 0.5) {
        P(wallX(X - s * 0.015, z0 + 0.12, z1 - 0.12, 1.27, 1.33), lit(hex('#e2b74a'), n, sun, lk)); P(wallX(X - s * 0.015, z0 + 0.12, z1 - 0.12, 3.72, 3.78), lit(hex('#e2b74a'), n, sun, lk));
        // central vignette: a small bird or garland motif (generic)
        const c = cam.proj([X - s * 0.02, 2.5, (z0 + z1) / 2]); if (c) { const r = cam.scaleAt([X, 2.5, (z0 + z1) / 2]) * 0.32; ctx.fillStyle = css(mulc(hex('#efe0b8'), lk.light * amb), 0.9); ctx.beginPath(); ctx.ellipse(c[0], c[1], r * 0.55, r, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = css(mulc(hex('#4f6b4a'), lk.light * amb)); ctx.beginPath(); ctx.ellipse(c[0], c[1] + r * 0.1, r * 0.25, r * 0.4, 0.5, 0, Math.PI * 2); ctx.fill(); }
      }
      // garland on the white zone above
      const g0 = cam.proj([X - s * 0.02, 4.6, z0]), g1 = cam.proj([X - s * 0.02, 4.6, z1]), gm = cam.proj([X - s * 0.02, 4.2, (z0 + z1) / 2]);
      if (g0 && g1 && gm && !ruin) { ctx.strokeStyle = css(mulc(hex('#4f7a46'), lk.light * amb), 0.9); ctx.lineWidth = Math.max(1.5, cam.scaleAt([X, 4.5, z0]) * 0.07); ctx.beginPath(); ctx.moveTo(g0[0], g0[1]); ctx.quadraticCurveTo(gm[0], gm[1] + (gm[1] - g0[1]), g1[0], g1[1]); ctx.stroke(); }
    }
    if (s > 0 && !ruin) { // lararium: small aedicula with pediment
      const z = 11.6; P(wallX(X - s * 0.25, z - 0.7, z + 0.7, 1.1, 2.4), lit(hex('#e9dcc0'), n, sun, lk)); P(wallX(X - s * 0.26, z - 0.45, z + 0.45, 1.3, 2.1), mulc(hex('#5a2a1e'), lk.light)); P([[X - s * 0.25, 2.4, z - 0.8], [X - s * 0.25, 2.4, z + 0.8], [X - s * 0.25, 2.9, z]], lit(hex('#efe4cc'), n, sun, lk));
    }
  }
  // far wall with the tablinum opening onto the garden
  const fw = lit(hex(ruin ? '#c2b39a' : '#efe4cc'), [0, 0, -1], sun, lk);
  P([[-RX, 0, RZ], [-3, 0, RZ], [-3, 4.8, RZ], [3, 4.8, RZ], [3, 0, RZ], [RX, 0, RZ], [RX, RH, RZ], [-RX, RH, RZ]], fw, 1, ['plaster', 0.012]);
  P(wallZ(RZ - 0.01, -RX, -3, 0, 1), mulc(hex(ruin ? '#7a6a5a' : '#2a2320'), lk.light)); P(wallZ(RZ - 0.01, 3, RX, 0, 1), mulc(hex(ruin ? '#7a6a5a' : '#2a2320'), lk.light));
  P(wallZ(RZ - 0.01, -RX + 0.4, -3.4, 1.15, 3.9), lit(hex(ruin ? '#b5a58c' : '#a3352a'), [0, 0, -1], sun, lk)); P(wallZ(RZ - 0.01, 3.4, RX - 0.4, 1.15, 3.9), lit(hex(ruin ? '#b5a58c' : '#a3352a'), [0, 0, -1], sun, lk));
  // roof: dark timber ceiling with the compluvium opening (or open sky when ruined)
  if (!ruin) {
    const cc = mulc(hex('#3b2a20'), lk.light * 0.8 * amb);
    P([[-RX, RH, -2], [RX, RH, -2], [RX, RH, IMP[2] - 0.2], [-RX, RH, IMP[2] - 0.2]], cc); P([[-RX, RH, IMP[3] + 0.2], [RX, RH, IMP[3] + 0.2], [RX, RH, RZ], [-RX, RH, RZ]], cc);
    P([[-RX, RH, IMP[2] - 0.2], [IMP[0] - 0.2, RH, IMP[2] - 0.2], [IMP[0] - 0.2, RH, IMP[3] + 0.2], [-RX, RH, IMP[3] + 0.2]], cc); P([[IMP[1] + 0.2, RH, IMP[2] - 0.2], [RX, RH, IMP[2] - 0.2], [RX, RH, IMP[3] + 0.2], [IMP[1] + 0.2, RH, IMP[3] + 0.2]], cc);
    ctx.strokeStyle = css(mulc(hex('#22170f'), amb), 0.8); ctx.lineWidth = 3; ctx.beginPath(); for (let z = -2; z < RZ; z += 1.2) { const a = cam.proj([-RX, RH - 0.05, z]), b = cam.proj([RX, RH - 0.05, z]); if (a && b) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); } } ctx.stroke();
    // shaft of light through the compluvium
    if (!night) { const a = cam.proj([0, RH, 7]), b = cam.proj([0, 0, 7.3]); if (a && b) rays(ctx, a[0], a[1], (b[1] - a[1]) * 1.05, 0.35, 0.18 * lk.light, mulc(lk.sun, 1), 6, t); }
  }
  // people
  const ppl = (st.people || []).slice().sort((a, b) => b.z - a.z);
  for (const p of ppl) { const sp = cam.proj([p.x, 0, p.z]); if (!sp || sp[2] < 0.8) continue; const hpx = cam.scaleAt([p.x, 0, p.z]) * p.spec.h; drawFigure(ctx, sp[0], sp[1], hpx, night ? { ...p.spec } : p.spec, p); if (night) { ctx.save(); ctx.globalAlpha = 0.35; drawFigure(ctx, sp[0], sp[1], hpx, { ...p.spec, tunic: '#1a1410', skin: '#1a1410', hair: '#1a1410', cloak: p.spec.cloak && '#1a1410', palla: p.spec.palla && '#1a1410', belt: null }, { ...p, detail: 0 }); ctx.restore(); } }
  // oil lamp on a stand (night)
  if (night) {
    const lp = cam.proj([-2.8, 1.35, 4]); if (lp) { const s = cam.scaleAt([-2.8, 1.3, 4]); ctx.fillStyle = '#3a2a1c'; ctx.fillRect(lp[0] - s * 0.03, lp[1], s * 0.06, s * 1.35); glow(ctx, lp[0], lp[1] - s * 0.05, s * 4.5 * (0.9 + 0.1 * Math.sin(t * 9)), t, 1); }
    ctx.fillStyle = `rgba(8,5,3,${0.25 * night})`; ctx.fillRect(0, 0, W, H);
  }
  if (st.ashFall) { const a = cam.proj([0, RH, 7]); if (a) fall(ctx, W, H, t, { kind: 'pumice', density: st.ashFall, wind: 10, groundY: () => H * 0.8 }); }
  if (st.dust) for (let i = 0; i < 30; i++) { const x = W * h01(i, 4), per = 1.2 + h01(i, 5), ph = ((t + h01(i, 6) * per) % per) / per; ctx.fillStyle = `rgba(200,185,160,${0.5 * st.dust * (1 - ph)})`; ctx.fillRect(x, ph * H * 0.7, 2, 6 + ph * 18); }
}
