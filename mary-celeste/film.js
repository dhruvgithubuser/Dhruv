// Mary Celeste का रहस्य: pure function of time. window.seek(t) paints frame t (see lib/motion.js).
// Timing is in beats (u) on the 90 bpm grid; docs/shotlist.md is the plan. Everything is drawn in
// code as illustration: nothing here pretends to be footage of the real ship.
// Hindi is laid out and animated by whole words (never per glyph: that would break the matras).
import * as M from './lib/motion.js';

const { W, H, FORMAT, E, prog, lerp, clamp, springU, SPRING, wobble, font, text, fill, rrect, bump, hash01, noise1, mulberry32 } = M;

const C = {
  ink: '#0A1622', night: '#0F2438', sea: '#12324A', deep: '#081521', fog: '#EDE3CC',
  paper: '#E6D8B8', paperInk: '#3B2E22', wood: '#24180F', woodHi: '#4A3524', amber: '#F2A93B', dim: '#8FA3B5',
};
const DISPLAY = 'Display', UI = 'UI';
const SAFE = FORMAT.safe;                 // 72,250 .. 1008,1490 on 9x16
const CX = W / 2;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- hits (sfx.mjs voices these)
const HITS = [
  [0, 'cold open', 'swell', { len: 0.6 }],
  [1, 'headline 1', 'pop', { pitch: 'D5', gain: 0.18 }],
  [2, 'headline 2', 'pop', { pitch: 'F5', gain: 0.18 }],
  [3, 'headline 3', 'pop', { pitch: 'A5', gain: 0.18 }],
  [7, 'crew gayab slam', 'thud', { gain: 0.5 }],
  [10.5, 'callout hull', 'tick'], [12, 'callout mast', 'tick'], [13.5, 'callout cargo', 'tick'],
  [16.5, 'fog wipe', 'whoosh', { len: 0.6, from: 300, to: 1200 }],
  [17, 'title', 'thud', { gain: 0.3 }],
  ...Array.from({ length: 10 }, (_, i) => [19 + i * 0.4, `figure ${i + 1} gone`, 'blip', { pitch: ['A5', 'G5', 'F5', 'E5', 'D5', 'C5', 'A4', 'G4', 'F4', 'D4'][i], gain: 0.16 }]),
  [23, 'map', 'whoosh', { len: 0.5, from: 1800, to: 500 }],
  [23.5, '1872 stamp', 'thud', { gain: 0.4 }],
  [26, 'route starts', 'click'],
  [31, '10 log', 'pop', { pitch: 'D5', gain: 0.2 }],
  [35, 'found marker', 'thud', { gain: 0.45 }],
  [39, 'to davits', 'whoosh', { len: 0.4, from: 600, to: 2000 }],
  [40.5, 'lifeboat gone', 'blip', { pitch: 'A4', gain: 0.15 }],
  [44, 'row 1', 'click'], [45, 'row 2', 'click'], [46.5, 'row 3', 'thud', { gain: 0.3 }], [47.5, 'row 4', 'thud', { gain: 0.3 }],
  [50.5, 'kyon', 'impact', { gain: 0.45 }],
  [54.5, 'theory 1', 'whoosh', { len: 0.5, from: 500, to: 2200 }],
  [61.5, 'theory 2', 'whoosh', { len: 0.5, from: 2200, to: 500 }],
  [70.5, 'theory 3', 'crash', { len: 1.2, gain: 0.18 }],
  [72.5, 'lightning', 'sub', { len: 1.2, gain: 0.4 }],
  [76.5, 'theory != proof', 'impact', { gain: 0.6 }],
  [81.5, 'cross 1', 'thud', { gain: 0.35 }], [82.5, 'cross 2', 'thud', { gain: 0.35 }], [83.5, 'cross 3', 'thud', { gain: 0.35 }],
  [88.5, 'ansuljha stamp', 'thud', { gain: 0.5 }],
  [93, 'cta', 'whoosh', { len: 0.4, from: 800, to: 2400 }],
  [95, 'opt A', 'pop', { pitch: 'D5', gain: 0.2 }], [95.75, 'opt B', 'pop', { pitch: 'E5', gain: 0.2 }],
  [96.5, 'opt C', 'pop', { pitch: 'F5', gain: 0.2 }], [97.25, 'opt D', 'pop', { pitch: 'A5', gain: 0.2 }],
  [98.5, 'comment bubble', 'bell', { pitch: 'D6', gain: 0.18 }],
];

// ---------------------------------------------------------------- data (loaded in init)
let VO = null, MAP = null, CAPS = [];

// ---------------------------------------------------------------- small helpers
const rgba = (hex, a) => { const [r, g, b] = M.hexRgb(hex); return `rgba(${r},${g},${b},${a})`; };
const sm = (x) => x * x * (3 - 2 * x);
const tri = (u, a, b, c) => (u < a || u > c ? 0 : u < b ? (u - a) / (b - a) : 1 - (u - b) / (c - b));
function withAlpha(ctx, a, fn) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }

// whole-word headline: words spring up from below a clip line, one after another
function headline(ctx, line, x, y, f, color, u, u0, step = 0.5, align = 'center', opts = {}) {
  ctx.font = f;
  const words = line.split(' ');
  const sp = ctx.measureText(' ').width;
  const ws = words.map((w) => ctx.measureText(w).width);
  const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const m = ctx.measureText('ज़Mg');
  const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
  const exit = opts.exit ? E.inCubic(prog(u, opts.exit, opts.exit + 0.6)) : 0;
  words.forEach((w, i) => {
    const k = springU(u, u0 + i * step, opts.spring || SPRING.snappy);
    if (k > 0.001) {
      ctx.save();
      ctx.beginPath(); ctx.rect(cx - 30, y - asc - 40, ws[i] + 60, asc + desc + 60); ctx.clip();
      const dy = (1 - k) * (asc + desc + 20) + exit * -(asc + desc + 40);
      ctx.fillStyle = (opts.colors && opts.colors[i]) || color;
      ctx.textAlign = 'left';
      ctx.fillText(w, cx, y + dy);
      ctx.restore();
    }
    cx += ws[i] + sp;
  });
  return total;
}

function wrap(ctx, str, f, maxW) {
  ctx.font = f;
  const words = str.split(' '); const lines = []; let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- captions (every spoken line)
const CAP_F = font(54, 600, UI);
function buildCaptions(ctx) {
  CAPS = [];
  for (const p of VO.phrases) {
    if (p.key) continue;               // key lines are already the headline on screen
    const lines = wrap(ctx, p.text, CAP_F, SAFE.w - 40);
    const pages = [];
    for (let i = 0; i < lines.length; i += 2) pages.push(lines.slice(i, i + 2));
    const chars = pages.map((pg) => pg.join(' ').length); const tot = chars.reduce((a, b) => a + b, 0);
    let a = p.u0;
    pages.forEach((pg, i) => {
      const b = i === pages.length - 1 ? p.u1 : a + (p.u1 - p.u0) * chars[i] / tot;
      CAPS.push({ u0: a, u1: b, lines: pg, k: p.k });
      a = b;
    });
  }
}
function captions(ctx, u) {
  const light = (u >= 23.25 && u < 39.25) || (u >= 76.75 && u < 80.5);
  for (let i = 0; i < CAPS.length; i++) {
    const c = CAPS[i];
    const next = CAPS[i + 1];
    const end = next ? Math.min(c.u1 + 0.6, next.u0 - 0.05) : c.u1 + 0.8;
    if (u < c.u0 - 0.15 || u > end + 0.2) continue;
    const kin = E.outCubic(prog(u, c.u0 - 0.15, c.u0 + 0.15));
    const kout = 1 - prog(u, end, end + 0.2);
    const a = Math.min(kin, kout);
    const lh = 66, base = SAFE.y + SAFE.h - 26 - (c.lines.length - 1) * lh;
    ctx.save();
    ctx.globalAlpha = a;
    // soft dark band for legibility over any scene
    const g = ctx.createLinearGradient(0, base - 120, 0, base + (c.lines.length - 1) * lh + 60);
    const bandC = light ? C.paper : C.deep;
    g.addColorStop(0, rgba(bandC, 0)); g.addColorStop(0.35, rgba(bandC, light ? 0.85 : 0.55)); g.addColorStop(1, rgba(bandC, 0.0));
    ctx.fillStyle = g; ctx.fillRect(0, base - 120, W, (c.lines.length - 1) * lh + 180);
    c.lines.forEach((ln, j) => {
      ctx.font = CAP_F; ctx.textAlign = 'center';
      ctx.lineWidth = 8; ctx.strokeStyle = light ? rgba(C.paper, 0.9) : rgba(C.deep, 0.85); ctx.lineJoin = 'round';
      const y = base + j * lh + (1 - kin) * 14;
      ctx.strokeText(ln, CX - 20, y);
      ctx.fillStyle = light ? C.paperInk : C.fog; ctx.fillText(ln, CX - 20, y);
    });
    ctx.restore();
  }
}

// ---------------------------------------------------------------- environment
function sky(ctx, u, { moonX = 760, moonY = 520, moonR = 70, top = C.deep, bottom = C.night, horizon = 1100, moon = 1 } = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, horizon + 4);
  // stars, seeded, a slow twinkle
  for (let i = 0; i < 70; i++) {
    const x = hash01(i, 11) * W, y = hash01(i, 12) * horizon * 0.8;
    const tw = 0.5 + 0.5 * Math.sin(u * 0.9 + i * 1.7);
    ctx.fillStyle = rgba(C.fog, 0.15 + 0.35 * tw * hash01(i, 13));
    ctx.fillRect(x, y, 2.2, 2.2);
  }
  if (moon > 0) {
    const h = ctx.createRadialGradient(moonX, moonY, moonR * 0.6, moonX, moonY, moonR * 4.5);
    h.addColorStop(0, rgba(C.fog, 0.22 * moon)); h.addColorStop(1, rgba(C.fog, 0));
    ctx.fillStyle = h; ctx.fillRect(0, 0, W, horizon);
    ctx.fillStyle = rgba(C.fog, 0.95 * moon); ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, TAU); ctx.fill();
    ctx.fillStyle = rgba(C.dim, 0.25 * moon);
    ctx.beginPath(); ctx.arc(moonX - moonR * 0.3, moonY - moonR * 0.2, moonR * 0.22, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(moonX + moonR * 0.35, moonY + moonR * 0.3, moonR * 0.14, 0, TAU); ctx.fill();
  }
}

function waveY(x, u, layer, amp, rough = 0) {
  const t = u * M.GRID.period;
  return amp * (Math.sin(x * 0.006 + t * (0.6 + layer * 0.15) + layer * 1.3) * 0.6 +
    Math.sin(x * 0.017 - t * (0.9 + layer * 0.2) + layer) * 0.3 +
    Math.sin(x * 0.041 + t * 1.7 + layer * 2.1) * 0.12 * (1 + rough * 2));
}
// layers 0..n from horizon (far) to bottom (near); `front` draws only the near layers
function sea(ctx, u, horizon, { rough = 0, layers = 6, from = 0, to = 6, moonX = 760, reflect = 1 } = {}) {
  for (let l = from; l < Math.min(to, layers); l++) {
    const f = l / (layers - 1);
    const y0 = lerp(horizon, H + 40, Math.pow(f, 1.6));
    const amp = lerp(4, 34, f) * (1 + rough * 2.2);
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = -20; x <= W + 20; x += 18) ctx.lineTo(x, y0 + waveY(x, u, l, amp, rough));
    ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = M.mix(C.sea, C.deep, f * 0.85);
    ctx.fill();
    // crest highlights
    ctx.strokeStyle = rgba(C.fog, 0.05 + 0.05 * (1 - f) + rough * 0.06); ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -20; x <= W + 20; x += 18) { const y = y0 + waveY(x, u, l, amp, rough); x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    // moon path glints
    if (reflect > 0) {
      for (let i = 0; i < 6; i++) {
        const gx = moonX + (hash01(l * 9 + i, 3) - 0.5) * lerp(60, 260, f) + Math.sin(u * 0.7 + i + l) * 12;
        const gy = y0 + waveY(gx, u, l, amp, rough) + 6;
        ctx.fillStyle = rgba(C.fog, (0.25 - f * 0.15) * reflect * (0.5 + 0.5 * Math.sin(u * 1.3 + i * 2 + l)));
        ctx.fillRect(gx - lerp(10, 40, f) / 2, gy, lerp(10, 40, f), 3);
      }
    }
  }
}

function fogBank(ctx, u, density = 1, y = 1000, color = C.fog, seed = 1) {
  if (density <= 0) return;
  for (let i = 0; i < 7; i++) {
    const r = 380 + hash01(i, seed) * 420;
    const x = ((hash01(i, seed + 1) * (W + 800) + u * (8 + 10 * hash01(i, seed + 2))) % (W + 800)) - 400;
    const yy = y + (hash01(i, seed + 3) - 0.5) * 520;
    const g = ctx.createRadialGradient(x, yy, 0, x, yy, r);
    g.addColorStop(0, rgba(color, 0.13 * density)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, yy - r, r * 2, r * 2);
  }
}

function vignette(ctx, a = 0.6) {
  const g = ctx.createRadialGradient(CX, H * 0.45, H * 0.25, CX, H * 0.5, H * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- the ship (illustration, side view, bow right)
function sail(ctx, pts, belly, shade = 0) {
  // pts: [tl, tr, br, bl]; belly pushes the leech/foot outward (wind from behind)
  const [a, b, c, d] = pts;
  ctx.beginPath(); ctx.moveTo(...a);
  ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 6, ...b);
  ctx.quadraticCurveTo((b[0] + c[0]) / 2 + belly, (b[1] + c[1]) / 2, ...c);
  ctx.quadraticCurveTo((c[0] + d[0]) / 2 + belly * 0.4, (c[1] + d[1]) / 2 + belly * 0.5, ...d);
  ctx.quadraticCurveTo((d[0] + a[0]) / 2 + belly * 0.6, (d[1] + a[1]) / 2, ...a);
  ctx.closePath();
  const g = ctx.createLinearGradient(a[0], a[1], c[0], c[1]);
  g.addColorStop(0, M.mix(C.fog, C.dim, 0.15 + shade)); g.addColorStop(1, M.mix(C.fog, C.dim, 0.55 + shade));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = rgba(C.deep, 0.35); ctx.lineWidth = 1.5; ctx.stroke();
}

function ship(ctx, u, x, y, s, { roll = 0, lanternOn = 1, silhouette = 0, name = true, sails = 1 } = {}) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(roll); ctx.scale(s, s);
  const sil = silhouette;
  const wood = M.mix(C.wood, C.deep, sil), woodHi = M.mix(C.woodHi, C.deep, sil);
  const line = rgba(sil > 0.5 ? C.deep : '#120C08', 0.9);
  // masts + spars
  ctx.strokeStyle = M.mix('#2E2116', C.deep, sil); ctx.lineCap = 'round';
  const masts = [[150, -560], [-90, -600]];
  ctx.lineWidth = 12; masts.forEach(([mx, my]) => { ctx.beginPath(); ctx.moveTo(mx, -60); ctx.lineTo(mx, my); ctx.stroke(); });
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(300, -82); ctx.lineTo(450, -150); ctx.stroke();      // bowsprit
  // rigging
  ctx.strokeStyle = rgba(sil > 0.5 ? C.deep : '#1A120C', 0.75); ctx.lineWidth = 2;
  [[150, -560, 450, -150], [150, -560, 290, -80], [-90, -600, 150, -560], [-90, -600, -290, -75], [150, -560, 40, -70], [-90, -600, -200, -70],
    [150, -560, 250, -75], [-90, -600, 10, -70]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); });
  if (sails > 0) {
    ctx.save(); ctx.globalAlpha *= sails * (1 - sil * 0.55);
    const flap = Math.sin(u * 1.6) * 3;
    // foremast square sails (the lower course half-furled: nobody trimmed it)
    sail(ctx, [[70, -470], [230, -470], [215, -400], [85, -400]], 10 + flap, 0.05);
    sail(ctx, [[55, -385], [245, -385], [235, -295], [65, -295]], 14 + flap, 0.0);
    sail(ctx, [[40, -280], [260, -280], [250, -225], [50, -225]], 8 + flap, 0.1);
    // jibs
    sail(ctx, [[160, -520], [160, -520], [440, -150], [175, -120]], 6, 0.05);
    sail(ctx, [[160, -440], [160, -440], [360, -118], [180, -100]], 5, 0.1);
    // main: gaff sail + topsail
    sail(ctx, [[-95, -520], [-95, -520], [-90, -110], [-300, -120]], -10 - flap, 0.0);
    sail(ctx, [[-95, -560], [-95, -560], [-95, -510], [-210, -505]], -4, 0.1);
    // yards
    ctx.strokeStyle = M.mix('#2E2116', C.deep, sil); ctx.lineWidth = 5;
    [[60, 250, -472], [45, 255, -387], [30, 270, -282]].forEach(([a, b, yy]) => { ctx.beginPath(); ctx.moveTo(a, yy); ctx.lineTo(b, yy); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(-90, -110); ctx.lineTo(-310, -122); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-90, -500); ctx.lineTo(-300, -470); ctx.stroke();
    ctx.restore();
  }
  // hull
  ctx.beginPath();
  ctx.moveTo(-300, -78);
  ctx.quadraticCurveTo(0, -58, 300, -88);
  ctx.quadraticCurveTo(318, -60, 270, 12);
  ctx.lineTo(-250, 12);
  ctx.quadraticCurveTo(-290, -20, -300, -78);
  ctx.closePath();
  const hg = ctx.createLinearGradient(0, -90, 0, 12);
  hg.addColorStop(0, woodHi); hg.addColorStop(1, wood);
  ctx.fillStyle = hg; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = 3; ctx.stroke();
  // wale + rail
  ctx.strokeStyle = M.mix('#6B4E33', C.deep, sil); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-292, -50); ctx.quadraticCurveTo(0, -32, 296, -60); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-300, -92); ctx.quadraticCurveTo(0, -72, 300, -102); ctx.stroke();
  for (let i = 0; i < 22; i++) { const xx = -290 + i * 27; const yy = -86 + 0.00011 * xx * xx - 0.03 * xx; ctx.beginPath(); ctx.moveTo(xx, yy + 10); ctx.lineTo(xx, yy - 6); ctx.stroke(); }
  // deckhouse
  ctx.fillStyle = M.mix('#3A2A1C', C.deep, sil); ctx.fillRect(-40, -112, 120, 40);
  ctx.fillStyle = M.mix('#1C130C', C.deep, sil); ctx.fillRect(-25, -102, 18, 16); ctx.fillRect(10, -102, 18, 16); ctx.fillRect(45, -102, 18, 16);
  if (name && sil < 0.5) { ctx.font = font(15, 700, UI); ctx.fillStyle = rgba(C.fog, 0.55); ctx.textAlign = 'center'; ctx.fillText('MARY CELESTE', -170, -16); }
  // stern lantern
  if (lanternOn > 0) {
    const sw = Math.sin(u * 1.4) * 0.25;
    const lx = -285 + Math.sin(sw) * 26, ly = -128 + Math.cos(sw) * 26 - 26;
    const flick = 0.85 + 0.15 * noise1(u * 3, 7);
    const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, 120);
    g.addColorStop(0, rgba(C.amber, 0.5 * lanternOn * flick)); g.addColorStop(1, rgba(C.amber, 0));
    ctx.fillStyle = g; ctx.fillRect(lx - 120, ly - 120, 240, 240);
    ctx.strokeStyle = '#120C08'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-285, -154); ctx.lineTo(lx, ly - 8); ctx.stroke();
    ctx.fillStyle = M.mix('#120C08', C.amber, 0.9 * lanternOn * flick); rrect(ctx, lx - 8, ly - 10, 16, 22, 4); ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- small illustrations
function figure(ctx, x, y, s, color, cap = false) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y - 58 * s, 13 * s, 0, TAU); ctx.fill();
  rrect(ctx, x - 16 * s, y - 42 * s, 32 * s, 42 * s, 14 * s); ctx.fill();
  if (cap) { ctx.fillRect(x - 15 * s, y - 72 * s, 30 * s, 6 * s); ctx.fillRect(x - 9 * s, y - 80 * s, 18 * s, 9 * s); }
}

function lifeboat(ctx, u, x, y, s, { people = 0, color = C.wood, rowing = 0, line = false } = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (people > 0) {
    for (let i = 0; i < people; i++) {
      const px = -90 + i * (180 / Math.max(1, people - 1));
      const lean = rowing ? Math.sin(u * Math.PI + i * 0.4) * 6 : 0;
      ctx.save(); ctx.translate(px + lean, -18);
      figure(ctx, 0, 0, 0.75, line ? C.paperInk : M.mix(C.deep, '#000', 0.2), i === people - 1);
      ctx.restore();
      if (rowing && i % 2 === 0) {
        const a = Math.sin(u * Math.PI + i * 0.4) * 0.5;
        ctx.strokeStyle = line ? C.paperInk : '#1A120C'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(px, -40); ctx.lineTo(px - 70 * Math.cos(a), 40 + 20 * Math.sin(a)); ctx.stroke();
      }
    }
  }
  ctx.beginPath();
  ctx.moveTo(-150, -22); ctx.lineTo(150, -28);
  ctx.quadraticCurveTo(140, 20, 100, 24); ctx.lineTo(-110, 24);
  ctx.quadraticCurveTo(-150, 15, -150, -22); ctx.closePath();
  if (line) { ctx.strokeStyle = C.paperInk; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.stroke(); }
  else { ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#120C08'; ctx.lineWidth = 2.5; ctx.stroke(); }
  ctx.restore();
}

function barrel(ctx, x, y, s, fillC = '#5A3E26', hoop = '#2A1B10') {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-50, -70); ctx.quadraticCurveTo(-64, 0, -50, 70); ctx.lineTo(50, 70); ctx.quadraticCurveTo(64, 0, 50, -70); ctx.closePath();
  const g = ctx.createLinearGradient(-60, 0, 60, 0);
  g.addColorStop(0, M.mix(fillC, '#000', 0.4)); g.addColorStop(0.45, fillC); g.addColorStop(1, M.mix(fillC, '#000', 0.5));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = hoop; ctx.lineWidth = 7;
  [-48, -30, 30, 48].forEach((yy) => { const w = 52 + 10 * Math.cos(yy / 70 * 1.4); ctx.beginPath(); ctx.moveTo(-w, yy); ctx.quadraticCurveTo(0, yy + 8, w, yy); ctx.stroke(); });
  ctx.fillStyle = M.mix(fillC, '#000', 0.25); ctx.beginPath(); ctx.ellipse(0, -70, 50, 12, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

function cloud(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  [[-40, 0, 38], [0, -20, 48], [42, -4, 36], [70, 14, 26], [-70, 16, 26]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(x + a * s, y + b * s, r * s, 0, TAU); ctx.fill(); });
  ctx.fillRect(x - 70 * s, y + 10 * s, 140 * s, 30 * s);
}
function bolt(ctx, x, y, s, color) {
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(x + 10 * s, y); ctx.lineTo(x - 22 * s, y + 52 * s); ctx.lineTo(x + 2 * s, y + 52 * s);
  ctx.lineTo(x - 12 * s, y + 98 * s); ctx.lineTo(x + 30 * s, y + 38 * s); ctx.lineTo(x + 6 * s, y + 38 * s); ctx.lineTo(x + 22 * s, y);
  ctx.closePath(); ctx.fill();
}
function tickMark(ctx, x, y, s, color, k = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = 9 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pts = [[-14, 0], [-3, 12], [18, -14]];
  ctx.beginPath(); ctx.moveTo(x + pts[0][0] * s, y + pts[0][1] * s);
  const k1 = clamp(k * 2), k2 = clamp(k * 2 - 1);
  ctx.lineTo(x + lerp(pts[0][0], pts[1][0], k1) * s, y + lerp(pts[0][1], pts[1][1], k1) * s);
  if (k2 > 0) ctx.lineTo(x + lerp(pts[1][0], pts[2][0], k2) * s, y + lerp(pts[1][1], pts[2][1], k2) * s);
  ctx.stroke();
}
function crossMark(ctx, x, y, s, color, k = 1, lw = 10) {
  ctx.strokeStyle = color; ctx.lineWidth = lw * s; ctx.lineCap = 'round';
  const k1 = clamp(k * 2), k2 = clamp(k * 2 - 1);
  ctx.beginPath(); ctx.moveTo(x - 16 * s, y - 16 * s); ctx.lineTo(x + lerp(-16, 16, k1) * s, y + lerp(-16, 16, k1) * s); ctx.stroke();
  if (k2 > 0) { ctx.beginPath(); ctx.moveTo(x + 16 * s, y - 16 * s); ctx.lineTo(x + lerp(16, -16, k2) * s, y + lerp(-16, 16, k2) * s); ctx.stroke(); }
}

// ---------------------------------------------------------------- scenes
// S1 (u 0-7) the ship drifts in out of the fog
function sShipHook(ctx, u) {
  const z = 1.0 * Math.pow(1.12, prog(u, 0, 7));          // log push
  ctx.save(); M.zoomAbout(ctx, z, CX, 1300);
  sky(ctx, u, { moonX: 830, moonY: 820, moonR: 60, horizon: 1300 });
  sea(ctx, u, 1300, { to: 3, moonX: 830 });
  const bob = Math.sin(u * 0.9) * 8;
  ship(ctx, u, lerp(480, 540, E.outCubic(prog(u, -1, 7))), 1330 + bob, 0.86, { roll: Math.sin(u * 0.7) * 0.03 });
  sea(ctx, u, 1300, { from: 3, moonX: 830 });
  fogBank(ctx, u, 1.4 - 0.5 * prog(u, 0, 4), 1330, C.fog, 3);
  ctx.restore();
  // headline
  const f = font(104, 400, DISPLAY);
  headline(ctx, 'समुद्र में मिला', CX, 420, f, C.fog, u, -0.25, 0.45);
  headline(ctx, 'जहाज़', CX, 560, font(140, 400, DISPLAY), C.fog, u, 1.0, 0.45);
  headline(ctx, 'सामान मौजूद…', CX, 680, font(66, 600, UI), C.amber, u, 2.5, 0.45);
  withAlpha(ctx, prog(u, 1, 2) * (1 - prog(u, 6.3, 6.8)), () => text(ctx, 'सांकेतिक चित्रण', SAFE.x + 10, SAFE.y + 10, font(30, 500, UI), rgba(C.fog, 0.55)));
  // the music drops out before the slam: let the frame dim with it
  withAlpha(ctx, prog(u, 6.0, 6.9) * 0.55, () => fill(ctx, C.deep));
}

// S2 (u 7-9.5) empty deck, the wheel turning on its own
function deck(ctx, u, { wheelRot = 0, lantern = 1, zoom = 1 } = {}) {
  ctx.save(); M.zoomAbout(ctx, zoom, CX, 1100);
  sky(ctx, u, { moonX: 260, moonY: 420, moonR: 50, horizon: 900 });
  sea(ctx, u, 900, { to: 2, moonX: 260, reflect: 0.6 });
  fogBank(ctx, u, 1.2, 860, C.fog, 9);
  // rail
  ctx.fillStyle = C.wood; ctx.fillRect(0, 880, W, 40);
  for (let i = 0; i < 14; i++) ctx.fillRect(i * 80 + 10, 920, 14, 70);
  // planks in perspective toward vp
  const vpX = CX, vpY = 760;
  ctx.fillStyle = '#2B1D13'; ctx.beginPath(); ctx.moveTo(0, 990); ctx.lineTo(W, 990); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1A110A'; ctx.lineWidth = 3;
  for (let i = -12; i <= 12; i++) {
    const xb = CX + i * 140; const t = (990 - vpY) / (H - vpY);
    ctx.beginPath(); ctx.moveTo(lerp(vpX, xb, t), 990); ctx.lineTo(xb, H); ctx.stroke();
  }
  for (let j = 0; j < 9; j++) { const y = 990 + Math.pow(j / 8, 1.8) * (H - 990); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); ctx.globalAlpha = 1; }
  // mast base + coiled rope
  ctx.fillStyle = '#3A281A'; ctx.fillRect(110, 300, 60, 760);
  ctx.strokeStyle = '#8A7350'; ctx.lineWidth = 7;
  for (let r = 0; r < 4; r++) { ctx.beginPath(); ctx.ellipse(250, 1170, 70 - r * 14, 22 - r * 4, 0, 0, TAU); ctx.stroke(); }
  // the wheel
  const wx = 600, wy = 1180, R = 210;
  ctx.fillStyle = '#20150D'; ctx.fillRect(wx - 30, wy, 60, 330);
  ctx.save(); ctx.translate(wx, wy); ctx.rotate(wheelRot);
  ctx.strokeStyle = '#5A3E26'; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
  ctx.strokeStyle = '#3A281A'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, R - 14, 0, TAU); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8;
    ctx.strokeStyle = '#4A3320'; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * (R + 70), Math.sin(a) * (R + 70)); ctx.stroke();
    ctx.fillStyle = '#5A3E26'; ctx.beginPath(); ctx.arc(Math.cos(a) * (R + 72), Math.sin(a) * (R + 72), 13, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = '#6B4E33'; ctx.beginPath(); ctx.arc(0, 0, 42, 0, TAU); ctx.fill();
  ctx.restore();
  // hanging lantern, swinging
  if (lantern > 0) {
    const sw = Math.sin(u * 1.2) * 0.3, lx = 880 + Math.sin(sw) * 160, ly = 260 + Math.cos(sw) * 160;
    ctx.strokeStyle = '#120C08'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(880, 260); ctx.lineTo(lx, ly); ctx.stroke();
    const g = ctx.createRadialGradient(lx, ly + 20, 4, lx, ly + 20, 260);
    g.addColorStop(0, rgba(C.amber, 0.45 * lantern)); g.addColorStop(1, rgba(C.amber, 0));
    ctx.fillStyle = g; ctx.fillRect(lx - 260, ly - 240, 520, 520);
    ctx.fillStyle = '#1A120C'; rrect(ctx, lx - 22, ly, 44, 56, 8); ctx.fill();
    ctx.fillStyle = M.mix('#1A120C', C.amber, 0.85 * (0.85 + 0.15 * noise1(u * 3, 2))); rrect(ctx, lx - 14, ly + 10, 28, 36, 5); ctx.fill();
  }
  ctx.restore();
}
function sCrewGone(ctx, u) {
  const k = springU(u, 7, SPRING.snappy);
  deck(ctx, u, { wheelRot: 0.4 * Math.sin((u - 7) * 0.6) + (u - 7) * 0.12, zoom: lerp(1.15, 1.0, E.outCubic(prog(u, 7, 9.5))) });
  withAlpha(ctx, 0.45, () => fill(ctx, C.deep));
  ctx.save();
  M.shake(ctx, u, 7, 14);
  const s = lerp(1.6, 1, k);
  ctx.translate(CX, 560); ctx.scale(s, s);
  withAlpha(ctx, clamp(k * 1.5), () => {
    text(ctx, 'पूरा crew', 0, -40, font(120, 400, DISPLAY), C.fog, 'center');
    text(ctx, 'गायब', 0, 130, font(210, 400, DISPLAY), C.amber, 'center');
  });
  ctx.restore();
}

// S3 (u 9.5-17) the ship is intact: callouts
function sIntact(ctx, u) {
  const z = Math.pow(0.88, prog(u, 9.5, 17));
  ctx.save(); M.zoomAbout(ctx, z * 1.05, CX, 1000);
  sky(ctx, u, { moonX: 200, moonY: 700, moonR: 55, horizon: 1220 });
  sea(ctx, u, 1220, { to: 3, moonX: 200 });
  const sx = 560, sy = 1250 + Math.sin(u * 0.9) * 6, sc = 0.88;
  ship(ctx, u, sx, sy, sc, { roll: Math.sin(u * 0.7) * 0.025 });
  sea(ctx, u, 1220, { from: 3, moonX: 200 });
  ctx.restore();
  // callouts: anchor point on the ship (screen space approx), label box
  const calls = [
    [10.5, 'पतवार ठीक', sx + 60, sy - 35, 790, 1210],
    [12, 'मस्तूल ठीक', sx - 80, sy - 420, 250, 700],
    [13.5, 'सामान मौजूद', sx - 20, sy - 80, 260, 1150],
  ];
  for (const [u0, label, ax, ay, lx, ly] of calls) {
    const k = E.outCubic(prog(u, u0, u0 + 0.6)), kt = springU(u, u0 + 0.3, SPRING.snappy);
    const out = 1 - prog(u, 15.6, 16.2);
    if (k <= 0) continue;
    withAlpha(ctx, out, () => {
      ctx.strokeStyle = C.amber; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lerp(ax, lx, k), lerp(ay, ly, k)); ctx.stroke();
      ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(ax, ay, 9, 0, TAU); ctx.fill();
      if (kt > 0.01) {
        ctx.font = font(50, 700, UI); const w = ctx.measureText(label).width + 110;
        const bx = clamp(lx - w / 2, SAFE.x, SAFE.x + SAFE.w - w);
        ctx.save(); ctx.translate(bx + w / 2, ly); ctx.scale(kt, kt);
        rrect(ctx, -w / 2, -42, w, 84, 42); ctx.fillStyle = rgba(C.deep, 0.85); ctx.fill();
        ctx.strokeStyle = C.amber; ctx.lineWidth = 2.5; ctx.stroke();
        tickMark(ctx, -w / 2 + 44, 0, 1.2, C.amber, prog(u, u0 + 0.4, u0 + 0.9));
        text(ctx, label, -w / 2 + 80, 17, font(50, 700, UI), C.fog);
        ctx.restore();
      }
    });
  }
  // "and the mystery got bigger": fog rolls in from the bottom, then wipes to the title
  fogBank(ctx, u, prog(u, 14, 17) * 2.6, lerp(1500, 900, prog(u, 14, 17)), C.fog, 5);
  const wipe = E.inCubic(prog(u, 16.3, 17));
  withAlpha(ctx, wipe, () => { const g = ctx.createLinearGradient(0, H, 0, H * (1 - wipe * 1.3)); g.addColorStop(0, C.deep); g.addColorStop(1, rgba(C.deep, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); });
  headline(ctx, 'टूटा नहीं था', CX, 430, font(96, 400, DISPLAY), C.fog, u, 9.6, 0.4, 'center', { exit: 16.2 });
  headline(ctx, 'फिर भी खाली', CX, 540, font(70, 600, UI), C.amber, u, 10.4, 0.4, 'center', { exit: 16.25 });
}

// S4 (u 17-23) title + 10 people vanish
function sTitle(ctx, u) {
  sky(ctx, u, { moonX: CX, moonY: 1060, moonR: 180, horizon: 1250 });
  sea(ctx, u, 1250, { to: 6, moonX: CX });
  ship(ctx, u, CX + 30, 1265 + Math.sin(u * 0.9) * 5, 0.95, { silhouette: 1, lanternOn: 0.8, roll: Math.sin(u * 0.6) * 0.02 });
  sea(ctx, u, 1250, { from: 4, moonX: CX });
  fogBank(ctx, u, 1.0, 1300, C.fog, 21);
  // title
  const k = springU(u, 17, SPRING.gentle);
  withAlpha(ctx, clamp(k), () => {
    ctx.save(); ctx.translate(CX, 360 + (1 - k) * 40);
    text(ctx, 'MARY CELESTE', 0, 0, font(112, 400, DISPLAY), C.fog, 'center', 6);
    text(ctx, 'का रहस्य', 0, 95, font(70, 600, UI), C.amber, 'center');
    ctx.restore();
  });
  // 10 लोग कहाँ गए?
  headline(ctx, '10 लोग कहाँ गए?', CX, 640, font(92, 400, DISPLAY), C.fog, u, 18.2, 0.3, 'center', { colors: [C.amber] });
  const n = 10, gap = 84, x0 = CX - (gap * (n - 1)) / 2;
  for (let i = 0; i < n; i++) {
    const kin = springU(u, 18 + i * 0.05, SPRING.snappy);
    const gone = E.inCubic(prog(u, 19 + i * 0.4, 19.6 + i * 0.4));
    if (kin <= 0) continue;
    ctx.save(); ctx.globalAlpha = clamp(kin) * (1 - gone);
    ctx.translate(x0 + i * gap, 800 - gone * 40);
    figure(ctx, 0, 0, 0.9 * kin, i === 0 ? C.amber : C.fog, i === 0);
    ctx.restore();
    if (gone > 0 && gone < 1) { ctx.strokeStyle = rgba(C.fog, 0.4 * (1 - gone)); ctx.lineWidth = 2; ctx.setLineDash([6, 8]); rrect(ctx, x0 + i * gap - 18, 728, 36, 72, 14); ctx.stroke(); ctx.setLineDash([]); }
  }
}

// ---------------------------------------------------------------- map (S5 u 23-35, S6a u 35-39)
const LON = (lon) => 24.491 * lon + 1959.2;
const LAT = (lat) => 1418.3 - 1403.2 * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
const PT = (lon, lat) => [LON(lon), LAT(lat)];
const ROUTE = [PT(-74, 40.7), PT(-62, 39.6), PT(-45, 38.6), PT(-30, 37.6), PT(-17.25, 38.33), PT(-9.8, 36.9), PT(-5.6, 35.95), PT(-1, 36.6), PT(4.6, 38.7), PT(7.2, 41.6), PT(8.6, 43.9)];
const FOUND_I = 4;
function routeLen(pts) { let L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; }
const RL = routeLen(ROUTE);
function routeAt(d) { // point at distance d along the route
  for (let i = 1; i < ROUTE.length; i++) if (d <= RL[i]) { const t = (d - RL[i - 1]) / (RL[i] - RL[i - 1]); return [lerp(ROUTE[i - 1][0], ROUTE[i][0], t), lerp(ROUTE[i - 1][1], ROUTE[i][1], t)]; }
  return ROUTE[ROUTE.length - 1];
}
function pathTo(ctx, d) {
  ctx.beginPath(); ctx.moveTo(...ROUTE[0]);
  for (let i = 1; i < ROUTE.length && RL[i - 1] < d; i++) { if (RL[i] <= d) ctx.lineTo(...ROUTE[i]); else ctx.lineTo(...routeAt(d)); }
}

function mapScene(ctx, u) {
  // camera: [centerX, centerY (map px), scale]
  const keys = [[23, [360, 330, 1.7]], [26, [500, 340, 1.5]], [30, [1250, 380, 0.95]], [33, [1250, 340, 0.43]], [35, [1530, 400, 1.35]], [38.2, [1560, 420, 1.6]]];
  let cam = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [ua, a] = keys[i - 1], [ub, b] = keys[i];
    if (u >= ua) { const p = E.inOutCubic(prog(u, ua, ub)); cam = [lerp(a[0], b[0], p), lerp(a[1], b[1], p), a[2] * Math.pow(b[2] / a[2], p)]; }
  }
  const [cx, cy, s] = cam;
  fill(ctx, C.paper);
  // paper texture
  for (let i = 0; i < 260; i++) { ctx.fillStyle = rgba(C.paperInk, 0.03 + 0.04 * hash01(i, 5)); ctx.fillRect(hash01(i, 6) * W, hash01(i, 7) * H, 3 + 6 * hash01(i, 8), 2); }
  const mapY = 880;                                         // map centre on screen
  ctx.save(); ctx.translate(CX, mapY); ctx.scale(s, s); ctx.translate(-cx, -cy);
  // graticule
  ctx.strokeStyle = rgba(C.paperInk, 0.12); ctx.lineWidth = 1.5 / s;
  for (let lon = -80; lon <= 20; lon += 10) { ctx.beginPath(); ctx.moveTo(LON(lon), LAT(60)); ctx.lineTo(LON(lon), LAT(15)); ctx.stroke(); }
  for (let lat = 20; lat <= 55; lat += 10) { ctx.beginPath(); ctx.moveTo(LON(-90), LAT(lat)); ctx.lineTo(LON(25), LAT(lat)); ctx.stroke(); }
  // land
  ctx.fillStyle = '#CDB98F'; ctx.strokeStyle = rgba(C.paperInk, 0.7); ctx.lineWidth = 2 / s; ctx.lineJoin = 'round';
  for (const r of MAP.rings) { ctx.beginPath(); ctx.moveTo(r[0][0], r[0][1]); for (let i = 1; i < r.length; i++) ctx.lineTo(r[i][0], r[i][1]); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // planned route (dashed, ink), drawn on
  const dPlan = RL[RL.length - 1] * E.inOutSine(prog(u, 26, 33));
  ctx.setLineDash([20 / s, 14 / s]); ctx.strokeStyle = rgba(C.paperInk, 0.85); ctx.lineWidth = 7 / s;
  pathTo(ctx, dPlan); ctx.stroke(); ctx.setLineDash([]);
  // the actual track (amber), NY -> where she was found
  if (u > 34) {
    const dAct = RL[FOUND_I] * E.inOutCubic(prog(u, 34, 35.2));
    ctx.strokeStyle = C.amber; ctx.lineWidth = 7 / s; ctx.lineCap = 'round'; pathTo(ctx, dAct); ctx.stroke();
  }
  // ship marker riding the planned line
  if (u > 26 && u < 34.5) {
    const [px, py] = routeAt(dPlan);
    ctx.save(); ctx.translate(px, py); ctx.scale(1 / s, 1 / s);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill(); ctx.strokeStyle = C.paper; ctx.lineWidth = 5; ctx.stroke();
    ctx.restore();
  }
  // pins
  const pin = (p, label, sub, u0, color = C.ink, side = 1) => {
    const k = springU(u, u0, SPRING.bouncy); if (k <= 0) return;
    ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(1 / s, 1 / s);
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 16 * k, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.paper; ctx.lineWidth = 5; ctx.stroke();
    withAlpha(ctx, clamp(k), () => {
      ctx.font = font(48, 700, UI); ctx.textAlign = side > 0 ? 'left' : 'right';
      ctx.lineWidth = 10; ctx.strokeStyle = rgba(C.paper, 0.9); ctx.strokeText(label, side * 30, 16); ctx.fillStyle = C.paperInk; ctx.fillText(label, side * 30, 16);
      if (sub) { ctx.font = font(36, 600, UI); ctx.strokeText(sub, side * 30, 60); ctx.fillStyle = color === C.amber ? '#9A5E08' : rgba(C.paperInk, 0.75); ctx.fillText(sub, side * 30, 60); }
    });
    ctx.restore();
  };
  pin(ROUTE[0], 'New York', 'नवंबर 1872', 24.5);
  pin(PT(8.93, 44.41), 'Genoa', 'मंज़िल', 31.5, C.ink, -1);
  if (u > 35) {
    const f = ROUTE[FOUND_I];
    const pulse = (u - 35) % 1.5 / 1.5;
    ctx.save(); ctx.translate(f[0], f[1]); ctx.scale(1 / s, 1 / s);
    ctx.strokeStyle = rgba(C.amber, 1 - pulse); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 20 + 60 * pulse, 0, TAU); ctx.stroke();
    ctx.restore();
    pin(f, 'यहाँ मिली', 'दिसंबर 1872', 35, C.amber, -1);
  }
  ctx.restore();
  // map-frame headline (paper style): 1872 stamp + 10 log
  const k = springU(u, 23.5, SPRING.bouncy);
  if (u < 34.6) withAlpha(ctx, clamp(k) * (1 - prog(u, 34, 34.6)), () => {
    ctx.save(); ctx.translate(CX, 400); ctx.rotate(-0.05); ctx.scale(lerp(1.8, 1, clamp(k)), lerp(1.8, 1, clamp(k)));
    ctx.strokeStyle = '#9A5E08'; ctx.lineWidth = 6; rrect(ctx, -260, -110, 520, 150, 16); ctx.stroke();
    text(ctx, 'नवंबर 1872', 0, 10, font(104, 400, DISPLAY), '#9A5E08', 'center');
    ctx.restore();
  });
  // 10 log savaar
  if (u > 30.8 && u < 34.6) {
    withAlpha(ctx, 1 - prog(u, 34, 34.6), () => {
      const k2 = springU(u, 31, SPRING.snappy);
      text(ctx, 'Captain समेत 10 लोग सवार', CX, 1090 + (1 - k2) * 30, font(54, 700, UI), C.paperInk, 'center');
      for (let i = 0; i < 10; i++) { const kk = springU(u, 31.2 + i * 0.08, SPRING.bouncy); if (kk > 0) { ctx.save(); ctx.globalAlpha = clamp(kk); figure(ctx, CX - 4.5 * 70 + i * 70, 1210, 0.8 * clamp(kk, 0, 1.2), i === 0 ? '#9A5E08' : C.paperInk, i === 0); ctx.restore(); } }
    });
  }
  if (u > 35) headline(ctx, 'दिसंबर: जहाज़ मिला', CX, 410, font(92, 400, DISPLAY), C.paperInk, u, 35.3, 0.35);
  if (u > 36.5) headline(ctx, 'crew नहीं था', CX, 520, font(70, 700, UI), '#9A5E08', u, 36.6, 0.35);
}

// S6b (u 39-43) davits with no boat
function sDavits(ctx, u) {
  const z = Math.pow(1.08, prog(u, 39, 43));
  ctx.save(); M.zoomAbout(ctx, z, CX, 1000);
  sky(ctx, u, { moonX: 860, moonY: 380, moonR: 55, horizon: 1300 });
  sea(ctx, u, 1300, { to: 6, moonX: 860 });
  fogBank(ctx, u, 1.0, 1250, C.fog, 31);
  // ship side close-up: hull wall at the bottom, rail at y 1180
  ctx.fillStyle = C.woodHi; ctx.fillRect(0, 1150, W, 60);
  const hg = ctx.createLinearGradient(0, 1200, 0, H); hg.addColorStop(0, '#3A281A'); hg.addColorStop(1, C.wood);
  ctx.fillStyle = hg; ctx.fillRect(0, 1210, W, H - 1210);
  ctx.strokeStyle = '#1A110A'; ctx.lineWidth = 3; for (let y = 1250; y < H; y += 46) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // two davits (curved iron arms)
  const davit = (x) => {
    ctx.strokeStyle = '#1B1B1E'; ctx.lineWidth = 22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, 1220); ctx.lineTo(x, 760); ctx.quadraticCurveTo(x, 640, x + 120, 660); ctx.stroke();
    // empty falls (ropes) swaying
    const sway = Math.sin(u * 1.1 + x) * 24;
    ctx.strokeStyle = '#8A7350'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(x + 125, 670); ctx.quadraticCurveTo(x + 125 + sway * 0.5, 820, x + 125 + sway, 960); ctx.stroke();
    ctx.fillStyle = '#1B1B1E'; ctx.beginPath(); ctx.arc(x + 125 + sway, 968, 13, 0, TAU); ctx.fill();
  };
  davit(200); davit(640);
  // dashed outline where the lifeboat hung
  const blink = 0.55 + 0.45 * Math.sin((u - 40.5) * Math.PI * 2);
  withAlpha(ctx, prog(u, 40, 40.6) * blink, () => {
    ctx.save(); ctx.translate(540, 1020); ctx.scale(1.55, 1.55);
    ctx.setLineDash([14, 12]); ctx.strokeStyle = C.amber; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-150, -22); ctx.lineTo(150, -28); ctx.quadraticCurveTo(140, 20, 100, 24); ctx.lineTo(-110, 24); ctx.quadraticCurveTo(-150, 15, -150, -22); ctx.closePath(); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  });
  ctx.restore();
  headline(ctx, 'lifeboat भी', CX, 430, font(78, 700, UI), C.fog, u, 39.3, 0.35);
  headline(ctx, 'गायब', CX, 590, font(170, 400, DISPLAY), C.amber, u, 40.5, 0.35);
}

// S7 (u 43-50.5) status card over the empty deck
function sStatus(ctx, u) {
  deck(ctx, u, { wheelRot: Math.sin(u * 0.5) * 0.3, zoom: Math.pow(1.06, prog(u, 43, 50.5)) });
  withAlpha(ctx, 0.55, () => fill(ctx, C.deep));
  const rows = [[44, 'चलने लायक', true], [45, 'सामान मौजूद', true], [46.5, 'crew', false], [47.5, 'lifeboat', false]];
  const k0 = springU(u, 43.2, SPRING.gentle);
  const cx = CX, top = 470, rh = 150;
  withAlpha(ctx, clamp(k0) * (1 - prog(u, 50, 50.5)), () => {
    ctx.save(); ctx.translate(0, (1 - k0) * 60);
    rrect(ctx, SAFE.x + 30, top - 150, SAFE.w - 60, rh * 4 + 210, 34); ctx.fillStyle = rgba(C.ink, 0.96); ctx.fill();
    ctx.strokeStyle = rgba(C.fog, 0.18); ctx.lineWidth = 2; ctx.stroke();
    text(ctx, 'जहाज़ की हालत', cx, top - 55, font(60, 400, DISPLAY), C.dim, 'center');
    rows.forEach(([u0, label, ok], i) => {
      const k = springU(u, u0, SPRING.snappy); if (k <= 0.001) return;
      const y = top + 60 + i * rh;
      ctx.save(); ctx.globalAlpha *= clamp(k); ctx.translate((1 - k) * -80, 0);
      text(ctx, label, SAFE.x + 110, y + 24, font(70, 700, UI), ok ? C.fog : C.amber);
      ctx.beginPath(); ctx.arc(SAFE.x + SAFE.w - 150, y, 46, 0, TAU); ctx.fillStyle = ok ? rgba(C.fog, 0.12) : rgba(C.amber, 0.18); ctx.fill();
      if (ok) tickMark(ctx, SAFE.x + SAFE.w - 150, y + 4, 1.6, C.fog, prog(u, u0 + 0.1, u0 + 0.5));
      else crossMark(ctx, SAFE.x + SAFE.w - 150, y, 1.4, C.amber, prog(u, u0 + 0.1, u0 + 0.5));
      ctx.restore();
      if (i < 3) { ctx.strokeStyle = rgba(C.fog, 0.1); ctx.beginPath(); ctx.moveTo(SAFE.x + 90, y + rh / 2 + 8); ctx.lineTo(SAFE.x + SAFE.w - 90, y + rh / 2 + 8); ctx.stroke(); }
    });
    ctx.restore();
  });
}

// S8 (u 50.5-54.5) क्यों?
function sWhy(ctx, u) {
  sky(ctx, u, { moonX: 540, moonY: 600, moonR: 90, horizon: 1200, moon: 0.7 });
  sea(ctx, u, 1200, { to: 6, moonX: 540 });
  ship(ctx, u, 540, 1215 + Math.sin(u) * 5, 0.75, { silhouette: 0.85, roll: Math.sin(u * 0.6) * 0.03 });
  fogBank(ctx, u, 2.2, 1100, C.fog, 41);
  const k = springU(u, 50.5, SPRING.bouncy);
  const s = Math.pow(1.1, prog(u, 50.5, 54.5)) * lerp(0.4, 1, clamp(k, 0, 1.2));
  withAlpha(ctx, clamp(k * 2), () => {
    text(ctx, 'सबने जहाज़', CX, 400, font(84, 400, DISPLAY), C.fog, 'center');
    text(ctx, 'क्यों छोड़ा?', CX, 500, font(84, 400, DISPLAY), C.fog, 'center');
    ctx.save(); ctx.translate(CX, 830); ctx.scale(s, s);
    text(ctx, 'क्यों?', 0, 0, font(300, 400, DISPLAY), C.amber, 'center');
    ctx.restore();
  });
  // fog parts toward the lifeboat
  const part = E.inCubic(prog(u, 53.8, 54.5));
  withAlpha(ctx, part, () => fill(ctx, rgba(C.fog, 0.25)));
}

function theoryTag(ctx, u, u0, n, line1, line2, uOut) {
  const k = springU(u, u0, SPRING.snappy);
  if (k <= 0) return;
  withAlpha(ctx, clamp(k) * (1 - prog(u, uOut - 0.5, uOut)), () => {
    ctx.save(); ctx.translate(CX, 340);
    ctx.font = font(40, 800, UI); const tw = ctx.measureText(`THEORY ${n}`).width + 60;
    rrect(ctx, -tw / 2, -46, tw, 64, 32); ctx.fillStyle = C.amber; ctx.fill();
    text(ctx, `THEORY ${n}`, 0, 0, font(40, 800, UI), C.ink, 'center', 3);
    ctx.restore();
  });
  headline(ctx, line1, CX, 480, font(86, 400, DISPLAY), C.fog, u, u0 + 0.3, 0.3, 'center', { exit: uOut - 0.6 });
  if (line2) headline(ctx, line2, CX, 585, font(62, 700, UI), C.amber, u, u0 + 1.2, 0.3, 'center', { exit: uOut - 0.55 });
}

// S9 (u 54.5-61.5) theory 1: they left in the lifeboat
function sTheoryBoat(ctx, u) {
  const p = prog(u, 54.5, 61.5);
  sky(ctx, u, { moonX: 860, moonY: 700, moonR: 60, horizon: 1050 });
  sea(ctx, u, 1050, { to: 3, moonX: 860 });
  ship(ctx, u, lerp(330, 250, p), 1065 + Math.sin(u * 0.8) * 4, 0.55, { silhouette: 0.4 });
  sea(ctx, u, 1050, { from: 3, to: 4, moonX: 860 });
  fogBank(ctx, u, 0.8 + p, 1050, C.fog, 51);
  // lifeboat rowing away, right and toward the fog
  const bx = lerp(520, 830, E.inOutSine(p)), by = 1250 + Math.sin(u * 1.2) * 8;
  lifeboat(ctx, u, bx, by, lerp(1.7, 1.25, p), { people: 5, rowing: 1, color: '#3A281A' });
  sea(ctx, u, 1050, { from: 4, moonX: 860 });
  fogBank(ctx, u, p * 1.2, 1200, C.fog, 52);
  theoryTag(ctx, u, 54.6, 1, 'खतरा समझकर', 'lifeboat में निकल गए?', 61.5);
}

// S10 (u 61.5-70.5) theory 2: alcohol fumes, fear of fire
function sTheoryBarrels(ctx, u) {
  const p = prog(u, 61.5, 70.5);
  fill(ctx, '#140D08');
  // hold walls: planks
  for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#22170F' : '#1C130C'; ctx.fillRect(i * 92, 0, 92, H); }
  // beams
  ctx.fillStyle = '#0E0906'; ctx.fillRect(0, 700, W, 46); ctx.fillRect(0, 240, W, 40);
  // ember glow under the barrels, flickering (the fear of fire)
  const fl = 0.6 + 0.4 * noise1(u * 2.5, 13);
  const g = ctx.createRadialGradient(CX, 1500, 20, CX, 1500, 700);
  g.addColorStop(0, rgba(C.amber, 0.35 * fl * prog(u, 63, 65))); g.addColorStop(1, rgba(C.amber, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 800, W, H - 800);
  // barrels: two rows, the camera tracks slowly
  ctx.save(); ctx.translate(lerp(30, -30, p), 0);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
    const rattle = (r === 1 && i === 2) ? Math.sin(u * 14) * 2 * bump(u, 66, 1.2) : 0;
    barrel(ctx, 70 + i * 190 + r * 95, 1000 + r * 230 + rattle, 1.15 + r * 0.15, r ? '#6A4A2C' : '#4F3721');
  }
  ctx.restore();
  // fumes: wavy translucent ribbons rising from the barrels
  for (let i = 0; i < 9; i++) {
    const x0 = 100 + i * 110, ph = hash01(i, 61) * TAU;
    ctx.strokeStyle = rgba(C.fog, 0.10 + 0.06 * Math.sin(u + i)); ctx.lineWidth = 10 + 8 * hash01(i, 62);
    ctx.beginPath();
    for (let y = 1000; y > 250; y -= 20) {
      const rise = ((u * 60 + i * 37) % 200);
      const x = x0 + Math.sin(y * 0.012 + u * 1.3 + ph) * 40 * (1000 - y) / 700;
      y === 1000 ? ctx.moveTo(x, y - rise * 0) : ctx.lineTo(x, y);
    }
    ctx.globalAlpha = prog(u, 62, 64); ctx.stroke(); ctx.globalAlpha = 1;
  }
  vignette(ctx, 0.7);
  theoryTag(ctx, u, 61.6, 2, 'alcohol के fumes?', 'आग का डर?', 70.5);
}

// S11 (u 70.5-76.5) theory 3: storm
function sTheoryStorm(ctx, u) {
  const flash = bump(u, 72.6, 0.25) + 0.5 * bump(u, 73.1, 0.15);
  sky(ctx, u, { moon: 0, top: '#05090E', bottom: '#14202B', horizon: 1050 });
  // storm clouds
  for (let i = 0; i < 9; i++) cloud(ctx, ((hash01(i, 71) * 1400 + u * 18) % 1400) - 160, 200 + hash01(i, 72) * 380, 2.2 + hash01(i, 73) * 1.5, M.mix('#101820', '#2A3742', hash01(i, 74)));
  if (flash > 0.05) { bolt(ctx, 300, 300, 4.5, rgba(C.fog, flash)); }
  sea(ctx, u, 1050, { rough: 1, to: 3, reflect: 0 });
  ship(ctx, u, 560, 1080 + Math.sin(u * 1.6) * 30, 0.8, { roll: Math.sin(u * 1.1) * 0.12, silhouette: 0.6 - flash * 0.4 });
  sea(ctx, u, 1050, { rough: 1, from: 3, reflect: 0 });
  // rain
  ctx.strokeStyle = rgba(C.dim, 0.35); ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 140; i++) {
    const x = (hash01(i, 75) * (W + 400) + u * 80) % (W + 400) - 200, y = (hash01(i, 76) * H + u * 900 * hash01(i, 77) + u * 300) % H;
    ctx.moveTo(x, y); ctx.lineTo(x - 18, y + 60);
  }
  ctx.stroke();
  withAlpha(ctx, flash * 0.45, () => fill(ctx, C.fog));
  theoryTag(ctx, u, 70.6, 3, 'समुद्री तूफ़ान?', 'या कुछ और?', 76.5);
}

// S12 (u 76.5-80.5) Theory ≠ proof
function sProof(ctx, u) {
  fill(ctx, C.paper);
  for (let i = 0; i < 220; i++) { ctx.fillStyle = rgba(C.paperInk, 0.03 + 0.04 * hash01(i, 85)); ctx.fillRect(hash01(i, 86) * W, hash01(i, 87) * H, 3 + 6 * hash01(i, 88), 2); }
  // simple line lifeboat on wavy ink lines
  ctx.strokeStyle = rgba(C.paperInk, 0.5); ctx.lineWidth = 5;
  for (let j = 0; j < 3; j++) { ctx.beginPath(); for (let x = 140; x <= 940; x += 10) { const y = 1255 + j * 34 + Math.sin(x * 0.03 + u * 1.5 + j) * 8; x === 140 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  lifeboat(ctx, u, CX, 1210 + Math.sin(u * 1.4) * 6, 1.4, { line: true, people: 0 });
  ctx.save(); M.shake(ctx, u, 76.5, 12);
  const k1 = springU(u, 76.5, SPRING.snappy), k2 = springU(u, 77, SPRING.bouncy), k3 = springU(u, 77.5, SPRING.snappy);
  const stamp = (k, fn) => { if (k <= 0.001) return; ctx.save(); ctx.globalAlpha = clamp(k * 1.5); fn(lerp(1.6, 1, clamp(k, 0, 1.3))); ctx.restore(); };
  stamp(k1, (s) => { ctx.translate(CX, 470); ctx.scale(s, s); text(ctx, 'Theory', 0, 0, font(190, 400, DISPLAY), C.paperInk, 'center'); });
  stamp(k2, (s) => {
    ctx.translate(CX, 640); ctx.scale(s, s); ctx.fillStyle = '#C67D10';
    rrect(ctx, -120, -50, 240, 30, 15); ctx.fill(); rrect(ctx, -120, 20, 240, 30, 15); ctx.fill();
    ctx.save(); ctx.rotate(-1.05); rrect(ctx, -110, -15, 220, 30, 15); ctx.fill(); ctx.restore();
  });
  stamp(k3, (s) => { ctx.translate(CX, 900); ctx.scale(s, s); text(ctx, 'proof', 0, 0, font(190, 400, DISPLAY), C.paperInk, 'center'); });
  ctx.restore();
}

// S13 (u 80.5-87.5) three theories, each crossed
function sCrossed(ctx, u) {
  fill(ctx, C.ink);
  fogBank(ctx, u, 0.6, 900, C.fog, 91);
  headline(ctx, 'किसी theory का', CX, 400, font(84, 400, DISPLAY), C.fog, u, 80.6, 0.3);
  headline(ctx, 'पक्का सबूत नहीं', CX, 510, font(84, 400, DISPLAY), C.amber, u, 81.0, 0.3);
  const items = [
    ['खतरा', (x, y) => lifeboat(ctx, u, x, y + 30, 0.55, { people: 3, color: C.dim })],
    ['alcohol', (x, y) => barrel(ctx, x, y + 10, 0.8, '#8A6A48', '#3A2A1A')],
    ['तूफ़ान', (x, y) => { cloud(ctx, x, y - 10, 0.9, C.dim); bolt(ctx, x - 5, y + 20, 0.9, C.fog); }],
  ];
  items.forEach(([label, draw], i) => {
    const x = CX + (i - 1) * 300, y = 900;
    const k = springU(u, 80.6 + i * 0.25, SPRING.bouncy); if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(k); ctx.translate(x, y); ctx.scale(clamp(k, 0, 1.2), clamp(k, 0, 1.2)); ctx.translate(-x, -y);
    ctx.beginPath(); ctx.arc(x, y, 125, 0, TAU); ctx.fillStyle = rgba(C.fog, 0.07); ctx.fill(); ctx.strokeStyle = rgba(C.fog, 0.25); ctx.lineWidth = 3; ctx.stroke();
    draw(x, y);
    text(ctx, label, x, y + 200, font(52, 700, UI), C.fog, 'center');
    const kc = prog(u, 81.5 + i, 81.9 + i);
    if (kc > 0) { ctx.save(); ctx.translate(x, y); ctx.scale(lerp(1.4, 1, E.outBack(kc)), lerp(1.4, 1, E.outBack(kc))); crossMark(ctx, 0, 0, 5.2, C.amber, kc, 5); ctx.restore(); }
    ctx.restore();
  });
  const k4 = springU(u, 84.5, SPRING.snappy);
  withAlpha(ctx, clamp(k4), () => text(ctx, 'सब अंदाज़े हैं', CX, 1280 + (1 - k4) * 30, font(66, 700, UI), C.dim, 'center'));
}

// S14 (u 87.5-93) unsolved
function sUnsolved(ctx, u) {
  const p = prog(u, 87.5, 93);
  sky(ctx, u, { moonX: CX, moonY: 1010, moonR: 120, horizon: 1150 });
  sea(ctx, u, 1150, { to: 6, moonX: CX });
  withAlpha(ctx, 1 - p * 0.7, () => ship(ctx, u, CX - 40 - p * 120, 1175 + Math.sin(u) * 5, 0.6, { silhouette: 1, lanternOn: 1 - p }));
  fogBank(ctx, u, 1 + p * 2, 1100, C.fog, 101);
  headline(ctx, 'आज तक', CX, 400, font(78, 700, UI), C.fog, u, 87.6, 0.3, 'center');
  const k = springU(u, 88.5, SPRING.snappy);
  if (k > 0) {
    ctx.save(); M.shake(ctx, u, 88.5, 10);
    ctx.translate(CX, 590); ctx.rotate(-0.06); const s = lerp(1.8, 1, clamp(k, 0, 1.2)); ctx.scale(s, s);
    ctx.globalAlpha = clamp(k * 1.5);
    ctx.strokeStyle = C.amber; ctx.lineWidth = 9; rrect(ctx, -330, -125, 660, 175, 18); ctx.stroke();
    text(ctx, 'अनसुलझा', 0, 20, font(150, 400, DISPLAY), C.amber, 'center');
    ctx.restore();
  }
  withAlpha(ctx, prog(u, 89.5, 90.2), () => text(ctx, '1872 से आज तक', CX, 770, font(58, 600, UI), C.fog, 'center'));
}

// S15 (u 93-108) CTA: your theory?
function sCTA(ctx, u) {
  fill(ctx, C.ink);
  sky(ctx, u, { moon: 0, horizon: 1700, top: C.deep, bottom: C.night });
  fogBank(ctx, u, 0.9, 1500, C.fog, 111);
  const k0 = springU(u, 93, SPRING.gentle);
  headline(ctx, 'आपकी theory', CX, 420, font(110, 400, DISPLAY), C.fog, u, 92.9, 0.25);
  headline(ctx, 'क्या है?', CX, 545, font(110, 400, DISPLAY), C.amber, u, 93.5, 0.3);
  const opts = [['A', 'खतरा समझकर भागे'], ['B', 'alcohol fumes / आग'], ['C', 'समुद्री तूफ़ान'], ['D', 'कुछ और?']];
  opts.forEach(([l, t], i) => {
    const u0 = 95 + i * 0.75; const k = springU(u, u0, SPRING.bouncy); if (k <= 0) return;
    const y = 700 + i * 140, x = SAFE.x + 40, w = SAFE.w - 80;
    const bobY = Math.sin(u * 0.8 + i) * 3;
    ctx.save(); ctx.globalAlpha = clamp(k); ctx.translate(x + w / 2, y + bobY); ctx.scale(clamp(k, 0, 1.15), clamp(k, 0, 1.15));
    rrect(ctx, -w / 2, -50, w, 104, 52); ctx.fillStyle = rgba(C.fog, 0.08); ctx.fill(); ctx.strokeStyle = rgba(C.fog, 0.3); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(-w / 2 + 56, 2, 34, 0, TAU); ctx.fillStyle = C.amber; ctx.fill();
    text(ctx, l, -w / 2 + 56, 18, font(42, 800, UI), C.ink, 'center');
    text(ctx, t, -w / 2 + 116, 20, font(54, 600, UI), C.fog);
    ctx.restore();
  });
  // comment bubble + arrow
  const kb = springU(u, 98.5, SPRING.bouncy);
  if (kb > 0) {
    const bob = Math.sin((u - 98.5) * Math.PI * 0.5) * 8;
    ctx.save(); ctx.globalAlpha = clamp(kb); ctx.translate(CX, 1330 + bob); ctx.scale(clamp(kb, 0, 1.2), clamp(kb, 0, 1.2));
    ctx.font = font(60, 700, UI); const tw = ctx.measureText('comment में बताइए').width;
    const w = tw + 170;
    rrect(ctx, -w / 2, -60, w, 120, 60); ctx.fillStyle = C.amber; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-w / 2 + 70, 55); ctx.lineTo(-w / 2 + 50, 100); ctx.lineTo(-w / 2 + 110, 58); ctx.fill();
    // bubble icon
    ctx.fillStyle = C.ink; rrect(ctx, -w / 2 + 34, -26, 62, 44, 14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-w / 2 + 46, 14); ctx.lineTo(-w / 2 + 42, 32); ctx.lineTo(-w / 2 + 62, 16); ctx.fill();
    text(ctx, 'comment में बताइए', -w / 2 + 120, 20, font(60, 700, UI), C.ink);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- film
const SCENES = [
  [0, 7, sShipHook], [7, 9.5, sCrewGone], [9.5, 17, sIntact], [17, 23, sTitle], [23, 39, mapScene],
  [39, 43, sDavits], [43, 50.5, sStatus], [50.5, 54.5, sWhy], [54.5, 61.5, sTheoryBoat],
  [61.5, 70.5, sTheoryBarrels], [70.5, 76.5, sTheoryStorm], [76.5, 80.5, sProof], [80.5, 87.5, sCrossed],
  [87.5, 93, sUnsolved], [93, 999, sCTA],
];
// whip/push transitions: [beat, kind] where the outgoing and incoming shots share the frame
const TRANS = { 39: 'push', 54.5: 'whipL', 61.5: 'whipL', 93: 'whipUp' };

function drawScene(ctx, u, i) { ctx.save(); SCENES[i][2](ctx, u); ctx.restore(); }

M.film({
  fonts: [font(100, 400, DISPLAY), font(40, 400, UI), font(40, 500, UI), font(40, 600, UI), font(40, 700, UI), font(40, 800, UI)],
  samples: 6,
  hits: HITS,
  async init(ctx) {
    [VO, MAP] = await Promise.all([fetch('vo.json').then((r) => r.json()), fetch('assets/map.json').then((r) => r.json())]);
    // make sure Devanagari shapes are loaded for every face before measuring
    await Promise.all([document.fonts.load(font(100, 400, DISPLAY), 'रहस्य'), ...[400, 500, 600, 700, 800].map((w) => document.fonts.load(font(40, w, UI), 'रहस्य'))]);
    buildCaptions(ctx);
  },
  draw(ctx, u) {
    ctx.textBaseline = 'alphabetic';
    let i = SCENES.findIndex(([a, b]) => u >= a && u < b); if (i < 0) i = SCENES.length - 1;
    const [a] = SCENES[i];
    const kind = TRANS[a], d = 0.5;
    if (kind && u < a + d && i > 0) {
      // both shots on screen: the old one slides out as the new one slides in
      const p = E.inOutCubic(prog(u, a - 0.0, a + d));
      const dx = kind === 'whipL' ? -W : 0, dy = kind === 'whipUp' ? -H : 0;
      if (kind === 'push') {
        drawScene(ctx, u, i);
        withAlpha(ctx, 1 - p, () => { ctx.save(); M.zoomAbout(ctx, 1 + p * 0.6, CX, 900); drawScene(ctx, Math.min(u, a - 0.01), i - 1); ctx.restore(); });
      } else {
        ctx.save(); ctx.translate(dx * p, dy * p); drawScene(ctx, Math.min(u, a - 0.01), i - 1); ctx.restore();
        ctx.save(); ctx.translate(kind === 'whipL' ? W * (1 - p) : 0, kind === 'whipUp' ? H * (1 - p) : 0); drawScene(ctx, u, i); ctx.restore();
      }
    } else drawScene(ctx, u, i);
    captions(ctx, u);
  },
  post(ctx, u, t) {
    // film grain: seeded per frame
    const fr = Math.floor(t * 30);
    const rnd = mulberry32(fr * 7919 + 13);
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    for (let i = 0; i < 1400; i++) ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    for (let i = 0; i < 1400; i++) ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
    vignette(ctx, 0.35);
  },
});
