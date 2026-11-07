// figures.js: painted Roman figures. The four recurring characters are FICTIONAL (identity-locked
// below; docs/C_characters.md is the written model sheet). Crowd figures are seeded variations.
// drawFigure(ctx, x, y, hPx, spec, pose): feet at (x, y), hPx = on-screen height of a standing figure.
import { hex, css, mixc, mulc, h01, clamp } from './util.js';

const TAU = Math.PI * 2;

export const CHAR = {
  marcus: { name: 'Marcus', skin: '#b5815f', hair: '#261a14', hairStyle: 'short', beard: 'trim', tunic: '#e4d9c0',
    cloak: '#7b5639', cloakStyle: 'shoulder', belt: '#4f3826', length: 'knee', h: 1.76, build: 1.06, sandal: '#5a3b26' },
  livia: { name: 'Livia', skin: '#c08c69', hair: '#22160f', hairStyle: 'braid', tunic: '#a8624a', under: '#d8c7aa',
    length: 'ankle', palla: '#8e5040', h: 1.64, build: 0.9, female: true, sandal: '#6a4630' },
  julia: { name: 'Julia', skin: '#c79873', hair: '#2a1b12', hairStyle: 'curly', tunic: '#efe6d2', belt: '#b9a37c',
    length: 'knee', h: 1.3, build: 0.8, child: true, sandal: '#7a5236' },
  gaius: { name: 'Gaius', skin: '#a77a5b', hair: '#c3bcb2', hairStyle: 'grey', beard: 'stubble', tunic: '#86684b',
    belt: '#4a3a2c', length: 'knee', h: 1.7, build: 0.95, stoop: 0.07, lines: true, sandal: '#4f3a2a', staff: true },
};

const DYES = ['#e6dcc6', '#d9cfb8', '#b5643f', '#9a4a36', '#c79a4a', '#6f7d5a', '#5d6f86', '#8a6a4c', '#a88a62', '#7a5a7a', '#cbbf9e', '#8f3d2e'];
const SKINS = ['#b5815f', '#c08c69', '#a77a5b', '#9a6e50', '#c99a75', '#8e6448'];
const HAIRS = ['#1e1510', '#2a1d16', '#3a2a1e', '#4a3526', '#7a7068', '#b5aea4'];
export function crowdSpec(i, seed = 1) {
  const r = (k) => h01(i * 31 + k, seed);
  const female = r(1) < 0.45, child = r(2) < 0.12;
  return {
    skin: SKINS[(r(3) * SKINS.length) | 0], hair: HAIRS[(r(4) * (child ? 4 : HAIRS.length)) | 0],
    hairStyle: female ? (r(5) < 0.5 ? 'braid' : 'veil') : (r(5) < 0.6 ? 'short' : 'short'),
    beard: !female && !child && r(6) < 0.45 ? 'trim' : null, tunic: DYES[(r(7) * DYES.length) | 0],
    cloak: !female && r(8) < 0.35 ? DYES[(r(9) * DYES.length) | 0] : null, cloakStyle: 'shoulder',
    palla: female && r(10) < 0.6 ? DYES[(r(11) * DYES.length) | 0] : null, veil: female && r(12) < 0.4,
    belt: '#4f3826', length: female ? 'ankle' : 'knee', female, child,
    h: child ? 1.2 + r(13) * 0.2 : (female ? 1.55 : 1.65) + r(14) * 0.15, build: 0.9 + r(15) * 0.2, sandal: '#4f3826',
    carry: r(16) < 0.25 ? (r(17) < 0.5 ? 'amphora' : 'basket') : null,
  };
}

const shade = (c, k) => css(mulc(hex(c), k));
const tint = (c, t, k) => css(mixc(hex(c), hex(t), k));

function limb(ctx, x0, y0, a1, l1, a2, l2, w1, w2, col) {
  // two-segment limb from (x0,y0); angles from straight down (radians, + = forward)
  const x1 = x0 + Math.sin(a1) * l1, y1 = y0 + Math.cos(a1) * l1;
  const x2 = x1 + Math.sin(a1 + a2) * l2, y2 = y1 + Math.cos(a1 + a2) * l2;
  const seg = (ax, ay, bx, by, wa, wb) => {
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    ctx.beginPath();
    ctx.moveTo(ax + nx * wa / 2, ay + ny * wa / 2); ctx.lineTo(bx + nx * wb / 2, by + ny * wb / 2);
    ctx.arc(bx, by, wb / 2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI);
    ctx.lineTo(ax - nx * wa / 2, ay - ny * wa / 2); ctx.arc(ax, ay, wa / 2, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI);
    ctx.fill();
  };
  ctx.fillStyle = col;
  seg(x0, y0, x1, y1, w1, w1 * 0.78); seg(x1, y1, x2, y2, w1 * 0.8, w2 * 0.7);
  return [x2, y2];
}

// pose: { view: 'front'|'3q'|'side'|'back', face: 1|-1, walk: 0..1, phase, armUp: [l, r] (0..1),
//         cover: 0..1 (cloth over the head), look: -1..1 (head turn), crouch: 0..1, detail: 0..1, alpha }
export function drawFigure(ctx, x, y, hPx, spec, pose = {}) {
  const view = pose.view || '3q', face = pose.face || 1, walk = pose.walk || 0, ph = pose.phase || 0;
  if (hPx < 3) return;
  const s = hPx / 100;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * face, s);
  if (pose.alpha !== undefined) ctx.globalAlpha = pose.alpha;
  const wf = { front: 1, back: 1, '3q': 0.82, side: 0.56 }[view];
  const side = view === 'side' || view === '3q';
  const child = spec.child, headR = child ? 8.6 : 6.9;
  const crouch = pose.crouch || 0;
  const bob = walk * Math.abs(Math.sin(ph * TAU)) * 1.6;
  const stoop = (spec.stoop || 0) + crouch * 0.25;
  const hipY = -50 + bob + crouch * 14, shY = (child ? -76 : -81) + bob + crouch * 18;
  const lean = stoop * 30 + walk * 2;
  const bw = 11 * wf * (spec.build || 1) * (spec.female ? 0.92 : 1);
  const long = spec.length === 'ankle';
  const detail = pose.detail ?? (hPx > 70 ? 1 : 0);
  const skin = spec.skin, dk = 0.72;
  // ---- legs (behind the garment)
  const sw = Math.sin(ph * TAU) * 0.5 * walk;
  const legs = [[sw, 1], [-sw, 0]];
  legs.forEach(([a, front]) => {
    const knee = Math.max(0, -Math.cos(ph * TAU + (front ? 0 : Math.PI))) * 0.7 * walk + crouch * 0.9;
    const ax = side ? a : 0, ox = side ? (front ? 1.5 : -1.5) : (front ? 4.5 : -4.5) * wf;
    const legc = spec.trousers || skin; const col = front ? legc : shade(legc, 0.8);
    const [fx, fy] = limb(ctx, ox + lean * 0.3, hipY, ax - crouch * 0.6, 26, -knee + crouch * 0.9, 24, 6.4, 4.6, col);
    ctx.fillStyle = spec.sandal || '#4f3826';
    ctx.beginPath(); ctx.ellipse(fx + (side ? 3 : 0), fy + 1, side ? 5.5 : 3.6, 2.2, 0, 0, TAU); ctx.fill();
  });
  // ---- back arm
  const armSw = -sw * 0.8;
  const up = pose.armUp || [0, 0];
  const cover = pose.cover || 0;
  const drawArm = (back) => {
    const raise = (back ? up[0] : up[1]) + cover * 0.9;
    const a1 = (back ? -armSw : armSw) * (1 - raise) + raise * (side ? 2.6 : 2.9) * (back ? 1 : 1);
    const a2 = -0.3 - raise * 1.2 - (spec.carry === 'basket' && !back ? 1.2 : 0);
    const ox = side ? (back ? -2 : 2) + lean * 0.5 : (back ? -bw - 1 : bw + 1);
    const col = back ? shade(skin, 0.78) : skin;
    const sleeve = back ? shade(spec.tunic, 0.8) : spec.tunic;
    ctx.save();
    if (!side) ctx.scale(back ? -1 : 1, 1);
    const ox2 = side ? ox : bw + 1;
    const end = limb(ctx, ox2, shY + 2, side ? a1 : a1 * 0.35 + raise * 0.3, 20, a2, 19, 5.2, 4.2, col);
    ctx.strokeStyle = sleeve; ctx.lineWidth = 7.5; ctx.beginPath(); ctx.moveTo(ox2, shY + 1);
    ctx.lineTo(ox2 + Math.sin(side ? a1 : a1 * 0.35 + raise * 0.3) * 9, shY + 2 + Math.cos(side ? a1 : a1 * 0.35 + raise * 0.3) * 9); ctx.stroke();
    ctx.restore();
    return end;
  };
  if (!long || true) drawArm(true);
  // ---- garment body
  const hem = long ? -4 : (child ? -26 : -24);
  const flare = long ? 1.35 : 1.15;
  const sway = Math.sin(ph * TAU) * 1.5 * walk;
  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-bw + lean * 0.6, shY);
    ctx.quadraticCurveTo(-bw * 1.08 + lean * 0.3, (shY + hipY) / 2, -bw * flare + sway, hem);
    ctx.quadraticCurveTo(sway * 0.5, hem + 2.5, bw * flare + sway, hem);
    ctx.quadraticCurveTo(bw * 1.08 + lean * 0.3, (shY + hipY) / 2, bw + lean * 0.6, shY);
    ctx.quadraticCurveTo(lean * 0.6, shY - 3, -bw + lean * 0.6, shY);
    ctx.closePath();
  };
  body();
  const g = ctx.createLinearGradient(-bw * 1.3, 0, bw * 1.3, 0);
  g.addColorStop(0, tint(spec.tunic, '#fff6e6', 0.12)); g.addColorStop(0.55, spec.tunic); g.addColorStop(1, shade(spec.tunic, dk));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(40,25,15,0.35)'; ctx.lineWidth = 0.9; ctx.stroke();
  if (detail) { // folds
    ctx.strokeStyle = shade(spec.tunic, 0.78); ctx.lineWidth = 1.1;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * bw * 0.28 + lean * 0.5, hipY + 2); ctx.quadraticCurveTo(i * bw * 0.36 + sway, (hipY + hem) / 2, i * bw * 0.42 + sway, hem - 1); ctx.stroke(); }
    if (long && spec.under) { ctx.fillStyle = spec.under; ctx.beginPath(); ctx.ellipse(sway, hem, bw * flare * 0.9, 2.2, 0, 0, Math.PI); ctx.fill(); }
  }
  // belt / girdle
  if (spec.belt) { ctx.fillStyle = spec.belt; ctx.fillRect(-bw * 1.02 + lean * 0.45, hipY - (long ? 22 : 4), bw * 2.04, 2.6); }
  // palla / cloak draped over the shoulder
  const drape = spec.cloak || spec.palla;
  if (drape) {
    ctx.fillStyle = drape;
    ctx.beginPath();
    ctx.moveTo(-bw * 1.05 + lean * 0.6, shY - 1);
    ctx.quadraticCurveTo(bw * 0.4, shY + 6, bw * 1.1 + lean * 0.4, (shY + hipY) / 2 + 10);
    ctx.lineTo(bw * 0.9 + sway, spec.palla ? hem - 10 : hipY + 8);
    ctx.quadraticCurveTo(-bw * 0.2, (shY + hipY) / 2 + 12, -bw * 1.1 + lean * 0.4, (shY + hipY) / 2 + 6);
    ctx.closePath(); ctx.fill();
    if (detail) { ctx.strokeStyle = shade(drape, 0.7); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-bw * 0.6, shY + 3); ctx.quadraticCurveTo(bw * 0.3, shY + 14, bw * 0.95, (shY + hipY) / 2 + 12); ctx.stroke(); }
  }
  // carried object
  if (spec.carry === 'amphora') {
    ctx.fillStyle = '#b06a42'; ctx.beginPath(); ctx.ellipse(bw * 0.9, shY - 6, 5, 9, 0.5, 0, TAU); ctx.fill();
  } else if (spec.carry === 'basket') {
    ctx.fillStyle = '#9a7a4a'; ctx.beginPath(); ctx.ellipse(bw * 1.4, hipY - 6, 7, 5, 0, 0, TAU); ctx.fill();
  }
  if (spec.staff) { ctx.strokeStyle = '#5a4532'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(bw * 1.7 + lean, shY + 26); ctx.lineTo(bw * 1.9 + lean * 0.4, 0); ctx.stroke(); }
  // ---- front arm
  drawArm(false);
  // ---- neck + head
  const hx = lean * 1.0 + (side ? 1.5 : 0) + (pose.look || 0) * 1.5, hy = shY - headR - 3 + crouch * 2;
  ctx.fillStyle = shade(skin, 0.85); ctx.fillRect(hx - 2.6, shY - 6, 5.2, 7);
  // head shape
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.ellipse(hx + (side ? 0.8 : 0), hy, headR * (view === 'side' ? 0.92 : 0.82), headR * 1.08, 0, 0, TAU); ctx.fill();
  // shading on the far side
  const fs = ctx.createLinearGradient(hx - headR, 0, hx + headR, 0);
  fs.addColorStop(0, 'rgba(0,0,0,0)'); fs.addColorStop(1, 'rgba(60,30,20,0.28)');
  ctx.fillStyle = fs; ctx.fill();
  const look = view === 'front' || view === 'back' ? (pose.look || 0) * 0.3 : view === '3q' ? 0.42 : 0.82;
  const fx = hx + look * headR * 0.75;
  if (view !== 'back' && detail) {
    // nose (side: profile bump)
    if (view === 'side' || view === '3q') {
      ctx.fillStyle = skin; ctx.beginPath(); ctx.moveTo(fx + headR * 0.42, hy - 2); ctx.lineTo(fx + headR * 0.62, hy + 2.2); ctx.lineTo(fx + headR * 0.36, hy + 2.6); ctx.fill();
    }
    ctx.strokeStyle = shade(skin, 0.6); ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(fx + 0.4, hy - 1); ctx.lineTo(fx + 1.2, hy + 2.4); ctx.stroke();
    // eyes + brows
    const eye = (ex, sc) => {
      ctx.fillStyle = '#efe6da'; ctx.beginPath(); ctx.ellipse(ex, hy - 1.6, 1.5 * sc, 0.9, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a1c14'; ctx.beginPath(); ctx.arc(ex + look * 0.5, hy - 1.6, 0.8, 0, TAU); ctx.fill();
      ctx.strokeStyle = spec.hairStyle === 'grey' ? '#8a8078' : shade(spec.hair, 1.1); ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(ex - 1.7 * sc, hy - 3.6); ctx.quadraticCurveTo(ex, hy - 4.4, ex + 1.7 * sc, hy - 3.8); ctx.stroke();
    };
    if (view === 'front') { eye(fx - 2.6, 1); eye(fx + 2.6, 1); }
    else if (view === '3q') { eye(fx - 1.6, 0.7); eye(fx + 2.6, 1); }
    else eye(fx + 2.4, 0.8);
    // mouth
    ctx.strokeStyle = shade(skin, 0.55); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(fx - (view === 'side' ? -1 : 1.8), hy + 4.4); ctx.lineTo(fx + 2.0, hy + 4.4); ctx.stroke();
    if (spec.lines) { ctx.strokeStyle = shade(skin, 0.7); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(fx - 3.4, hy - 5.6); ctx.lineTo(fx + 3, hy - 5.8); ctx.moveTo(fx + 3.6, hy + 1.8); ctx.lineTo(fx + 3.0, hy + 4.8); ctx.stroke(); }
  }
  // beard
  if (spec.beard && view !== 'back') {
    ctx.fillStyle = css(hex(spec.beard === 'stubble' ? '#8d857c' : spec.hair), spec.beard === 'stubble' ? 0.45 : 0.95);
    ctx.beginPath(); ctx.ellipse(hx + look * headR * 0.45, hy + headR * 0.55, headR * 0.72, headR * 0.5, 0, 0, Math.PI); ctx.fill();
  }
  // hair
  ctx.fillStyle = spec.hair;
  const hs = spec.hairStyle;
  if (hs === 'curly') {
    for (let i = 0; i < 14; i++) { const a = Math.PI * (1.05 + (i / 13) * 0.95), rr = headR * 1.02; ctx.beginPath(); ctx.arc(hx - look * 1.5 + Math.cos(a) * rr, hy - 1 + Math.sin(a) * rr, headR * 0.34, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(hx - headR * 0.6 - look * 2, hy + headR * 0.3, headR * 0.38, 0, TAU); ctx.fill();
  } else if (hs === 'braid' || hs === 'veil') {
    ctx.beginPath(); ctx.ellipse(hx - look * 1.2, hy - headR * 0.35, headR * 0.92, headR * 0.72, 0, Math.PI, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(hx - headR * (0.8 + look * 0.3), hy - headR * 0.1, headR * 0.45, 0, TAU); ctx.fill(); // bun / braid coil
    if (detail) { ctx.strokeStyle = shade(spec.hair, 1.7); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(hx - headR * (0.8 + look * 0.3), hy - headR * 0.1, headR * 0.3, 0, 4); ctx.stroke(); }
    if (hs === 'veil' || spec.veil) { ctx.fillStyle = spec.palla || '#cbbf9e'; ctx.beginPath(); ctx.ellipse(hx - look * 1.5, hy - headR * 0.2, headR * 1.1, headR * 1.05, 0, Math.PI * 0.95, TAU * 1.02); ctx.lineTo(hx - headR * 1.2, hy + headR * 1.6); ctx.closePath(); ctx.fill(); }
  } else {
    const grey = hs === 'grey';
    ctx.fillStyle = spec.hair;
    ctx.beginPath(); ctx.ellipse(hx - look * 1.6, hy - headR * 0.32, headR * (grey ? 0.86 : 0.9), headR * (grey ? 0.68 : 0.78), 0, Math.PI * 0.95, TAU * 1.01); ctx.fill();
    if (view !== 'front') { ctx.beginPath(); ctx.ellipse(hx - headR * 0.5 - look, hy - headR * 0.05, headR * 0.45, headR * 0.6, 0, 0, TAU); ctx.fill(); }
  }
  if (view === 'back' && hs !== 'veil') { ctx.fillStyle = spec.hair; ctx.beginPath(); ctx.ellipse(hx, hy - 0.5, headR * 0.86, headR * 1.0, 0, 0, TAU); ctx.fill(); if (hs === 'braid') { ctx.beginPath(); ctx.arc(hx, hy + headR * 0.1, headR * 0.5, 0, TAU); ctx.fill(); } }
  if (view !== 'front' && view !== 'back' && detail) { ctx.fillStyle = shade(skin, 0.85); ctx.beginPath(); ctx.ellipse(hx - headR * 0.15, hy + 0.5, 1.4, 2.2, 0, 0, TAU); ctx.fill(); } // ear
  // hats (excavation scenes: 18th-19th c. dress)
  if (spec.hat && view !== 'none') {
    ctx.fillStyle = spec.hatCol || '#1e1a18';
    if (spec.hat === 'tricorn') { ctx.beginPath(); ctx.moveTo(hx - headR * 1.5, hy - headR * 0.55); ctx.lineTo(hx, hy - headR * 1.65); ctx.lineTo(hx + headR * 1.5, hy - headR * 0.55); ctx.quadraticCurveTo(hx, hy - headR * 0.2, hx - headR * 1.5, hy - headR * 0.55); ctx.fill(); }
    else if (spec.hat === 'top') { ctx.fillRect(hx - headR * 0.75, hy - headR * 2.3, headR * 1.5, headR * 1.75); ctx.fillRect(hx - headR * 1.15, hy - headR * 0.65, headR * 2.3, headR * 0.22); }
    else { ctx.beginPath(); ctx.ellipse(hx, hy - headR * 0.6, headR * 1.7, headR * 0.3, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(hx, hy - headR * 0.85, headR * 0.85, headR * 0.6, 0, Math.PI, TAU); ctx.fill(); }
  }
  // tools (excavators)
  if (spec.tool === 'pick') { ctx.strokeStyle = '#5a4532'; ctx.lineWidth = 2.4; const ang = -0.9 + Math.sin((pose.phase || 0) * TAU) * 0.9; const ex = bw + 4, ey = shY + 14; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(ang) * 34, ey + Math.sin(ang) * 34); ctx.stroke(); ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.beginPath(); const hx2 = ex + Math.cos(ang) * 34, hy2 = ey + Math.sin(ang) * 34; ctx.moveTo(hx2 - Math.sin(ang) * 10, hy2 + Math.cos(ang) * 10); ctx.lineTo(hx2 + Math.sin(ang) * 10, hy2 - Math.cos(ang) * 10); ctx.stroke(); }
  if (spec.tool === 'basket') { ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.ellipse(hx + 2, hy - headR * 1.6, headR * 1.6, headR * 0.8, 0, 0, TAU); ctx.fill(); }
  // cloth pulled over the head (ash fall)
  if (cover > 0.05) {
    ctx.globalAlpha *= clamp(cover * 1.5);
    ctx.fillStyle = drape || '#b8ab90';
    ctx.beginPath(); ctx.ellipse(hx, hy - headR * 0.25, headR * 1.35, headR * 1.15, 0, Math.PI * 0.9, TAU * 1.05); ctx.lineTo(hx + headR * 1.4, hy + headR * 1.4); ctx.lineTo(hx - headR * 1.4, hy + headR * 1.6); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// A simplified silhouette for far crowds (cheap): body wedge + head dot, gently walking.
export function tinyFigure(ctx, x, y, hPx, col, ph, walk = 1) {
  if (hPx < 1.5) return;
  const s = hPx / 100, b = Math.abs(Math.sin(ph * TAU)) * 1.5 * walk;
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(x - 10 * s, y - 80 * s + b * s); ctx.lineTo(x + 10 * s, y - 80 * s + b * s); ctx.lineTo(x + 13 * s, y - 24 * s); ctx.lineTo(x - 13 * s, y - 24 * s); ctx.closePath(); ctx.fill();
  const sw = Math.sin(ph * TAU) * 7 * s * walk;
  ctx.fillRect(x - 6 * s + sw, y - 26 * s, 5 * s, 26 * s); ctx.fillRect(x + 1 * s - sw, y - 26 * s, 5 * s, 26 * s);
  ctx.beginPath(); ctx.arc(x, y - 89 * s + b * s, 7 * s, 0, TAU); ctx.fill();
}

// Excavation crews and visitors (18th-19th c.): coat colour as 'tunic', trousers, hats, tools.
export function digger(i, era = 1748) {
  const r = (k) => h01(i * 17 + k, era);
  const coats = era < 1800 ? ['#6a5440', '#7d3a2a', '#4a4a3e', '#8a7656', '#e1d6be'] : ['#e9e2d0', '#5a5048', '#3e3a36', '#8a7a62'];
  return { skin: SKINS[(r(1) * SKINS.length) | 0], hair: HAIRS[(r(2) * 4) | 0], hairStyle: 'short', tunic: coats[(r(3) * coats.length) | 0], trousers: r(4) < 0.5 ? '#5a4a3a' : '#e4dccb',
    length: 'knee', h: 1.62 + r(5) * 0.12, build: 1, sandal: '#2a2018', hat: era < 1800 ? (r(6) < 0.6 ? 'tricorn' : null) : (r(6) < 0.4 ? 'top' : 'straw'), hatCol: r(7) < 0.5 ? '#1e1a18' : '#c9b48a',
    tool: r(8) < 0.5 ? 'pick' : r(8) < 0.8 ? 'basket' : null, belt: null };
}
