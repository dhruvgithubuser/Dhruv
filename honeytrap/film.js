// The Nvidia Honey Trap: a pure function of time. window.seek(t) paints frame t (lib/motion.js).
// Timing follows the narration: vo.js holds every phrase and word time (audio/score.py writes it).
// docs/shotlist.md is the plan. Shots are drawn in seconds (t); springs take seconds since a step.
import * as M from './lib/motion.js';
import { VO, DUR } from './vo.js';

const { W, H, E, prog, lerp, clamp, spring, SPRING, font, layout, text, fill, rrect, hash01, noise1, mulberry32 } = M;

// ---------------------------------------------------------------- tokens: one accent (honey yellow)
const C = {
  paper: '#EFE8DA', paper2: '#E5DCCA', card: '#FBF8F1', ink: '#1B1A17', ink2: '#4A453D', mute: '#7D7466',
  rule: '#CFC4AF', honey: '#F2C230', honeyD: '#D9A21B', honeyL: '#FBE08A', night: '#131210', white: '#FBF8F1',
};
const D = 'Display', UI = 'UI';
const CX = W / 2, TOP = 280;           // content runs 280..1250; captions sit at ~1395

// ---------------------------------------------------------------- narration lookups
const P = Object.fromEntries(VO.map((p) => [p.id, p]));
const w = (id, i) => P[id].words[i].t0;
const sp = (t, t0, cfg = SPRING.snappy) => spring(t - t0, cfg);
const ease = (t, a, b, f = E.outCubic) => f(prog(t, a, b));

// ---------------------------------------------------------------- shot boundaries (seconds)
const CUT = {
  hook: 0, dc0: 5.0, ask: 7.38, chips: 9.93, map: 13.08, memo: 17.88, dossier: 24.03, asia: 29.55, goal: 35.13,
  trap: 40.68, deny: 42.93, worse: 51.12, clips: 52.5, money: 60.78, dc: 66.78, why: 77.25,
  target: 79.08, question: 86.43, end: 90.18,
};
const ORDER = Object.entries(CUT).sort((a, b) => a[1] - b[1]);
const shotAt = (t) => { let s = ORDER[0][0]; for (const [k, v] of ORDER) if (t >= v) s = k; return s; };

// ---------------------------------------------------------------- hits (seconds -> beats for sfx.mjs)
const BT = (t) => t / 0.6;
const HITS = [
  [BT(1.13), 'index fund label', 'tick'],
  [BT(2.25), 'NVDA slice pops', 'pop', { pitch: 'A4' }],
  [BT(3.55), 'honey lands on slice', 'thud', { gain: 0.25 }],
  [BT(4.13), 'slice cracks', 'click'],
  [BT(4.62), 'honey wipe', 'whoosh', { len: 0.6, from: 400, to: 1800 }],
  [BT(5.81), 'highlight Washington', 'whoosh', { len: 0.3, from: 1500, to: 4000, gain: 0.12 }],
  [BT(7.1), 'push into dome', 'whoosh', { len: 0.5, from: 300, to: 2500 }],
  [BT(7.45), 'question card lands', 'thud', { gain: 0.3 }],
  [BT(10.05), 'chip lands', 'pop', { pitch: 'D5' }],
  [BT(11.4), 'chip grid fans out', 'blip', { pitch: 'A5' }],
  [BT(13.15), 'map in', 'whoosh', { len: 0.4, from: 2000, to: 500 }],
  [BT(15.45), 'export barrier', 'thud'],
  [BT(15.95), 'chip hits barrier', 'click'],
  [BT(18.1), 'NOV 8 stamp', 'impact', { gain: 0.35 }],
  [BT(18.9), 'portrait drops', 'thud', { gain: 0.3 }],
  [BT(20.6), 'name lower third', 'whoosh', { len: 0.3, from: 2500, to: 800, gain: 0.15 }],
  [BT(21.35), 'memo slides up', 'whoosh', { len: 0.35, from: 500, to: 2000, gain: 0.15 }],
  [BT(22.45), 'typing summary', 'type', { len: 1.0 }],
  [BT(24.1), 'dossier whip', 'whoosh', { len: 0.4 }],
  [BT(27.0), 'SUSPECTED stamp', 'thud', { gain: 0.35 }],
  [BT(26.12), 'card A pins', 'pop', { pitch: 'E5' }],
  [BT(29.6), 'map push to Asia', 'whoosh', { len: 0.6, from: 300, to: 1500 }],
  [BT(28.62), 'name types', 'type', { len: 0.5 }],
  [BT(31.96), 'thread zips', 'whoosh', { len: 0.5, from: 800, to: 3000, gain: 0.15 }],
  [BT(32.7), 'Beijing pin', 'pop', { pitch: 'A4' }],
  [BT(35.35), 'goal card', 'click'],
  [BT(36.42), 'tick 1', 'tick'],
  [BT(37.7), 'tick 2', 'tick'],
  [BT(40.35), 'honey rises', 'whoosh', { len: 0.5, from: 300, to: 1500 }],
  [BT(43.05), 'China quote in', 'whoosh', { len: 0.35, gain: 0.15 }],
  [BT(46.45), 'board quote in', 'whoosh', { len: 0.35, gain: 0.15, pan: 0.3 }],
  [BT(52.6), 'clipping 1 slap', 'thud'],
  [BT(57.12), 'clipping 2 slap', 'thud'],
  [BT(60.12), 'oust highlight', 'click'],
  [BT(63.0), 'counter rolls', 'type', { len: 0.6 }],
  [BT(63.65), 'counter lands', 'thud'],
  [BT(67.25), 'split', 'whoosh', { len: 0.4 }],
  [BT(68.6), 'portrait print', 'thud', { gain: 0.25 }],
  [BT(69.8), 'quote lands', 'click'],
  [BT(72.15), 'calendar flips', 'whoosh', { len: 0.3, gain: 0.15 }],
  [BT(76.1), 'date circled', 'pop', { pitch: 'D5' }],
  [BT(82.9), 'arrow hits', 'thud'],
  [BT(89.05), 'strike through', 'click'],
  [BT(91.85), 'PENDING stamp', 'impact', { gain: 0.45 }],
];

// ---------------------------------------------------------------- drawing kit
const F = (s, wt = 400, fam = D) => font(s, wt, fam);

function paper(ctx, IMG, tone = C.paper) {
  fill(ctx, tone);
  if (IMG.paperTex) { ctx.globalAlpha = 1; ctx.drawImage(IMG.paperTex, 0, 0); }
}

// wrap a string into lines that fit maxW
function wrap(ctx, str, f, maxW) {
  ctx.font = f;
  const words = str.split(' '), lines = [];
  let cur = '';
  for (const wd of words) {
    const nxt = cur ? cur + ' ' + wd : wd;
    if (ctx.measureText(nxt).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = nxt;
  }
  if (cur) lines.push(cur);
  return lines;
}

// highlighter swipe behind a box, left to right
function hilite(ctx, x, y, wd, h, p, color = C.honey) {
  if (p <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = color;
  ctx.beginPath();
  const ww = wd * p;
  ctx.moveTo(x - 6, y + 4); ctx.lineTo(x + ww + 6, y); ctx.lineTo(x + ww + 2, y + h); ctx.lineTo(x - 8, y + h + 3);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// paragraph with per-word highlights: hl = { 'word': progress }; returns { h, lines }
function para(ctx, str, x, y, f, maxW, lineH, color, hl = {}, align = 'left', hlColor = C.honey) {
  const lines = wrap(ctx, str, f, maxW);
  ctx.font = f;
  lines.forEach((ln, i) => {
    const lw = ctx.measureText(ln).width;
    const x0 = align === 'center' ? x - lw / 2 : x;
    const by = y + i * lineH;
    // highlights first
    let cx = x0;
    for (const wd of ln.split(' ')) {
      const ww = ctx.measureText(wd).width;
      const key = wd.replace(/[^A-Za-z0-9$']/g, '').toLowerCase();
      if (hl[key] !== undefined) hilite(ctx, cx, by - lineH * 0.62, ww, lineH * 0.72, hl[key], hlColor);
      cx += ww + ctx.measureText(' ').width;
    }
    ctx.font = f;
    text(ctx, ln, x0, by, f, color);
  });
  return { h: lines.length * lineH, lines };
}

// paper card with a torn bottom edge and a soft offset shadow
function cardPath(ctx, x, y, wd, h, seed = 1) {
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + wd, y);
  ctx.lineTo(x + wd, y + h);
  const n = Math.max(8, Math.round(wd / 26));
  for (let i = n; i >= 0; i--) ctx.lineTo(x + (wd * i) / n, y + h + (hash01(i, seed) - 0.5) * 12);
  ctx.closePath();
}
function card(ctx, x, y, wd, h, { rot = 0, seed = 1, color = C.card, shadow = 0.16 } = {}) {
  ctx.save();
  ctx.translate(x + wd / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-(x + wd / 2), -(y + h / 2));
  ctx.fillStyle = `rgba(40,30,15,${shadow})`;
  cardPath(ctx, x + 10, y + 14, wd, h, seed); ctx.fill();
  ctx.fillStyle = color;
  cardPath(ctx, x, y, wd, h, seed); ctx.fill();
  ctx.restore();
}
function withRot(ctx, cx, cy, rot, s, fn) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s); ctx.translate(-cx, -cy); fn(); ctx.restore();
}

// small caps label
function label(ctx, str, x, y, size = 30, color = C.ink2, align = 'left', wt = 800) {
  text(ctx, str.toUpperCase(), x, y, F(size, wt, UI), color, align, size * 0.12);
}
// source tag: "— The New York Times"
function source(ctx, str, x, y, a = 1, align = 'left') {
  if (a <= 0) return;
  ctx.globalAlpha = a;
  text(ctx, '— ' + str, x, y, F(34, 600, UI), C.mute, align);
  ctx.globalAlpha = 1;
}
// ink rubber stamp: boxed caps, slammed in by k (0..1 spring)
function stamp(ctx, str, x, y, rot, k, size = 54, color = C.ink) {
  if (k <= 0) return;
  const s = lerp(1.9, 1, clamp(k)) + (k > 1 ? (k - 1) * 0.3 : 0);
  const a = clamp(k * 1.6);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = a * 0.92;
  const f = F(size, 800, UI);
  ctx.font = f; ctx.letterSpacing = `${size * 0.08}px`;
  const tw = ctx.measureText(str).width; ctx.letterSpacing = '0px';
  ctx.strokeStyle = color; ctx.lineWidth = size * 0.09;
  rrect(ctx, -tw / 2 - size * 0.4, -size * 0.95, tw + size * 0.8, size * 1.35, size * 0.12); ctx.stroke();
  text(ctx, str, 0, size * 0.18, f, color, 'center', size * 0.08);
  // worn ink: knock out a few specks
  ctx.globalCompositeOperation = 'destination-out';
  ctx.restore();
  ctx.globalAlpha = 1;
}
// typed string reveal
const typed = (str, t, t0, cps = 38) => str.slice(0, Math.max(0, Math.floor((t - t0) * cps)));

// GPU chip, drawn in code (no brand marks)
function chip(ctx, cx, cy, size, { rot = 0, glow = 0 } = {}) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  const s = size, pin = s * 0.06, n = 8;
  ctx.fillStyle = C.mute;
  for (let i = 0; i < n; i++) {
    const o = -s * 0.36 + (i * s * 0.72) / (n - 1) - pin / 2;
    ctx.fillRect(o, -s / 2 - pin * 1.6, pin, pin * 1.8); ctx.fillRect(o, s / 2 - pin * 0.2, pin, pin * 1.8);
    ctx.fillRect(-s / 2 - pin * 1.6, o, pin * 1.8, pin); ctx.fillRect(s / 2 - pin * 0.2, o, pin * 1.8, pin);
  }
  rrect(ctx, -s / 2, -s / 2, s, s, s * 0.06); ctx.fillStyle = C.ink; ctx.fill();
  const d = s * 0.56;
  rrect(ctx, -d / 2, -d / 2, d, d, s * 0.03); ctx.fillStyle = glow > 0 ? M.mix('#38342D', C.honey, glow) : '#38342D'; ctx.fill();
  ctx.strokeStyle = 'rgba(239,232,218,0.18)'; ctx.lineWidth = Math.max(1, s * 0.006);
  for (let i = 1; i < 6; i++) {
    const o = -d / 2 + (i * d) / 6;
    ctx.beginPath(); ctx.moveTo(o, -d / 2); ctx.lineTo(o, d / 2); ctx.moveTo(-d / 2, o); ctx.lineTo(d / 2, o); ctx.stroke();
  }
  ctx.restore();
}

// honey: a sheet from yTop down to yBase with drips hanging below it
function honey(ctx, yTop, yBase, drips, color = C.honey) {
  ctx.fillStyle = color;
  ctx.fillRect(0, yTop, W, Math.max(0, yBase - yTop));
  // wavy lower edge
  ctx.beginPath(); ctx.moveTo(0, yBase - 2);
  for (let x = 0; x <= W; x += 30) ctx.lineTo(x, yBase + 10 * Math.sin(x * 0.013 + 1.3) + 6 * Math.sin(x * 0.031));
  ctx.lineTo(W, yBase - 2); ctx.closePath(); ctx.fill();
  for (const d of drips) {
    if (d.len <= 0) continue;
    const r = d.w / 2;
    ctx.beginPath();
    ctx.moveTo(d.x - r * 1.6, yBase);
    ctx.quadraticCurveTo(d.x - r, yBase + 6, d.x - r, yBase + Math.min(d.len, r * 2));
    ctx.lineTo(d.x - r, yBase + d.len);
    ctx.arc(d.x, yBase + d.len, r, Math.PI, 0, true);
    ctx.lineTo(d.x + r, yBase + Math.min(d.len, r * 2));
    ctx.quadraticCurveTo(d.x + r, yBase + 6, d.x + r * 1.6, yBase);
    ctx.closePath(); ctx.fill();
    // a drop at the tip, bulging
    ctx.beginPath(); ctx.arc(d.x, yBase + d.len + r * 0.25, r * 1.18, 0, M.TAU); ctx.fill();
  }
  // gloss
  ctx.fillStyle = 'rgba(255,248,215,0.35)';
  for (const d of drips) if (d.len > 30) { rrect(ctx, d.x - d.w * 0.22, yBase + 8, d.w * 0.14, d.len * 0.7, 4); ctx.fill(); }
}

// wipe: B is revealed above a moving band, A stays below it. y = band top (moves H -> -band)
function wipeUp(ctx, t, t0, dur, band, drawA, drawB, bandFn) {
  const p = E.inOutCubic(prog(t, t0, t0 + dur));
  const top = lerp(H, -band, p);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, Math.max(0, top)); ctx.clip(); drawA(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(0, top + band, W, H); ctx.clip(); drawB(); ctx.restore();
  bandFn(top, top + band);
}
// wipe down: A above... B revealed above the band as it falls
function wipeDown(ctx, t, t0, dur, band, drawA, drawB, bandFn) {
  const p = E.inOutCubic(prog(t, t0, t0 + dur));
  const bot = lerp(0, H + band, p);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, Math.max(0, bot - band)); ctx.clip(); drawB(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(0, bot, W, H); ctx.clip(); drawA(); ctx.restore();
  bandFn(bot - band, bot);
}

// ---------------------------------------------------------------- photos (documentary treatment)
// Every photo is freely licensed (assets/photos/CREDITS.md); its credit is drawn on it.
function creditTag(ctx, s, x, y, align = 'right') {
  const f = F(20, 600, UI); ctx.font = f;
  const tw = ctx.measureText(s).width, x0 = align === 'right' ? x - tw - 12 : x - 4;
  ctx.fillStyle = 'rgba(19,18,16,0.6)'; ctx.fillRect(x0, y - 20, tw + 16, 28);
  text(ctx, s, align === 'right' ? x - 4 : x + 4, y, f, '#EFE8DA', align);
}
function photoPrint(ctx, img, x, y, w, h, { rot = 0, fx = 0.5, fy = 0.4, zoom = 1, credit = '', b = 16, s = 1 } = {}) {
  if (!img) return;
  withRot(ctx, x + w / 2, y + h / 2, rot, s, () => {
    ctx.fillStyle = 'rgba(40,30,15,0.24)'; ctx.fillRect(x + 12, y + 16, w, h);
    ctx.fillStyle = C.card; ctx.fillRect(x, y, w, h);
    M.cover(ctx, img, x + b, y + b, w - 2 * b, h - 2 * b, { fx, fy, zoom });
    if (credit) creditTag(ctx, credit, x + w - b - 8, y + h - b - 10);
  });
}
// full-bleed blurred, graded background with a slow push and a dark wash for type
function fullBleed(ctx, img, t, t0, t1, { fx = 0.5, fy = 0.5, z0 = 1.1, z1 = 1.0, dark = 0.35, credit = '' } = {}) {
  if (!img) { fill(ctx, C.night); return; }
  const z = Math.exp(lerp(Math.log(z0), Math.log(z1), prog(t, t0, t1)));
  M.cover(ctx, img, 0, 0, W, H, { fx, fy, zoom: z });
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgba(19,18,16,${dark + 0.3})`); g.addColorStop(0.5, `rgba(19,18,16,${dark})`); g.addColorStop(1, `rgba(19,18,16,${dark + 0.4})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (credit) creditTag(ctx, credit, 48, 1300, 'left');
}

// ================================================================ SHOTS

// ---- 1. hook: your index fund, honey on the NVDA slice
const SLICES = [0.16, 0.11, 0.09, 0.075, 0.07, 0.065, 0.06, 0.055, 0.05, 0.05, 0.045, 0.04, 0.04, 0.04];
const NV = 2;   // index of the NVDA slice
function shotHook(ctx, t, IMG) {
  paper(ctx, IMG);
  const cx = CX, cy = 800, R = 330, r = 175;
  // title
  const k0 = t < 0.3 ? 1 : 1;
  ctx.globalAlpha = clamp(k0 * 1.5);
  label(ctx, 'Your index fund', CX, TOP + 70 + (1 - k0) * 30, 46, C.ink, 'center');
  ctx.globalAlpha = 1;
  ctx.font = F(46, 800, UI); ctx.letterSpacing = '5.5px';
  const lw = ctx.measureText('YOUR INDEX FUND').width; ctx.letterSpacing = '0px';
  hilite(ctx, CX - lw / 2 + lw * 0.33, TOP + 30, lw * 0.67, 52, ease(t, w('hook1', 4), w('hook1', 5) + 0.25));
  // donut: already sweeping on frame 0
  const sweep = lerp(0.5, 1, ease(t, 0, 0.8, E.outQuint));
  const rot = -Math.PI / 2 + lerp(-0.9, 0, ease(t, 0, 1.1, E.outCubic));
  const pop = sp(t, w('hook1', 7), SPRING.bouncy);
  const crack = ease(t, w('hook1', 12), w('hook1', 12) + 0.3);
  const fallY = 26 * ease(t, w('hook1', 12), w('hook1', 14), E.outBack);
  let a0 = rot;
  SLICES.forEach((s, i) => {
    const a1 = a0 + s * M.TAU * sweep;
    const mid = (a0 + a1) / 2;
    const isNV = i === NV;
    const off = isNV ? 34 * pop : 0;
    const ox = Math.cos(mid) * off, oy = Math.sin(mid) * off + (isNV ? fallY : 0);
    ctx.beginPath();
    ctx.arc(cx + ox, cy + oy, R, a0 + 0.012, a1 - 0.012);
    ctx.arc(cx + ox, cy + oy, r, a1 - 0.012, a0 + 0.012, true);
    ctx.closePath();
    ctx.fillStyle = isNV ? C.ink : M.mix('#CDBFA6', '#B3A588', hash01(i, 7));
    ctx.fill();
    if (isNV && pop > 0.05) {
      ctx.save(); ctx.globalAlpha = clamp(pop);
      const lx = cx + ox + Math.cos(mid) * (R + r) / 2, ly = cy + oy + Math.sin(mid) * (R + r) / 2;
      text(ctx, 'NVDA', lx, ly + 13, F(38, 800, UI), C.white, 'center', 2);
      ctx.restore();
      if (crack > 0) {        // a jagged crack across the slice
        ctx.save(); ctx.strokeStyle = C.paper; ctx.lineWidth = 6; ctx.lineJoin = 'round';
        ctx.beginPath();
        const n = 7;
        for (let j = 0; j <= n * crack; j++) {
          const rr = lerp(r - 4, R + 4, j / n), aa = mid + (hash01(j, 11) - 0.5) * 0.16;
          const px = cx + ox + Math.cos(aa) * rr, py = cy + oy + Math.sin(aa) * rr;
          j ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke(); ctx.restore();
      }
    }
    a0 = a1;
  });
  // center text
  ctx.globalAlpha = clamp(sweep * 1.2 - 0.2);
  text(ctx, 'hundreds', cx, cy - 6, F(40, 400, D), C.ink2, 'center');
  text(ctx, 'of companies', cx, cy + 40, F(40, 400, D), C.ink2, 'center');
  ctx.globalAlpha = 1;
  // honey: sheet comes down from the top on "honey", one drip reaches the slice on "trap"
  const th = w('hook1', 9) - 0.35;
  if (t > th) {
    const k = ease(t, th, th + 0.6, E.outCubic);
    const base = lerp(-60, 150, k);
    // slice position (top of the slice) for the main drip
    let aa = rot; for (let i = 0; i < NV; i++) aa += SLICES[i] * M.TAU;
    const midNV = aa + SLICES[NV] * M.TAU / 2;
    const tx = cx + Math.cos(midNV) * (R + 40), ty = cy + Math.sin(midNV) * (R - 30);
    const g = clamp((t - (th + 0.25)) / 0.75);
    const main = { x: tx, w: 54, len: Math.min(ty - base, (ty - base) * g * g * 1.15) };
    const drips = [{ x: 120, w: 38, len: 120 * ease(t, th + 0.3, th + 1.6) }, { x: 330, w: 30, len: 70 * ease(t, th + 0.4, th + 1.4) },
      main, { x: 930, w: 44, len: 160 * ease(t, th + 0.2, th + 1.8) }];
    honey(ctx, -10, base, drips);
    // where the drip meets the slice, it pools
    if (main.len >= ty - base - 2) {
      const pool = ease(t, th + 1.0, th + 1.6);
      ctx.fillStyle = C.honey; ctx.beginPath(); ctx.ellipse(tx, ty + 10, 70 * pool, 26 * pool, midNV + Math.PI / 2, 0, M.TAU); ctx.fill();
    }
  }
}

// ---- 2. "…not why Washington is worried": the Capitol dome draws on
function dome(ctx, x, y, s, p) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const seg = (a, b) => clamp((p - a) / (b - a));
  const line = (pts, q) => {
    if (q <= 0) return;
    let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    ctx.setLineDash([L * q, L + 1]);
    ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.stroke();
  };
  // ground + wings
  line([[-420, 0], [420, 0]], seg(0, 0.15));
  line([[-400, 0], [-400, -110], [400, -110], [400, 0]], seg(0.05, 0.3));
  for (let i = 0; i < 9; i++) line([[-120 + i * 30, 0], [-120 + i * 30, -110]], seg(0.15 + i * 0.015, 0.3 + i * 0.015));
  line([[-150, -110], [0, -165], [150, -110]], seg(0.25, 0.4));
  // drum
  line([[-170, -165], [-170, -330], [170, -330], [170, -165]], seg(0.35, 0.55));
  for (let i = 0; i < 11; i++) line([[-150 + i * 30, -175], [-150 + i * 30, -320]], seg(0.45 + i * 0.01, 0.6 + i * 0.01));
  line([[-190, -330], [190, -330]], seg(0.5, 0.6));
  // dome
  const arc = []; for (let i = 0; i <= 40; i++) { const a = Math.PI + (i / 40) * Math.PI; arc.push([Math.cos(a) * 165, -340 + Math.sin(a) * 175]); }
  line(arc, seg(0.55, 0.8));
  for (const f of [-0.6, -0.25, 0.25, 0.6]) {
    const rib = []; for (let i = 0; i <= 20; i++) { const a = Math.PI * 1.5 + f * (i / 20) * Math.PI * 0.5; rib.push([Math.cos(a) * 165 * Math.abs(Math.sin(a - Math.PI)) * 0 + f * 165 * Math.sin((i / 20) * Math.PI / 2) , -340 - 175 * Math.sin((i / 20) * Math.PI / 2) * (1 - Math.abs(f) * 0.15)]); }
  }
  line([[-100, -490], [-100, -470]], 0);
  // lantern + statue
  line([[-26, -512], [-26, -575], [26, -575], [26, -512]], seg(0.75, 0.88));
  line([[0, -575], [0, -625]], seg(0.85, 0.95));
  ctx.setLineDash([]);
  ctx.restore();
}
function shotDome(ctx, t, IMG) {
  paper(ctx, IMG);
  const p = ease(t, CUT.dc0 - 0.05, CUT.dc0 + 1.3, E.outCubic);
  // push into the lantern at the end
  const z = Math.exp(Math.log(9) * ease(t, 6.85, CUT.ask, E.inCubic));
  const lx = CX, ly = 920 - 600 * 0.95;
  ctx.save(); M.zoomAbout(ctx, z, lx, ly + 40);
  dome(ctx, CX, 920, 0.95, p);
  ctx.restore();
  const k = sp(t, w('hook2', 4) - 0.1, SPRING.gentle);
  if (k > 0 && z < 2) {
    ctx.globalAlpha = clamp(k * 1.4) * clamp(2 - z);
    const f = F(132, 400, D);
    ctx.font = f; const tw = ctx.measureText('Washington').width;
    hilite(ctx, CX - tw / 2, 1010, tw, 110, ease(t, w('hook2', 4), w('hook2', 4) + 0.35));
    text(ctx, 'Washington', CX, 1100 + (1 - k) * 40, f, C.ink, 'center');
    const k2 = sp(t, w('hook2', 5), SPRING.gentle);
    ctx.globalAlpha = clamp(k2 * 1.4) * clamp(2 - z);
    text(ctx, 'is worried.', CX, 1210 + (1 - k2) * 30, F(84, 400, D), C.ink2, 'center');
    ctx.globalAlpha = 1;
  }
}

// ---- 3. turn: "What does Nvidia actually sell?"
function shotAsk(ctx, t, IMG) {
  paper(ctx, IMG);
  // the real building, as a print at the top; the question card lands under it
  const kp = sp(t, CUT.ask - 0.05, SPRING.snappy);
  const z = Math.exp(lerp(0, Math.log(1.1), prog(t, CUT.ask, CUT.chips)));
  photoPrint(ctx, IMG.hq, 90, lerp(-700, 290, clamp(kp)), 900, 560, { rot: 0.02, fx: 0.4, fy: 0.62, zoom: 1.25 * z,
    credit: 'Photo: Coolcaesar / CC BY-SA 4.0' });
  ctx.globalAlpha = clamp(kp * 1.5);
  label(ctx, 'Nvidia HQ · Santa Clara, California', CX, 905, 30, C.ink2, 'center');
  ctx.globalAlpha = 1;
  const k = sp(t, CUT.ask + 0.25, SPRING.bouncy);
  const y = lerp(1950, 950, clamp(k));
  const rot = lerp(0.2, -0.02, clamp(k)) + 0.03 * M.wobble(t - CUT.ask - 0.5, 1.8, 4);
  withRot(ctx, CX, y + 160, rot, 1, () => {
    card(ctx, 110, y, 860, 330, { seed: 3 });
    para(ctx, 'What does Nvidia actually sell?', 160, y + 125, F(84, 400, D), 780, 94, C.ink,
      { sell: ease(t, w('turn', 7), w('turn', 7) + 0.3) });
  });
}

// ---- 4. chips: one chip, then the grid of the world's AI
function shotChips(ctx, t, IMG) {
  paper(ctx, IMG);
  const t0 = CUT.chips;
  const k = sp(t, t0 + 0.05, SPRING.bouncy);
  const zoom = Math.exp(lerp(0, Math.log(0.24), ease(t, w('chips1', 5) - 0.1, w('chips1', 10), E.inOutCubic)));
  const cx = CX, cy = 780, S = 420;
  const glow = M.bump(t, w('chips1', 3) + 0.15, 0.35) * 0.6;
  // the grid: cells appear as the camera pulls back, centre outward
  const cols = 9, rows = 13, gap = S * 1.35;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const di = i - 4, dj = j - 6;
    if (di === 0 && dj === 0) continue;
    const d = Math.hypot(di, dj);
    const kk = sp(t, w('chips1', 5) + d * 0.09, SPRING.snappy);
    if (kk <= 0) continue;
    const x = cx + di * gap * zoom, y = cy + dj * gap * zoom;
    if (x < -200 || x > W + 200 || y < -200 || y > H + 200) continue;
    chip(ctx, x, y, S * zoom * clamp(kk), { glow: M.bump(t, w('chips1', 10) + 0.2 + d * 0.03, 0.3) * 0.8 });
  }
  chip(ctx, cx, cy, S * zoom * clamp(k) * (1 + 0.04 * glow), { glow, rot: (1 - clamp(k)) * 0.4 });
  // headline on a paper band so it reads over the grid
  const kt = sp(t, w('chips1', 5), SPRING.gentle);
  if (kt > 0) {
    ctx.globalAlpha = clamp(kt * 1.5);
    card(ctx, 70, 290 - (1 - kt) * 40, 940, 250, { seed: 5, shadow: 0.2 });
    para(ctx, "The chips behind much of the world's AI", CX, 395 - (1 - kt) * 40, F(80, 400, D), 860, 92, C.ink,
      { ai: ease(t, w('chips1', 10), w('chips1', 10) + 0.3) }, 'center');
    ctx.globalAlpha = 1;
  } else {
    const kl = sp(t, w('chips1', 3), SPRING.gentle);
    ctx.globalAlpha = clamp(kl);
    label(ctx, 'One Nvidia AI chip', CX, 1100, 36, C.ink2, 'center');
    ctx.globalAlpha = 1;
  }
}

// ---- 5. export limits: the map
let MAP = null, MAPP = null;
function shotMap(ctx, t, IMG) {
  paper(ctx, IMG);
  if (!MAPP) return;
  const t0 = CUT.map;
  const zin = Math.exp(lerp(Math.log(1.8), Math.log(1.32), ease(t, t0, t0 + 1.6, E.outCubic)));
  const z = zin * Math.exp(lerp(0, Math.log(0.9), ease(t, 16.9, CUT.memo, E.inCubic)));
  const mx = (MAP.us[0] + MAP.cn[0]) / 2, my = (MAP.us[1] + MAP.cn[1]) / 2 + 20;
  const ox = CX - mx * z, oy = 800 - my * z;
  ctx.save(); ctx.translate(ox, oy); ctx.scale(z, z);
  ctx.lineWidth = 0.8 / z * 2; ctx.strokeStyle = C.paper;
  for (const [name, p] of MAPP) {
    const hot = name === 'United States of America' || name === 'China';
    ctx.fillStyle = hot ? C.ink : '#D6CCB8';
    ctx.fill(p); ctx.stroke(p);
  }
  ctx.restore();
  const P2 = (q) => [ox + q[0] * z, oy + q[1] * z];
  const [ux, uy] = P2(MAP.us), [cxn, cyn] = P2(MAP.cn);
  // labels
  const kl = sp(t, t0 + 0.2, SPRING.gentle);
  ctx.globalAlpha = clamp(kl);
  label(ctx, 'U.S.', ux, uy + 150, 40, C.ink, 'center');
  label(ctx, 'China', cxn, cyn + 150, 40, C.ink, 'center');
  ctx.globalAlpha = 1;
  // arc from U.S. to China, dashed, drawing on
  const ctrl = [(ux + cxn) / 2, Math.min(uy, cyn) - 260];
  const q = (s) => [(1 - s) ** 2 * ux + 2 * (1 - s) * s * ctrl[0] + s * s * cxn, (1 - s) ** 2 * uy + 2 * (1 - s) * s * ctrl[1] + s * s * cyn];
  const BAR = 0.52;
  const pa = ease(t, w('chips2', 0), w('chips2', 6), E.inOutCubic) * BAR;
  ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.setLineDash([18, 14]); ctx.lineCap = 'round';
  ctx.beginPath(); for (let i = 0; i <= 60; i++) { const s = (i / 60) * pa; const [a, b] = q(s); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); } ctx.stroke();
  ctx.restore();
  // barrier
  const kb = sp(t, w('chips2', 6), SPRING.bouncy);
  const [bx, by] = q(BAR + 0.03);
  if (kb > 0) {
    ctx.save(); ctx.translate(bx, by);
    ctx.fillStyle = C.honey; rrect(ctx, -14, -150 * kb, 28, 300 * kb, 6); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.strokeRect(-14, -150 * kb, 28, 300 * kb);
    ctx.restore();
    ctx.globalAlpha = clamp(kb);
    card(ctx, bx - 460, by - 175, 420, 110, { seed: 9, shadow: 0.18 });
    label(ctx, 'U.S. export limits', bx - 250, by - 105, 36, C.ink, 'center');
    ctx.globalAlpha = 1;
  }
  // a chip rides the arc and stops at the barrier
  const pc = ease(t, w('chips2', 3), w('chips2', 8), E.inQuad);
  if (pc > 0) {
    const s = Math.min(pc * BAR, BAR - 0.015);
    const [a, b] = q(s);
    const hit = w('chips2', 8);
    ctx.save(); M.shake(ctx, t * 10, hit * 10, 10, 4, 0.25);
    chip(ctx, a, b, 70, { rot: 0.2 * M.ring(t - hit, 3, 6) });
    ctx.restore();
  }
  const kh = sp(t, w('chips2', 2) - 0.2, SPRING.gentle);
  ctx.globalAlpha = clamp(kh);
  para(ctx, 'So strategic, the U.S. limits which ones China can buy', CX, TOP + 70, F(66, 400, D), 960, 80, C.ink,
    { limits: ease(t, w('chips2', 6), w('chips2', 6) + 0.3) }, 'center');
  ctx.globalAlpha = 1;
}

function silhouette(ctx, x, y, s) {
  ctx.fillStyle = '#CFC4AF';
  ctx.beginPath(); ctx.arc(x, y - s * 0.22, s * 0.2, 0, M.TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x, y + s * 0.3, s * 0.36, s * 0.3, 0, Math.PI, 0); ctx.fill();
  text(ctx, '?', x, y - s * 0.12, F(s * 0.26, 400, D), C.card, 'center');
}
// ---- 6. Nov 8: the CEO, then his message to staff (redacted card, paraphrase only)
function shotMemo(ctx, t, IMG) {
  paper(ctx, IMG);
  const tp = w('admit', 3) - 0.1;                       // portrait drops on "Nvidia's CEO"
  const kp = sp(t, tp, SPRING.snappy);
  const km = sp(t, w('admit', 7) - 0.2, SPRING.snappy); // memo slides up on "told staff"
  // the date first, big; it shrinks to the photo's corner when the photo lands
  const ks = sp(t, w('admit', 1), SPRING.bouncy);
  if (kp < 0.02) {
    label(ctx, 'Sunday', CX, 640, 40, C.mute, 'center');
    stamp(ctx, 'NOV 8, 2026', CX, 800, -0.06, ks, 92);
  }
  if (kp > 0) {
    const y = lerp(-1300, 300, clamp(kp));
    const z = Math.exp(lerp(0, Math.log(1.08), prog(t, tp, CUT.dossier)));
    photoPrint(ctx, IMG.jhS, 110, y, 860, 920, { rot: -0.025, fx: 0.5, fy: 0.28, zoom: z,
      credit: 'Photo: Anderseidesvik / CC BY-SA 4.0' });
    stamp(ctx, 'NOV 8', 840, y + 40, 0.12, 1, 60);
    // lower third: name
    const kn = sp(t, w('admit', 5) - 0.1, SPRING.snappy);
    if (kn > 0) {
      const x = lerp(-900, 80, clamp(kn));
      ctx.fillStyle = C.night; ctx.fillRect(x, y + 690, 700, 150);
      ctx.fillStyle = C.honey; ctx.fillRect(x, y + 690, 12, 150);
      text(ctx, 'JENSEN HUANG', x + 44, y + 762, F(60, 800, UI), C.white, 'left', 3);
      text(ctx, 'Co-founder & CEO, Nvidia', x + 44, y + 812, F(34, 600, UI), C.honey);
    }
  }
  if (km > 0) {
    ctx.fillStyle = `rgba(19,18,16,${0.35 * clamp(km)})`; ctx.fillRect(0, 0, W, H);
    const y = lerp(1950, 760, clamp(km)), x = 130;
    withRot(ctx, x + 410, y + 240, 0.02, 1, () => {
      card(ctx, x, y, 820, 500, { seed: 13, shadow: 0.3 });
      label(ctx, 'Message to Nvidia staff', x + 50, y + 70, 30, C.mute);
      ctx.fillStyle = C.rule; ctx.fillRect(x + 50, y + 92, 720, 3);
      [0.9, 0.62].forEach((f, i) => {
        const p = ease(t, w('admit', 7) + i * 0.15, w('admit', 7) + 0.4 + i * 0.15);
        ctx.fillStyle = C.ink; ctx.fillRect(x + 50, y + 125 + i * 54, 720 * f * p, 30);
      });
      ctx.globalAlpha = ease(t, w('admit', 9) - 0.3, w('admit', 9));
      label(ctx, 'In summary', x + 50, y + 265, 26, C.mute);
      ctx.globalAlpha = 1;
      const line1 = typed('He had been unfaithful', t, w('admit', 9), 30);
      const line2 = typed('to his wife.', t, w('admit', 9) + 22 / 30, 30);
      const f2 = F(62, 400, D); ctx.font = f2;
      hilite(ctx, x + 46, y + 300, ctx.measureText(line1).width, 62, ease(t, w('admit', 12), w('admit', 12) + 0.4));
      text(ctx, line1, x + 50, y + 350, f2, C.ink);
      text(ctx, line2, x + 50, y + 420, f2, C.ink);
      source(ctx, 'Huang’s note to staff, via Axios', x + 50, y + 475, ease(t, w('admit', 13), w('admit', 15)));
    });
  }
}

// ---- 7a. the NYT report: the subject card
function shotDossier(ctx, t, IMG) {
  paper(ctx, IMG);
  label(ctx, 'According to', 90, TOP + 30, 32, C.mute);
  text(ctx, 'The New York Times', 90, TOP + 110, F(76, 400, D), C.ink);
  const ka = sp(t, w('nyt', 6), SPRING.bouncy);
  const ax = 70, ay = 460, aw = 940, ah = 430;
  if (ka > 0) withRot(ctx, ax + aw / 2, ay, -0.015 * (2 - clamp(ka)), lerp(0.75, 1, clamp(ka)), () => {
    ctx.globalAlpha = clamp(ka * 2);
    card(ctx, ax, ay, aw, ah, { seed: 21 });
    silhouette(ctx, ax + 160, ay + 210, 260);
    label(ctx, 'The woman', ax + 330, ay + 100, 30, C.mute);
    text(ctx, typed('Alice Huang', t, w('nyt', 12) - 0.05, 30), ax + 330, ay + 190, F(84, 400, D), C.ink);
    ctx.globalAlpha = clamp(ka * 2) * ease(t, w('nyt', 13) + 0.1, w('nyt', 13) + 0.5);
    text(ctx, 'No relation to Jensen Huang', ax + 330, ay + 255, F(36, 600, UI), C.mute);
    text(ctx, 'No photo shown: identity', ax + 330, ay + 340, F(28, 400, UI), C.mute);
    text(ctx, 'and allegations unverified', ax + 330, ay + 378, F(28, 400, UI), C.mute);
    ctx.globalAlpha = 1;
  });
  stamp(ctx, 'SUSPECTED', 290, 1010, -0.08, sp(t, w('nyt', 9), SPRING.bouncy), 56);
  ctx.globalAlpha = ease(t, w('nyt', 9) + 0.2, w('nyt', 9) + 0.6);
  text(ctx, 'by U.S. authorities', 290, 1100, F(36, 600, UI), C.ink2, 'center');
  ctx.globalAlpha = 1;
}

// ---- 7b. the map: Singapore (the customer) -> Beijing (the ministry)
function shotAsia(ctx, t, IMG) {
  paper(ctx, IMG);
  if (!MAPP) return;
  const t0 = CUT.asia;
  const { sg, bj } = MAP.pts;
  const z = Math.exp(lerp(Math.log(1.6), Math.log(4.2), ease(t, t0 - 0.05, t0 + 1.0, E.inOutCubic)));
  const mx = (sg[0] + bj[0]) / 2 + 12, my = (sg[1] + bj[1]) / 2;
  const ox = CX - mx * z, oy = 800 - my * z;
  ctx.save(); ctx.translate(ox, oy); ctx.scale(z, z);
  ctx.lineWidth = 1.2 / z; ctx.strokeStyle = C.paper;
  for (const [name, p] of MAPP) { ctx.fillStyle = name === 'China' ? '#BFB29A' : '#D6CCB8'; ctx.fill(p); ctx.stroke(p); }
  ctx.restore();
  const P2 = (q) => [ox + q[0] * z, oy + q[1] * z];
  const [sx, sy] = P2(sg), [bx, by] = P2(bj);
  label(ctx, 'The alleged link', 90, TOP + 40, 34, C.ink);
  // pins
  const pin = (x, y, k, name, left) => {
    if (k <= 0) return;
    const r = 16 * clamp(k);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.globalAlpha = 1 - ((t * 0.8) % 1);
    ctx.beginPath(); ctx.arc(x, y, r + 30 * ((t * 0.8) % 1), 0, M.TAU); ctx.stroke(); ctx.globalAlpha = 1;
    label(ctx, name, left ? x - 34 : x + 34, y + 12, 32, C.ink, left ? 'right' : 'left');
  };
  const ksg = sp(t, w('nyt', 14) - 0.1, SPRING.bouncy), kbj = sp(t, w('nyt', 23) - 0.15, SPRING.bouncy);
  // the line: drawn on "was recruited"
  const pl = ease(t, w('nyt', 20), w('nyt', 23), E.inOutCubic);
  if (pl > 0) {
    ctx.save(); ctx.strokeStyle = C.honeyD; ctx.lineWidth = 8; ctx.setLineDash([22, 14]); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(lerp(sx, bx, pl), lerp(sy, by, pl)); ctx.stroke(); ctx.restore();
    ctx.globalAlpha = ease(t, w('nyt', 21), w('nyt', 21) + 0.4);
    const mxl = lerp(sx, bx, 0.5), myl = lerp(sy, by, 0.5);
    ctx.save(); ctx.translate(mxl - 28, myl); ctx.rotate(Math.atan2(by - sy, bx - sx));
    text(ctx, 'RECRUITED? (ALLEGED)', 0, 0, F(28, 800, UI), C.ink, 'center', 2); ctx.restore();
    ctx.globalAlpha = 1;
  }
  pin(sx, sy, ksg, 'Singapore', true);
  pin(bx, by, kbj, 'Beijing', true);
  // Singapore card: the customer
  if (ksg > 0) withRot(ctx, 760, 1090, 0.02, lerp(0.7, 1, clamp(ksg)), () => {
    ctx.globalAlpha = clamp(ksg * 2);
    const x = 520, y = 900, cw = 490, ch = 360;
    card(ctx, x, y, cw, ch, { seed: 81, shadow: 0.22 });
    M.cover(ctx, IMG.sg, x + 14, y + 14, cw - 28, 160, { fx: 0.5, fy: 0.35 });
    creditTag(ctx, 'Photo: DvTor8303 / CC0', x + cw - 22, y + 166);
    silhouette(ctx, x + 70, y + 255, 110);
    text(ctx, 'Alice Huang', x + 140, y + 236, F(46, 400, D), C.ink);
    text(ctx, 'Executive, Megaspeed', x + 140, y + 280, F(28, 600, UI), C.ink2);
    ctx.font = F(28, 800, UI); const tw = ctx.measureText('AN NVIDIA CUSTOMER').width;
    hilite(ctx, x + 140, y + 300, tw, 34, ease(t, w('nyt', 19), w('nyt', 19) + 0.3));
    text(ctx, 'AN NVIDIA CUSTOMER', x + 140, y + 328, F(28, 800, UI), C.ink, 'left');
    ctx.globalAlpha = 1;
  });
  // Beijing card: the ministry
  if (kbj > 0) withRot(ctx, 800, 470, -0.02, lerp(0.7, 1, clamp(kbj)), () => {
    ctx.globalAlpha = clamp(kbj * 2);
    const x = 560, y = 330, cw = 450, ch = 300;
    card(ctx, x, y, cw, ch, { seed: 83, shadow: 0.22 });
    if (IMG.mss) ctx.drawImage(IMG.mss, x + 24, y + 30, 150, 150);
    label(ctx, 'China’s', x + 196, y + 62, 28, C.mute);
    para(ctx, 'Ministry of State Security', x + 196, y + 115, F(44, 400, D), 230, 50, C.ink,
      { security: ease(t, w('nyt', 27), w('nyt', 27) + 0.3) });
    text(ctx, 'Insignia: public domain', x + 24, y + 270, F(20, 600, UI), C.mute);
    ctx.globalAlpha = 1;
  });
}

// ---- 8. the alleged goal
function shotGoal(ctx, t, IMG) {
  paper(ctx, IMG);
  const t0 = CUT.goal;
  const k = sp(t, t0 - 0.05, SPRING.snappy);
  const y = lerp(1900, 360, clamp(k));
  card(ctx, 80, y, 920, 800, { seed: 31, rot: 0.015 });
  label(ctx, 'The alleged goal', 140, y + 100, 40, C.ink);
  // pencil underline on "alleged"
  const pu = ease(t, w('goal', 1), w('goal', 1) + 0.35);
  if (pu > 0) {
    ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(140 + 105, y + 118);
    for (let i = 1; i <= 20 * pu; i++) ctx.lineTo(140 + 105 + i * 11, y + 118 + Math.sin(i * 1.7) * 3);
    ctx.stroke();
  }
  const items = [['Learn about Huang', w('goal', 3)], ['Influence his views on selling AI chips to China', w('goal', 7)]];
  let yy = y + 250;
  items.forEach(([s, ti], i) => {
    const ki = sp(t, ti - 0.1, SPRING.snappy);
    if (ki <= 0) { yy += 200; return; }
    ctx.globalAlpha = clamp(ki * 1.5);
    const bx = 140 + (1 - clamp(ki)) * 40;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.strokeRect(bx, yy - 48, 56, 56);
    const tk = ease(t, ti + 0.1, ti + 0.4);
    if (tk > 0) {
      ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.beginPath();
      ctx.moveTo(bx + 10, yy - 22); ctx.lineTo(bx + 24, yy - 6);
      if (tk > 0.4) ctx.lineTo(bx + 24 + 36 * (tk - 0.4) / 0.6, yy - 6 - 56 * (tk - 0.4) / 0.6);
      ctx.stroke();
    }
    const r = para(ctx, s, bx + 100, yy, F(64, 400, D), 680, 76, C.ink,
      i === 1 ? { chips: ease(t, w('goal', 13), w('goal', 13) + 0.3), china: ease(t, w('goal', 15), w('goal', 15) + 0.3) } : {});
    ctx.globalAlpha = 1;
    yy += Math.max(200, r.h + 110);
  });
  source(ctx, 'U.S. authorities’ suspicion, per The New York Times', 140, y + 740, ease(t, t0 + 1, t0 + 1.5));
}

// ---- 9. "If true, that's a textbook honey trap."
function shotTrap(ctx, t, IMG) {
  fill(ctx, C.honey);
  if (IMG.paperTex) { ctx.globalAlpha = 0.5; ctx.drawImage(IMG.paperTex, 0, 0); ctx.globalAlpha = 1; }
  const tw0 = w('trap', 0);
  const k0 = sp(t, tw0 - 0.05, SPRING.gentle);
  ctx.globalAlpha = clamp(k0 * 1.5);
  text(ctx, 'If true, it’s a textbook', CX, 640, F(64, 400, D), C.ink, 'center');
  ctx.globalAlpha = 1;
  const words = [['HONEY', w('trap', 5), 860], ['TRAP', w('trap', 6), 1110]];
  ctx.save(); M.shake(ctx, t * 10, w('trap', 6) * 10, 14, 5, 0.3);
  for (const [s, ti, y] of words) {
    const k = sp(t, ti - 0.04, SPRING.bouncy);
    if (k <= 0) continue;
    const size = 260;
    const f = F(size, 800, UI);
    const L = layout(ctx, s, f, -6);
    const sc = lerp(2.2, 1, clamp(k)) + 0.06 * M.wobble(t - ti - 0.15, 3, 6);
    ctx.save(); ctx.translate(CX, y); ctx.scale(sc, sc);
    ctx.globalAlpha = clamp(k * 2);
    text(ctx, s, 0, 0, f, C.ink, 'center', -6);
    ctx.restore();
    // drips from the letters (darker honey), growing after the slam
    if (s === 'TRAP') {
      const g = ease(t, ti + 0.1, ti + 1.6, E.outCubic);
      ctx.fillStyle = C.ink;
      [[-0.35, 90], [-0.08, 160], [0.22, 70], [0.4, 120]].forEach(([fx, len], i) => {
        const x = CX + fx * L.width, r = 14;
        ctx.beginPath(); ctx.moveTo(x - r, y - 4); ctx.lineTo(x - r, y + len * g); ctx.arc(x, y + len * g, r, Math.PI, 0, true); ctx.lineTo(x + r, y - 4); ctx.fill();
      });
    }
  }
  ctx.restore();
}

// ---- 10. both denials
function shotDeny(ctx, t, IMG) {
  paper(ctx, IMG);
  const mid = 790;
  ctx.fillStyle = C.paper2; ctx.fillRect(0, mid, W, H - mid);
  if (IMG.paperTex) { ctx.save(); ctx.beginPath(); ctx.rect(0, mid, W, H - mid); ctx.clip(); ctx.globalAlpha = 0.6; ctx.drawImage(IMG.paperTex, 0, 0); ctx.restore(); }
  // honey drains off the top as the shot opens
  const drain = ease(t, CUT.deny, CUT.deny + 0.55, E.inCubic);
  // top: China
  const ka = sp(t, w('deny', 0) - 0.05, SPRING.snappy);
  const xa = lerp(-1000, 0, clamp(ka));
  label(ctx, 'China', 90 + xa, TOP + 50, 36, C.ink);
  para(ctx, 'Calls the “spy story” unsubstantiated', 90 + xa, TOP + 160, F(76, 400, D), 880, 88, C.ink,
    { unsubstantiated: ease(t, w('deny', 5), w('deny', 5) + 0.45) });
  source(ctx, 'Chinese foreign ministry', 90 + xa, TOP + 440, ease(t, w('deny', 5) + 0.3, w('deny', 5) + 0.8));
  // bottom: the board
  const kb = sp(t, w('deny', 6) - 0.05, SPRING.snappy);
  const xb = lerp(1000, 0, clamp(kb));
  label(ctx, 'Nvidia’s board', 90 + xb, mid + 110, 36, C.ink);
  para(ctx, '“No reason to believe” secrets were compromised', 90 + xb, mid + 220, F(76, 400, D), 880, 88, C.ink,
    { no: ease(t, w('deny', 11), w('deny', 11) + 0.2), reason: ease(t, w('deny', 12), w('deny', 12) + 0.2),
      to: ease(t, w('deny', 13), w('deny', 13) + 0.2), believe: ease(t, w('deny', 14), w('deny', 14) + 0.25) });
  source(ctx, 'Board statement, Nov 8', 90 + xb, mid + 470, ease(t, w('deny', 17), w('deny', 17) + 0.5));
  if (drain < 1) honey(ctx, -10, lerp(H, -40, drain), [{ x: 200, w: 40, len: 80 }, { x: 760, w: 54, len: 140 }]);
}

// ---- 11. "Then it got worse."
function shotWorse(ctx, t, IMG) {
  fill(ctx, C.night);
  const ws = [['Then', w('worse', 0)], ['it', w('worse', 1)], ['got', w('worse', 2)]];
  const f = F(120, 400, D);
  ctx.font = f;
  const parts = ws.map(([s]) => ctx.measureText(s + ' ').width);
  const total = parts.reduce((a, b) => a + b, 0);
  let x = CX - total / 2;
  ws.forEach(([s, ti], i) => {
    const k = sp(t, ti - 0.03, SPRING.snappy);
    if (k > 0) { ctx.globalAlpha = clamp(k * 2); text(ctx, s, x, 860 + (1 - clamp(k)) * 30, f, C.white); }
    x += parts[i];
  });
  const k = sp(t, w('worse', 3) - 0.03, SPRING.bouncy);
  if (k > 0) {
    ctx.globalAlpha = clamp(k * 2);
    const sc = lerp(1.5, 1, clamp(k));
    ctx.save(); ctx.translate(CX, 1080); ctx.scale(sc, sc);
    text(ctx, 'worse.', 0, 0, F(220, 400, D), C.honey, 'center');
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ---- 12-13. two clippings
function clipping(ctx, t, ti, y, rot, kicker, body, src, hl, seed) {
  const k = sp(t, ti, SPRING.bouncy);
  if (k <= 0) return;
  const sc = lerp(1.35, 1, clamp(k));
  ctx.save(); M.shake(ctx, t * 10, (ti + 0.08) * 10, 8, seed, 0.2);
  withRot(ctx, CX, y + 150, rot, sc, () => {
    ctx.globalAlpha = clamp(k * 2.5);
    const nl = wrap(ctx, body, F(74, 400, D), 840).length;
    card(ctx, 70, y, 940, 250 + nl * 84, { seed, shadow: 0.22 });
    label(ctx, kicker, 120, y + 80, 30, C.mute);
    para(ctx, body, 120, y + 175, F(74, 400, D), 840, 84, C.ink, hl);
    source(ctx, src, 120, y + 175 + nl * 84 + 10, 1);
    ctx.globalAlpha = 1;
  });
  ctx.restore();
}
function shotClips(ctx, t, IMG) {
  fullBleed(ctx, IMG.jhCBg, t, CUT.clips, CUT.money, { fx: 0.5, fy: 0.4, z0: 1.0, z1: 1.1, dark: 0.45,
    credit: 'Photo: NVIDIA Taiwan / CC BY 2.0' });
  const out = ease(t, CUT.money - 0.35, CUT.money + 0.1, E.inCubic);
  ctx.save(); ctx.translate(0, out * 1400);
  clipping(ctx, t, CUT.clips + 0.05, 320, -0.03, 'Report', 'A second relationship, with an Nvidia vice president',
    'The New York Times', { second: ease(t, w('second', 4), w('second', 4) + 0.3) }, 41);
  clipping(ctx, t, w('wsj', 0), 830, 0.035, 'Report', 'Nvidia’s board preparing to oust Huang',
    'The Wall Street Journal', { oust: ease(t, w('wsj', 10), w('wsj', 10) + 0.3) }, 43);
  ctx.restore();
}

// ---- 14. the money
function shotMoney(ctx, t, IMG) {
  paper(ctx, IMG);
  const t0 = CUT.money;
  const kl = sp(t, w('money', 2) - 0.1, SPRING.gentle);
  ctx.globalAlpha = clamp(kl * 1.4);
  label(ctx, 'Nvidia market value lost', CX, TOP + 120, 38, C.ink, 'center');
  ctx.globalAlpha = 1;
  const p = ease(t, w('money', 5), w('money', 8) + 0.1, E.outExpo);
  const v = Math.round(450 * p);
  const s = `$${v},000,000,000`;
  const k = sp(t, w('money', 5) - 0.1, SPRING.snappy);
  if (k > 0) {
    ctx.globalAlpha = clamp(k * 2);
    const f = F(100, 400, D);
    ctx.save(); ctx.translate(CX, 640); const sc = 1 + 0.05 * M.wobble(t - w('money', 8) - 0.1, 2.5, 6); ctx.scale(sc, sc);
    ctx.font = f; const tw = ctx.measureText('$450,000,000,000+').width;
    hilite(ctx, -tw / 2, -84, tw, 106, ease(t, w('money', 8) + 0.05, w('money', 8) + 0.45));
    text(ctx, s + (v >= 450 ? '+' : ''), 0, 0, f, C.ink, 'center');
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  // a big down arrow, drawing on as "vanished" is said
  const pa = ease(t, w('money', 9), w('money', 12) + 0.3, E.inOutCubic);
  if (pa > 0) {
    ctx.strokeStyle = C.ink; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const x0 = 300, y0 = 850, x1 = 760, y1 = 1220;
    const pts = [[x0, y0], [440, 980], [520, 940], [x1, y1]];
    let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    ctx.setLineDash([L * pa, L]);
    ctx.beginPath(); pts.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b))); ctx.stroke(); ctx.setLineDash([]);
    if (pa > 0.95) {
      ctx.fillStyle = C.ink; ctx.beginPath();
      const ang = Math.atan2(y1 - 940, x1 - 520);
      ctx.moveTo(x1 + Math.cos(ang) * 40, y1 + Math.sin(ang) * 40);
      ctx.lineTo(x1 + Math.cos(ang + 2.4) * 70, y1 + Math.sin(ang + 2.4) * 70);
      ctx.lineTo(x1 + Math.cos(ang - 2.4) * 70, y1 + Math.sin(ang - 2.4) * 70);
      ctx.fill();
    }
  }
  source(ctx, 'since Nov 8, per CBS News', CX, 770, ease(t, w('money', 3), w('money', 4) + 0.3), 'center');
}

// ---- 15-16. Washington split: the President / Congress
function shotDC(ctx, t, IMG) {
  paper(ctx, IMG);
  const t0 = CUT.dc;
  const mid = 790;
  const split = ease(t, w('trump', 1) - 0.1, w('trump', 1) + 0.4, E.outCubic);
  ctx.fillStyle = C.paper2; ctx.fillRect(0, mid, W * split, H - mid);
  // the split line, drawn left to right
  ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, mid);
  for (let x = 0; x <= W * split; x += 36) ctx.lineTo(x, mid + (hash01(x, 3) - 0.5) * 14); ctx.stroke();
  const kh = sp(t, t0 + 0.05, SPRING.gentle);
  ctx.globalAlpha = clamp(kh * 1.5);
  text(ctx, 'Washington, split', 90, TOP + 70, F(70, 400, D), C.ink);
  ctx.globalAlpha = 1;
  // top: the President
  const ka = sp(t, w('trump', 2) - 0.1, SPRING.snappy);
  if (ka > 0) {
    ctx.globalAlpha = clamp(ka * 2);
    photoPrint(ctx, IMG.trump, 680, TOP + 60, 320, 400, { rot: 0.045, fx: 0.5, fy: 0.22, zoom: 1.15, b: 12,
      s: lerp(1.3, 1, clamp(ka)), credit: 'White House / PD' });
    label(ctx, 'The President', 90, TOP + 180, 32, C.mute);
    para(ctx, '“An honorable guy.”', 90, TOP + 270, F(76, 400, D), 560, 84, C.ink,
      { honorable: ease(t, w('trump', 7), w('trump', 7) + 0.3), guy: ease(t, w('trump', 8), w('trump', 8) + 0.25) });
    ctx.globalAlpha = ease(t, w('trump', 10), w('trump', 10) + 0.3);
    text(ctx, 'Says Huang should stay as CEO', 90, TOP + 420, F(34, 600, UI), C.ink2);
    source(ctx, 'President Trump, Nov 9', 90, TOP + 470, 1);
    ctx.globalAlpha = 1;
  }
  // bottom: Congress, a calendar page flips in
  const kc = sp(t, w('house', 0) - 0.05, SPRING.bouncy);
  if (kc > 0) {
    ctx.globalAlpha = clamp(kc * 2);
    label(ctx, 'Congress', 90, mid + 100, 32, C.mute);
    para(ctx, '3 House committee chairs ask Huang for a closed-door briefing', 90, mid + 180, F(52, 400, D), 520, 62, C.ink,
      { 'closeddoor': ease(t, w('house', 8), w('house', 10) + 0.3) });
    source(ctx, 'Reps. Moolenaar, Mast and Crawford', 90, mid + 490, ease(t, w('house', 10), w('house', 11)));
    // calendar
    const cx = 800, cy = mid + 260;
    const flip = clamp(kc);
    ctx.save(); ctx.translate(cx, cy - 170); ctx.scale(1, flip); ctx.translate(-cx, -(cy - 170));
    card(ctx, cx - 170, cy - 170, 340, 360, { seed: 51, rot: 0.04 });
    ctx.fillStyle = C.ink; ctx.fillRect(cx - 170, cy - 170, 340, 80);
    label(ctx, 'Nov', cx, cy - 112, 40, C.white, 'center');
    text(ctx, '18', cx, cy + 115, F(180, 400, D), C.ink, 'center');
    ctx.restore();
    // circled in honey
    const pc = ease(t, w('house', 12), w('house', 13) + 0.35);
    if (pc > 0) {
      ctx.strokeStyle = C.honeyD; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.ellipse(cx, cy + 50, 135, 110, -0.2, -0.6, -0.6 + M.TAU * 1.05 * pc); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

// ---- 17. "Here's why it matters."
function shotWhy(ctx, t, IMG) {
  paper(ctx, IMG);
  const ws = [['So', w('why', 0)], ['here’s', w('why', 1)], ['why', w('why', 2)], ['it', w('why', 3)], ['matters.', w('why', 4)]];
  const f = F(118, 400, D);
  const lines = [[0, 1, 2], [3, 4]];
  lines.forEach((li, r) => {
    ctx.font = f;
    const strs = li.map((i) => ws[i][0]);
    const widths = strs.map((s) => ctx.measureText(s + ' ').width);
    let x = CX - (widths.reduce((a, b) => a + b, 0) - ctx.measureText(' ').width) / 2;
    li.forEach((i, j) => {
      const k = sp(t, ws[i][1] - 0.05, SPRING.bouncy);
      if (k > 0) {
        const y = 700 + r * 140 + (1 - clamp(k)) * 60;
        if (i === 4) hilite(ctx, x, y - 100, ctx.measureText('matters.').width, 120, ease(t, ws[i][1] + 0.1, ws[i][1] + 0.45));
        ctx.globalAlpha = clamp(k * 2); text(ctx, ws[i][0], x, y, f, C.ink); ctx.globalAlpha = 1;
      }
      x += widths[j];
    });
  });
}

// ---- 18. the target
function shotTarget(ctx, t, IMG) {
  paper(ctx, IMG);
  const t0 = CUT.target;
  const z = Math.exp(lerp(0, Math.log(1.3), ease(t, w('center', 16), CUT.question, E.inOutCubic)));
  const cx = CX, cy = 760;
  ctx.save(); M.zoomAbout(ctx, z, cx, cy);
  M.shake(ctx, t * 10, (w('center', 13) + 0.3) * 10, 12, 8, 0.3);
  for (let i = 5; i >= 1; i--) {
    const k = sp(t, t0 + (5 - i) * 0.08, SPRING.snappy);
    if (k <= 0) continue;
    ctx.beginPath(); ctx.arc(cx, cy, i * 74 * clamp(k), 0, M.TAU);
    ctx.fillStyle = i % 2 ? C.paper2 : C.card; ctx.fill();
    ctx.strokeStyle = C.rule; ctx.lineWidth = 3; ctx.stroke();
  }
  const kc = sp(t, w('center', 4) - 0.05, SPRING.bouncy);
  if (kc > 0) {
    const r = 118 * clamp(kc);
    ctx.beginPath(); ctx.arc(cx, cy, r + 10, 0, M.TAU); ctx.fillStyle = C.ink; ctx.fill();
    if (IMG.jhSC) M.cover(ctx, IMG.jhSC, cx - r, cy - r, 2 * r, 2 * r, { fx: 0.64, fy: 0.3, zoom: 2.4, radius: r });
    const fl = M.bump(t, w('center', 13) + 0.3, 0.4);
    if (fl > 0) { ctx.strokeStyle = C.honey; ctx.lineWidth = 14 * fl; ctx.beginPath(); ctx.arc(cx, cy, r + 16, 0, M.TAU); ctx.stroke(); }
  }
  // the arrow flies in on "targeted"
  const ta = w('center', 13) - 0.15;
  const pa = ease(t, ta, ta + 0.42, E.inQuad);
  if (pa > 0) {
    const ang = -0.75, L = 520;
    const tipD = lerp(1300, 150, pa);
    const tx = cx + Math.cos(ang) * tipD, ty = cy + Math.sin(ang) * tipD;
    const wob = pa >= 1 ? 0.05 * M.ring(t - ta - 0.42, 4, 5) : 0;
    ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang + wob);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L, 0); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(16, -26); ctx.lineTo(16, 26); ctx.fill();
    ctx.fillStyle = C.honey;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(L - 90, 0); ctx.lineTo(L - 10, s * 44); ctx.lineTo(L + 20, s * 44); ctx.lineTo(L - 50, 0); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
  // labels outside the zoom so they stay sharp and in place
  const kl = sp(t, w('center', 6) - 0.1, SPRING.gentle);
  ctx.globalAlpha = clamp(kl * 1.4);
  card(ctx, 140, 1150, 800, 110, { seed: 61, shadow: 0.14 });
  label(ctx, 'America’s AI chip business', CX, 1222, 38, C.ink, 'center');
  ctx.globalAlpha = ease(t, w('center', 16), w('center', 16) + 0.35);
  card(ctx, 470, 290, 540, 160, { seed: 63, rot: 0.03, shadow: 0.14 });
  label(ctx, 'An alleged foreign', 740, 355, 32, C.ink, 'center');
  label(ctx, 'influence operation', 740, 405, 32, C.ink, 'center');
  ctx.globalAlpha = 1;
}

// ---- 19. the real question
function shotQuestion(ctx, t, IMG) {
  paper(ctx, IMG);
  const kh = sp(t, w('q', 0) - 0.05, SPRING.gentle);
  ctx.globalAlpha = clamp(kh * 1.5);
  para(ctx, 'The question for Nvidia’s board:', 90, TOP + 90, F(70, 400, D), 900, 82, C.ink);
  ctx.globalAlpha = 1;
  const ka = sp(t, w('q', 2), SPRING.bouncy);
  if (ka > 0) withRot(ctx, CX, 640, -0.02, lerp(0.8, 1, clamp(ka)), () => {
    ctx.globalAlpha = clamp(ka * 2);
    card(ctx, 110, 520, 860, 220, { seed: 71 });
    const f = F(88, 400, D); ctx.font = f; const tw = ctx.measureText('National security').width;
    hilite(ctx, CX - tw / 2, 590, tw, 100, ease(t, w('q', 2) + 0.2, w('q', 2) + 0.6));
    text(ctx, 'National security', CX, 670, f, C.ink, 'center');
    ctx.globalAlpha = 1;
  });
  const kb = sp(t, w('q', 6) - 0.05, SPRING.bouncy);
  if (kb > 0) withRot(ctx, CX, 960, 0.025, lerp(0.8, 1, clamp(kb)), () => {
    ctx.globalAlpha = clamp(kb * 2) * lerp(1, 0.55, ease(t, w('q', 8), w('q', 8) + 0.4));
    card(ctx, 160, 860, 760, 200, { seed: 73, color: '#F3EEE3' });
    const f = F(80, 400, D); ctx.font = f; const tw = ctx.measureText('His marriage').width;
    text(ctx, 'His marriage', CX, 985, f, C.ink2, 'center');
    const ps = ease(t, w('q', 8), w('q', 8) + 0.3);
    ctx.globalAlpha = 1;
    if (ps > 0) { ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(CX - tw / 2 - 20, 962); ctx.lineTo(CX - tw / 2 - 20 + (tw + 40) * ps, 955); ctx.stroke(); }
  });
  // exit: cards slide off left into the end card
  return ease(t, CUT.end - 0.3, CUT.end + 0.15, E.inCubic);
}

// ---- 20. end card
function shotEnd(ctx, t, IMG) {
  paper(ctx, IMG);
  const t0 = CUT.end;
  ctx.globalAlpha = 1;
  label(ctx, 'As of Nov 12, 2026', CX, TOP + 120, 36, C.ink2, 'center');
  text(ctx, 'Nvidia’s board', CX, TOP + 240, F(84, 400, D), C.ink, 'center');
  ctx.globalAlpha = 1;
  stamp(ctx, 'DECISION: PENDING', CX, 700, -0.08, sp(t, w('end', 6) - 0.05, SPRING.bouncy), 72);
  const kf = sp(t, w('end', 7) - 0.05, SPRING.bouncy);
  if (kf > 0) {
    ctx.globalAlpha = clamp(kf * 2);
    const y = 960 + (1 - clamp(kf)) * 40;
    rrect(ctx, CX - 330, y - 70, 660, 120, 60); ctx.fillStyle = C.ink; ctx.fill();
    text(ctx, 'Follow for the update', CX, y + 10, F(50, 800, UI), C.honey, 'center');
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = ease(t, w('end', 9), w('end', 10) + 0.5);
  text(ctx, 'Sources: The New York Times, The Wall Street Journal,', CX, 1180, F(28, 400, UI), C.mute, 'center');
  text(ctx, 'CBS News, Axios, CNBC, Reuters. Allegations are unproven.', CX, 1222, F(28, 400, UI), C.mute, 'center');
  text(ctx, 'Photos via Wikimedia Commons: Anderseidesvik (CC BY-SA 4.0), NVIDIA Taiwan (CC BY 2.0),', CX, 1268, F(22, 400, UI), C.mute, 'center');
  text(ctx, 'Raysonho (CC0), Coolcaesar (CC BY-SA 4.0), DvTor8303 (CC0), White House (public domain).', CX, 1298, F(22, 400, UI), C.mute, 'center');
  ctx.globalAlpha = 1;
}

// ================================================================ captions (script words, Whisper timing)
const FIX = { 'wong,': 'Huang,', 'costs': 'cost', 'nvidia': 'Nvidia', "nvidia's": 'Nvidia’s', '8,': '8,', '18.': '18.' };
const CAPS = (() => {
  const out = [];
  for (const p of VO) {
    const ws = [];
    for (const x of p.words) {
      let s = x.w;
      if ((s.startsWith('.') || s.startsWith('-')) && ws.length) { ws[ws.length - 1].w += s; ws[ws.length - 1].t1 = x.t1; continue; }
      s = FIX[s.toLowerCase()] ?? s;
      ws.push({ w: s.replace(/'/g, '’'), t0: x.t0, t1: x.t1 });
    }
    // chunks of up to 3 words / 18 chars, breaking after punctuation
    let cur = [];
    const flush = () => { if (cur.length) out.push({ id: p.id, words: cur }); cur = []; };
    for (const x of ws) {
      cur.push(x);
      const len = cur.map((c) => c.w).join(' ').length;
      if (cur.length >= 3 || len >= 16 || /[.,:?]$/.test(x.w)) flush();
    }
    flush();
  }
  out.forEach((c, i) => {
    c.t0 = c.words[0].t0 - 0.06;
    const next = out[i + 1];
    const end = c.words[c.words.length - 1].t1 + 0.35;
    c.t1 = next && next.t0 < end ? next.t0 : end;
  });
  return out;
})();
const NO_CAPS = new Set(['trap', 'worse', 'why']);
function captions(ctx, t) {
  const c = CAPS.find((c) => t >= c.t0 && t < c.t1);
  if (!c || NO_CAPS.has(c.id)) return;
  const f = F(60, 800, UI);
  ctx.font = f;
  const sp_ = ctx.measureText(' ').width;
  const widths = c.words.map((x) => ctx.measureText(x.w).width);
  const tw = widths.reduce((a, b) => a + b, 0) + sp_ * (c.words.length - 1);
  const k = spring(t - c.t0, SPRING.snappy);
  const y = 1400, padX = 34;
  ctx.save(); ctx.translate(CX, y); ctx.scale(lerp(0.92, 1, clamp(k)), lerp(0.92, 1, clamp(k))); ctx.translate(-CX, -y);
  ctx.globalAlpha = clamp(k * 3);
  rrect(ctx, CX - tw / 2 - padX, y - 58, tw + padX * 2, 96, 22); ctx.fillStyle = 'rgba(19,18,16,0.92)'; ctx.fill();
  let x = CX - tw / 2;
  c.words.forEach((wd, i) => {
    const on = t >= wd.t0 - 0.03;
    text(ctx, wd.w, x, y + 6, f, on ? (t < (c.words[i + 1]?.t0 ?? wd.t1 + 0.2) ? C.honey : C.white) : 'rgba(251,248,241,0.45)');
    x += widths[i] + sp_;
  });
  ctx.restore();
}

// ================================================================ the film
const SHOTS = {
  hook: shotHook, dc0: shotDome, ask: shotAsk, chips: shotChips, map: shotMap, memo: shotMemo, dossier: shotDossier,
  asia: shotAsia, goal: shotGoal, trap: shotTrap, deny: shotDeny, worse: shotWorse, clips: shotClips, money: shotMoney, dc: shotDC,
  why: shotWhy, target: shotTarget, question: shotQuestion, end: shotEnd,
};

function draw(ctx, u, t, IMG) {
  // transitions that keep both shots on screen
  if (t >= 4.55 && t < 5.45) {            // honey wipe: hook -> dome
    wipeDown(ctx, t, 4.55, 0.9, 520, () => shotHook(ctx, t, IMG), () => shotDome(ctx, Math.max(t, CUT.dc0), IMG),
      (a, b) => {
        honey(ctx, a + 40, b, [{ x: 250, w: 50, len: 90 }, { x: 700, w: 40, len: 60 }]);
        ctx.fillStyle = C.honey; ctx.beginPath(); ctx.moveTo(0, a + 60);
        for (let x = 0; x <= W; x += 30) ctx.lineTo(x, a + 30 + 16 * Math.sin(x * 0.011 + 0.7) + 8 * Math.sin(x * 0.029));
        ctx.lineTo(W, a + 60); ctx.closePath(); ctx.fill();
      });
  } else if (t >= 40.25 && t < 41.0) {    // honey rises: goal -> trap
    wipeUp(ctx, t, 40.25, 0.75, 400, () => shotGoal(ctx, t, IMG), () => shotTrap(ctx, Math.max(t, CUT.trap), IMG),
      (a, b) => { ctx.fillStyle = C.honey; ctx.fillRect(0, a, W, b - a); });
  } else if (t >= CUT.dossier - 0.3 && t < CUT.dossier + 0.2) {   // push: memo -> dossier
    const p = E.inOutCubic(prog(t, CUT.dossier - 0.3, CUT.dossier + 0.2));
    ctx.save(); ctx.translate(-p * W, 0); shotMemo(ctx, Math.min(t, CUT.dossier - 0.01), IMG); ctx.restore();
    ctx.save(); ctx.translate((1 - p) * W, 0); shotDossier(ctx, Math.max(t, CUT.dossier), IMG); ctx.restore();
  } else if (t >= CUT.end - 0.3 && t < CUT.end + 0.15) {   // slide: question -> end
    const p = E.inOutCubic(prog(t, CUT.end - 0.3, CUT.end + 0.15));
    ctx.save(); ctx.translate(-p * W, 0); shotQuestion(ctx, Math.min(t, CUT.end - 0.01), IMG); ctx.restore();
    ctx.save(); ctx.translate((1 - p) * W, 0); shotEnd(ctx, Math.max(t, CUT.end), IMG); ctx.restore();
  } else {
    SHOTS[shotAt(t)](ctx, t, IMG);
  }
  captions(ctx, t);
}

M.film({
  fonts: [F(100, 400, D), F(40, 400, UI), F(40, 600, UI), F(40, 800, UI)],
  hits: HITS,
  samples: 6,
  images: { hq: 'assets/photos/nvidia_hq.jpg', jhS: 'assets/photos/jh_stanford.jpg', jhC: 'assets/photos/jh_computex.jpg',
    jhSC: 'assets/photos/jh_sc18.jpg', sg: 'assets/photos/singapore.jpg', mss: 'assets/photos/mss.png', trump: 'assets/photos/trump.jpg' },
  async init(ctx, IMG) {
    MAP = await fetch('assets/map.json').then((r) => r.json());
    MAPP = Object.entries(MAP.countries).map(([k, d]) => [k, new Path2D(d)]);
    // newsprint texture: fibres + mottling, seeded
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); const rnd = mulberry32(1112);
    for (let i = 0; i < 260; i++) {
      const x = rnd() * W, y = rnd() * H, r = 80 + rnd() * 320;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      const a = 0.008 + rnd() * 0.01;
      g.addColorStop(0, rnd() < 0.5 ? `rgba(120,95,55,${a})` : `rgba(255,252,240,${a * 1.4})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    c.strokeStyle = 'rgba(90,70,40,0.035)'; c.lineWidth = 1;
    for (let i = 0; i < 1600; i++) {
      const x = rnd() * W, y = rnd() * H, a = rnd() * M.TAU, l = 6 + rnd() * 26;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + 0.5) * l * 0.5, y + Math.sin(a + 0.5) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke();
    }
    // vignette
    const vg = c.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, H * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,40,10,0.08)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    IMG.paperTex = cv;
    // documentary grade, baked once: slightly desaturated + warm; backgrounds also blurred
    const bake = (im, filter) => {
      if (!im) return null;
      const c2 = document.createElement('canvas'); c2.width = im.width; c2.height = im.height;
      const x2 = c2.getContext('2d'); x2.filter = filter; x2.drawImage(im, 0, 0); return c2;
    };
    const grade = 'grayscale(0.28) sepia(0.16) contrast(1.06)';
    for (const k of ['jhS', 'jhC', 'jhSC', 'sg', 'trump']) IMG[k] = bake(IMG[k], grade) || IMG[k];
    IMG.hqBg = bake(IMG.hq, grade + ' blur(3px)');
    IMG.jhCBg = bake(IMG.jhC, grade + ' blur(2.5px)');
    // grain tiles
    IMG.grain = [];
    for (let g = 0; g < 6; g++) {
      const gc = document.createElement('canvas'); gc.width = 256; gc.height = 256;
      const gx = gc.getContext('2d'); const id = gx.createImageData(256, 256); const r2 = mulberry32(77 + g);
      for (let i = 0; i < id.data.length; i += 4) { const v = r2() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
      gx.putImageData(id, 0, 0); IMG.grain.push(gc);
    }
  },
  post(ctx, u, t, IMG) {
    if (!IMG.grain) return;
    const g = IMG.grain[Math.floor(t * 24) % IMG.grain.length];
    ctx.save(); ctx.globalAlpha = 0.045; ctx.globalCompositeOperation = 'overlay';
    const pat = ctx.createPattern(g, 'repeat'); ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  },
  draw,
});
