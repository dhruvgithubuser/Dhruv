// map.js: parchment maps. Mediterranean / Italy from Natural Earth 10 m land (public domain, via the
// world-atlas package); the Bay of Naples is hand-plotted from modern coordinates with the coast near
// Pompeii pulled inland toward its approximate AD 79 position (label says "approximate").
import { hex, css, mixc, mulc, h01, clamp, smooth, lerp } from '../lib/util.js';

let LAND = null;
export function setLand(rings) { LAND = rings; }

const BAY = [[12.5, 42.5], [16.5, 42.5], [16.5, 40.0], [15.2, 40.2], [15.0, 40.42], [15.0, 40.6], [14.95, 40.67], [14.76, 40.675], [14.68, 40.645], [14.6, 40.633], [14.53, 40.63], [14.48, 40.628], [14.42, 40.605], [14.38, 40.59], [14.33, 40.578], [14.325, 40.573],
  [14.34, 40.6], [14.36, 40.618], [14.375, 40.627], [14.4, 40.637], [14.43, 40.66], [14.46, 40.685], [14.48, 40.7], [14.478, 40.715], [14.47, 40.735], [14.462, 40.744], [14.448, 40.753], [14.42, 40.765], [14.39, 40.778], [14.37, 40.79],
  [14.347, 40.805], [14.33, 40.815], [14.3, 40.83], [14.27, 40.838], [14.25, 40.836], [14.235, 40.828], [14.215, 40.823], [14.2, 40.81], [14.19, 40.796], [14.175, 40.8], [14.165, 40.808], [14.14, 40.818], [14.12, 40.823],
  [14.1, 40.818], [14.085, 40.812], [14.08, 40.8], [14.083, 40.788], [14.09, 40.778], [14.075, 40.785], [14.06, 40.8], [14.05, 40.82], [14.045, 40.84], [14.04, 40.86], [14.03, 40.9], [14.0, 40.96], [13.97, 41.0], [13.8, 41.15], [13.5, 41.22], [12.9, 41.4], [12.5, 41.6]];
const ISLES = [
  [[14.19, 40.555], [14.21, 40.562], [14.24, 40.56], [14.265, 40.552], [14.255, 40.543], [14.23, 40.538], [14.2, 40.542]],
  [[13.85, 40.73], [13.88, 40.755], [13.92, 40.76], [13.96, 40.745], [13.955, 40.715], [13.92, 40.7], [13.87, 40.705]],
  [[14.005, 40.76], [14.02, 40.77], [14.035, 40.762], [14.025, 40.752], [14.01, 40.752]],
];
export const PLACES = {
  Pompeii: [14.485, 40.749], Herculaneum: [14.348, 40.806], Oplontis: [14.452, 40.757], Stabiae: [14.495, 40.704], Misenum: [14.085, 40.779],
  Neapolis: [14.255, 40.85], Puteoli: [14.122, 40.822], Surrentum: [14.376, 40.626], Capreae: [14.23, 40.55], Nuceria: [14.65, 40.745], Vesuvius: [14.426, 40.821],
  Roma: [12.5, 41.9], Ostia: [12.29, 41.75], Alexandria: [29.92, 31.2], Carthago: [10.32, 36.85], Massalia: [5.37, 43.3], Syracusae: [15.29, 37.07], Athenae: [23.72, 37.98],
};

const PAPER = hex('#e9dcbc'), INK = hex('#4a3420'), SEA = hex('#9eb2b0');

// view: { c: [lon, lat], z: px per degree of longitude }
function projector(W, H, v) {
  const k = Math.cos((v.c[1] * Math.PI) / 180);
  return (lon, lat) => [W / 2 + (lon - v.c[0]) * v.z * k, H / 2 - (lat - v.c[1]) * v.z];
}

function ringPath(ctx, pr, ring) { ctx.moveTo(...pr(ring[0][0], ring[0][1])); for (let i = 1; i < ring.length; i++) ctx.lineTo(...pr(ring[i][0], ring[i][1])); ctx.closePath(); }

// st: { view, tone (0 day parchment .. 1 darkened), labels: [[name, a (0..1), opts]], routes: [[from, to, p]],
//       plume: p, pdc: { p, sites: [[name, p]] }, pins: [[name, p, col]], distance: [a, b, p, text], inset }
export function drawMap(ctx, W, H, t, st, F) {
  const v = st.view, pr = projector(W, H, v);
  const bay = smooth(220, 420, v.z);
  // sea with a soft vignette + ripple hatching
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 1.1);
  g.addColorStop(0, css(mixc(SEA, hex('#d8d6c4'), 0.25))); g.addColorStop(1, css(mulc(SEA, 0.78)));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(70,90,95,0.12)'; ctx.lineWidth = 1;
  for (let i = 0; i < 60; i++) { const y = (i / 60) * H + 8 * Math.sin(i); ctx.beginPath(); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y + 3 * Math.sin(x / 70 + i)); ctx.stroke(); }
  // land: coarse (Natural Earth) fading to the hand-plotted bay at close zoom
  const drawLand = (rings, alpha) => {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.beginPath(); rings.forEach((r) => ringPath(ctx, pr, r));
    ctx.strokeStyle = 'rgba(60,80,85,0.25)'; ctx.lineWidth = 14; ctx.stroke();         // coastal halo
    ctx.strokeStyle = 'rgba(60,80,85,0.18)'; ctx.lineWidth = 30; ctx.stroke();
    const lg = ctx.createLinearGradient(0, 0, W, H); lg.addColorStop(0, css(mixc(PAPER, hex('#f4ead0'), 0.4))); lg.addColorStop(1, css(mulc(PAPER, 0.92)));
    ctx.fillStyle = lg; ctx.fill('evenodd');
    ctx.strokeStyle = css(INK, 0.75); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  };
  if (LAND) drawLand(LAND, 1 - bay);
  drawLand([BAY, ...ISLES], bay);
  // relief: Apennine spine strokes (coarse), Lattari + Vesuvius cone (bay)
  ctx.save();
  if (bay < 1) {
    const spine = [[7.8, 44.2], [9.5, 44.4], [11.2, 44.0], [12.6, 43.2], [13.4, 42.4], [14.3, 41.7], [15.2, 40.9], [15.9, 40.2], [16.2, 39.3], [16.1, 38.4]];
    ctx.globalAlpha = 1 - bay; ctx.strokeStyle = css(INK, 0.35); ctx.lineWidth = 1.2;
    for (let i = 0; i < spine.length - 1; i++) for (let k = 0; k < 14; k++) {
      const u = k / 14, lon = lerp(spine[i][0], spine[i + 1][0], u), lat = lerp(spine[i][1], spine[i + 1][1], u); const [x, y] = pr(lon, lat);
      ctx.beginPath(); ctx.moveTo(x - 7, y + 4); ctx.lineTo(x, y - 6); ctx.lineTo(x + 7, y + 4); ctx.stroke();
    }
  }
  if (bay > 0) {
    ctx.globalAlpha = bay;
    for (let k = 0; k < 26; k++) { const lon = 14.38 + k * 0.012, lat = 40.645 + Math.sin(k * 0.7) * 0.006; const [x, y] = pr(lon, lat); const s = v.z / 900 * 10; ctx.strokeStyle = css(INK, 0.4); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.6); ctx.lineTo(x, y - s * 0.8); ctx.lineTo(x + s, y + s * 0.6); ctx.stroke(); }
    // Vesuvius: a shaded cone
    const [vx, vy] = pr(...PLACES.Vesuvius), R = v.z * 0.055;
    const cg = ctx.createRadialGradient(vx - R * 0.3, vy - R * 0.35, R * 0.05, vx, vy, R);
    cg.addColorStop(0, 'rgba(250,240,215,0.95)'); cg.addColorStop(0.5, 'rgba(176,150,112,0.85)'); cg.addColorStop(1, 'rgba(120,96,70,0)');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(vx, vy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = css(INK, 0.45); ctx.lineWidth = 1; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(vx + Math.cos(a) * R * 0.15, vy + Math.sin(a) * R * 0.15); ctx.lineTo(vx + Math.cos(a) * R * 0.75, vy + Math.sin(a) * R * 0.75); ctx.stroke(); }
    // the Sarno
    ctx.strokeStyle = 'rgba(80,110,125,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); [[14.466, 40.739], [14.5, 40.736], [14.54, 40.742], [14.58, 40.748], [14.62, 40.752], [14.66, 40.76]].forEach((p, i) => (i ? ctx.lineTo(...pr(...p)) : ctx.moveTo(...pr(...p)))); ctx.stroke();
  }
  ctx.restore();
  // plume: ash + pumice fall lobe toward the south-east
  if (st.plume) {
    const p = st.plume, [vx, vy] = pr(...PLACES.Vesuvius), [ex, ey] = pr(14.62, 40.6);
    const ang = Math.atan2(ey - vy, ex - vx), len = Math.hypot(ex - vx, ey - vy) * 1.25 * smooth(0, 1, p);
    for (const [w, a] of [[0.48, 0.18], [0.32, 0.22], [0.18, 0.3]]) {
      ctx.save(); ctx.translate(vx, vy); ctx.rotate(ang); ctx.fillStyle = `rgba(70,62,55,${a * Math.min(1, p * 2)})`;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(len * 0.3, -len * w * 0.6, len * 0.95, -len * w * 0.45, len, 0); ctx.bezierCurveTo(len * 0.95, len * w * 0.45, len * 0.3, len * w * 0.6, 0, 0); ctx.fill(); ctx.restore();
    }
    for (let i = 0; i < 60 * p; i++) { const u = h01(i, 4), w = (h01(i, 5) - 0.5) * 0.5 * u; const x = vx + Math.cos(ang) * len * u - Math.sin(ang) * len * w, y = vy + Math.sin(ang) * len * u + Math.cos(ang) * len * w; ctx.fillStyle = 'rgba(60,52,46,0.35)'; ctx.beginPath(); ctx.arc(x, y + ((t * 20 + i * 7) % 6), 1.6, 0, Math.PI * 2); ctx.fill(); }
  }
  // pyroclastic currents: expanding fronts toward named sites
  if (st.pdc) {
    const [vx, vy] = pr(...PLACES.Vesuvius);
    for (const [name, p, label] of st.pdc.sites) {
      if (p <= 0) continue;
      const [sx, sy] = pr(...PLACES[name]); const ang = Math.atan2(sy - vy, sx - vx), dist = Math.hypot(sx - vx, sy - vy) * 1.08;
      const r = dist * smooth(0, 1, p);
      ctx.save(); ctx.translate(vx, vy); ctx.rotate(ang);
      const gr = ctx.createLinearGradient(0, 0, r, 0); gr.addColorStop(0, 'rgba(120,70,40,0.15)'); gr.addColorStop(0.8, 'rgba(150,80,40,0.55)'); gr.addColorStop(1, 'rgba(190,90,40,0.8)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -0.32, 0.32); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(160,60,30,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r, -0.32, 0.32); ctx.stroke();
      ctx.restore();
      if (p > 0.95 && label) F.tag(ctx, sx, sy + 46, label, smooth(0.95, 1, p) * 1, '#7a2a14');
    }
  }
  // routes (dashed, drawing on)
  for (const [a, b, p] of st.routes || []) {
    if (p <= 0) continue;
    const A = pr(...PLACES[a]), B = pr(...PLACES[b]); const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2 - Math.hypot(B[0] - A[0], B[1] - A[1]) * 0.12;
    ctx.save(); ctx.strokeStyle = 'rgba(122,42,20,0.85)'; ctx.lineWidth = 2.6; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 30;
    ctx.beginPath(); const N = 40; for (let i = 0; i <= N * p; i++) { const u = i / N; const x = (1 - u) ** 2 * A[0] + 2 * (1 - u) * u * mx + u * u * B[0], y = (1 - u) ** 2 * A[1] + 2 * (1 - u) * u * my + u * u * B[1]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
  // distance line
  if (st.distance) { const [a, b, p, txt] = st.distance; const A = pr(...PLACES[a]), B = pr(...PLACES[b]); ctx.save(); ctx.strokeStyle = 'rgba(40,30,20,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(...A); ctx.lineTo(A[0] + (B[0] - A[0]) * p, A[1] + (B[1] - A[1]) * p); ctx.stroke(); ctx.restore(); if (p > 0.9) F.tag(ctx, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 26, txt, smooth(0.9, 1, p), '#2b1d12'); }
  // labels + pins
  for (const [name, a, o = {}] of st.labels || []) {
    if (a <= 0) continue; const [x, y] = pr(...(o.at || PLACES[name])); F.place(ctx, x, y, o.text || name, a, o);
  }
  for (const [name, p, colr] of st.pins || []) { if (p <= 0) continue; const [x, y] = pr(...PLACES[name]); F.pin(ctx, x, y, p, colr || '#9b2a1a'); }
  // compass rose + scale + cartouche
  F.compass(ctx, W - 150, H - 150, 62, st.compassA ?? 1, t);
  if (st.scale) { const km = st.scale, px = (km / (111.32 * Math.cos((v.c[1] * Math.PI) / 180))) * v.z * Math.cos((v.c[1] * Math.PI) / 180); F.scale(ctx, 110, H - 92, px, `${km} km`); }
  if (st.tone) { ctx.fillStyle = `rgba(30,20,12,${st.tone * 0.5})`; ctx.fillRect(0, 0, W, H); }
  st._pr = pr;
}
