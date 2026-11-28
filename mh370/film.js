// MH370: The Plane That Vanished. A pure function of time: window.seek(t) paints frame t.
// Timing is in beats (u) on the 72 bpm grid in beats.json (1 beat = 0.833 s); docs/shotlist.md is the plan.
// Look: newsprint paper, ink map (Natural Earth 1:50m, assets/map.json), red string, typewriter captions.
import * as M from './lib/motion.js';

const { W, H, E, prog, lerp, clamp, springU, SPRING, font, layout, text, glyph, wobble, mulberry32, hash01, noise1 } = M;

// ---------------------------------------------------------------- tokens
const C = {
  paper: '#EADFC6', sheet: '#F3ECDB', land: '#F6F0E2', ink: '#1C1914', ink2: '#57503F', faint: '#A39882',
  red: '#B3261E',
};
const DISPLAY = 'Display', UI = 'UI';
const fD = (s) => font(s, 900, DISPLAY);
const fDi = (s) => `italic 700 ${Math.round(s)}px ${DISPLAY}`;
const fU = (s, w = 700) => font(s, w, UI);
const fUi = (s) => `italic 400 ${Math.round(s)}px ${UI}`;
const CY = 1060;            // screen y of the map camera centre
const TX = 84;              // caption text left edge

// ---------------------------------------------------------------- hits (picture accents -> sfx.mjs)
const HITS = [
  [0, 'newspaper lands', 'impact', { gain: 0.5 }],
  [0.9, 'VANISHED slams', 'thud'],
  [2.4, 'sub-line types', 'type', { n: 26, len: 1.4 }],
  [7.4, 'push into headline', 'whoosh', { len: 0.7, from: 300, to: 1800 }],
  [8, 'MH370 lands', 'thud', { pitch: 90 }],
  [12, 'MISSING stamp', 'impact', { gain: 0.45 }],
  [12.7, 'subtitle types', 'type', { n: 22, len: 1.2 }],
  [15.7, 'whip to the map', 'whoosh', { len: 0.5 }],
  [16.2, 'KL pin', 'pop', { pitch: 'A5' }],
  [16.6, 'caption types', 'type', { n: 40, len: 2.0 }],
  [20, 'data card', 'click'],
  [24, 'transcript slip', 'whoosh', { len: 0.35, from: 2400, to: 700 }],
  [25, 'slip pinned', 'tick'],
  [25.4, 'quote types', 'type', { n: 30, len: 2.6 }],
  [32, 'ATC radar', 'blip', { pitch: 'A5', gain: 0.12 }],
  [33, 'ATC radar', 'blip', { pitch: 'A5', gain: 0.12 }],
  [32.6, 'caption types', 'type', { n: 44, len: 2.4 }],
  [34, 'ATC radar', 'blip', { pitch: 'A5', gain: 0.12 }],
  [35, 'ATC radar', 'blip', { pitch: 'A5', gain: 0.12 }],
  [36, 'transponder off', 'sub', { len: 1.4 }],
  [40, 'string pulls', 'whoosh', { len: 0.5, from: 300, to: 1100 }],
  [40.6, 'caption types', 'type', { n: 44, len: 2.4 }],
  [46, 'Penang pin', 'pop', { pitch: 'E5' }],
  [48.6, 'caption types', 'type', { n: 22, len: 1.2 }],
  [52, 'LAST SEEN pin', 'thud'],
  [54.5, 'pull back', 'whoosh', { len: 1.4, from: 2200, to: 300 }],
  [56.6, 'caption types', 'type', { n: 48, len: 2.8 }],
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => [58 + i * 1.33, `handshake ${i + 1}`, 'blip', { pitch: i === 6 ? 'A5' : 'E6', gain: 0.16 }]),
  ...[0, 1, 2, 3, 4, 5].map((i) => [68 + i, `arc ${i + 1}`, 'tick']),
  [74, '7th arc', 'bell', { pitch: 'D6', gain: 0.22 }],
  [80.6, 'caption types', 'type', { n: 30, len: 1.6 }],
  [84, 'north crossed out', 'thud'],
  [85.5, 'caption swap', 'whoosh', { len: 0.3, from: 2400, to: 800 }],
  [86.5, 'south route', 'whoosh', { len: 0.8, from: 400, to: 1400 }],
  [90.5, 'dive to the arc', 'whoosh', { len: 1.2, from: 1800, to: 300 }],
  [92.6, 'caption types', 'type', { n: 40, len: 2.2 }],
  [98, 'nothing', 'thud', { pitch: 70 }],
  [98.8, 'slide west', 'whoosh', { len: 0.9 }],
  [100.6, 'caption types', 'type', { n: 30, len: 1.6 }],
  [102, 'flaperon card', 'click'],
  [106, 'CONFIRMED stamp', 'impact', { gain: 0.45 }],
  ...[0, 1, 2, 3, 4].map((i) => [107.5 + i * 0.8, `debris pin ${i + 1}`, 'pop', { pitch: ['C6', 'D6', 'E6', 'F6', 'A6'][i], gain: 0.2 }]),
  [111.6, 'report slides in', 'whoosh', { len: 0.5 }],
  [113, 'report quote types', 'type', { n: 40, len: 2.0 }],
  [115.4, 'highlighter', 'whoosh', { len: 0.6, from: 3000, to: 5000 }],
  [119.6, 'report out', 'whoosh', { len: 0.5, from: 1600, to: 400 }],
  [120.6, 'caption types', 'type', { n: 48, len: 2.6 }],
  [126, 'quote slip pinned', 'tick'],
  [126.4, 'quote types', 'type', { n: 26, len: 1.4 }],
  [138, '239 people', 'thud', { pitch: 60, gain: 0.3 }],
];

// ---------------------------------------------------------------- geo
const R2D = 180 / Math.PI, D2R = Math.PI / 180;
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * D2R) / 2)) * R2D;
// destination on the sphere from (lat0, lon0) at angular distance th (deg) and azimuth az (deg)
function dest(lat0, lon0, th, az) {
  const p1 = lat0 * D2R, d = th * D2R, a = az * D2R;
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(a));
  const l2 = lon0 * D2R + Math.atan2(Math.sin(a) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return [l2 * R2D, p2 * R2D];
}
function gcDist(lat1, lon1, lat2, lon2) {
  const a = Math.sin(((lat2 - lat1) * D2R) / 2) ** 2 + Math.cos(lat1 * D2R) * Math.cos(lat2 * D2R) * Math.sin(((lon2 - lon1) * D2R) / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(a)) * R2D;
}
function azimuth(lat1, lon1, lat2, lon2) {
  const p1 = lat1 * D2R, p2 = lat2 * D2R, dl = (lon2 - lon1) * D2R;
  return Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) * R2D;
}

// Places (lon, lat). Positions after the transponder went dark are approximate / illustrative.
const P = {
  KUL: [101.71, 2.75], IGARI: [103.585, 6.936], PEN: [100.3, 5.3], LAST: [96.4, 6.7], SAT: [64.5, 0],
  REU: [55.5, -21.1], MRU: [57.6, -20.3], ROD: [63.4, -19.7], PEMBA: [39.7, -5.1], MOZ: [35.4, -23.9], MDG: [47.1, -25.0],
};
const SOUTH_END = [92.5, -35.5];
const TH7 = gcDist(0, 64.5, SOUTH_END[1], SOUTH_END[0]);
const TH1 = gcDist(0, 64.5, P.LAST[1] - 0.3, P.LAST[0] - 0.5);
const ARC_TH = [0, 1, 2, 3, 4, 5, 6].map((k) => lerp(TH1, TH7, (k / 6) ** 0.9));
const AZ_SOUTH = azimuth(0, 64.5, SOUTH_END[1], SOUTH_END[0]);
const NORTH_END = dest(0, 64.5, TH7, 26);
const ringPts = (th, az0, az1, n = 90) => Array.from({ length: n + 1 }, (_, i) => dest(0, 64.5, th, lerp(az0, az1, i / n)));
const ARCS = ARC_TH.map((th) => ringPts(th, 12, 168, 120));
// the flight: planned route, then the turn back seen by military radar (approximate)
const ROUTE_ACTUAL = [[103.75, 7.15], [103.95, 7.0], [103.65, 6.72], [102.3, 6.15], [101.3, 5.65], [100.3, 5.3],
  [99.5, 5.72], [98.4, 6.15], [97.3, 6.48], P.LAST];
const PLANNED_BEYOND = [108.8, 12.6];

// ---------------------------------------------------------------- camera
// keys [beat, lon, lat, zoom px/deg]; zoom interpolates in log space, centre with the same ease
const CAM = [
  [15.5, 101.2, 3.9, 92], [24, 102.3, 5.3, 98], [31, 102.7, 5.9, 100], [38, 102.7, 6.1, 102], [44, 100.9, 6.0, 94],
  [52, 99.1, 6.1, 90], [54.2, 99.1, 6.1, 90], [58.5, 86, -2, 11.5], [68, 86.5, -2.5, 11.8], [79.5, 86.5, -2.5, 11.8],
  [82, 88, 7, 10.5], [90.2, 88.5, 6.5, 10.8], [93.2, 92.8, -34.6, 50], [98.6, 92.6, -34.8, 52], [101.2, 50.5, -17.3, 26],
  [111, 50.5, -17.6, 26.5], [119.5, 50.5, -17.6, 26.5], [121, 95.0, -31.2, 29], [131, 95.0, -31.6, 30], [144, 95, -31.6, 30],
];
function camAt(u) {
  let i = 0;
  while (i < CAM.length - 2 && u > CAM[i + 1][0]) i++;
  const [u0, x0, l0, z0] = CAM[i], [u1, x1, l1, z1] = CAM[i + 1];
  const p = E.inOutCubic(prog(u, u0, u1));
  const z = z0 * (z1 / z0) ** p;
  // when zooming, move the centre with the zoom (constant-rate dolly feel)
  const q = z0 === z1 ? p : (z - z0) / (z1 - z0);
  const x = lerp(x0, x1, q), y = lerp(-mercY(l0), -mercY(l1), q);
  const dx = noise1(u * 0.15, 4) * 0.02 * (60 / z), dy = noise1(u * 0.15, 9) * 0.02 * (60 / z);
  return { x: x + dx, y: y + dy, z };
}
const proj = (cam, [lon, lat]) => [W / 2 + (lon - cam.x) * cam.z, CY + (-mercY(lat) - cam.y) * cam.z];

// ---------------------------------------------------------------- prebuilt (init)
const PRE = {};
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function buildPaper(w, h, base, seed) {
  const cv = makeCanvas(w, h), c = cv.getContext('2d');
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  const r = mulberry32(seed);
  // blotches (stains / uneven pulp)
  for (let i = 0; i < 70; i++) {
    const x = r() * w, y = r() * h, rad = 60 + r() * 260;
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    const dark = r() < 0.5;
    g.addColorStop(0, dark ? 'rgba(120,90,40,0.05)' : 'rgba(255,250,235,0.07)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // fibres
  c.lineCap = 'round';
  for (let i = 0; i < 2600; i++) {
    const x = r() * w, y = r() * h, len = 4 + r() * 16, a = r() * Math.PI;
    c.strokeStyle = r() < 0.6 ? `rgba(90,70,40,${0.04 + r() * 0.06})` : `rgba(255,255,245,${0.08 + r() * 0.1})`;
    c.lineWidth = 0.6 + r() * 0.9;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); c.stroke();
  }
  // speckle
  const img = c.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 14;
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
  }
  c.putImageData(img, 0, 0);
  return cv;
}

function buildStamp(word, color, w, h, seed) {
  const cv = makeCanvas(w, h), c = cv.getContext('2d');
  c.strokeStyle = color; c.fillStyle = color;
  c.lineWidth = 12; c.strokeRect(10, 10, w - 20, h - 20);
  c.lineWidth = 4; c.strokeRect(26, 26, w - 52, h - 52);
  const size = Math.min(h * 0.62, (w - 90) / (word.length * 0.78));
  c.font = fD(size); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.letterSpacing = `${size * 0.06}px`;
  c.fillText(word, w / 2, h / 2 + size * 0.06);
  // ink wear: knock holes out
  const r = mulberry32(seed);
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) {
    c.globalAlpha = 0.25 + r() * 0.75;
    c.beginPath(); c.arc(r() * w, r() * h, 0.6 + r() * 2.6, 0, Math.PI * 2); c.fill();
  }
  for (let i = 0; i < 14; i++) {
    c.globalAlpha = 0.5;
    c.lineWidth = 1 + r() * 3;
    c.beginPath(); const y = r() * h; c.moveTo(0, y); c.lineTo(w, y + (r() - 0.5) * 30); c.stroke();
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  return cv;
}

function buildGrain(seed) {
  const s = 512, cv = makeCanvas(s, s), c = cv.getContext('2d');
  const img = c.createImageData(s, s), d = img.data, r = mulberry32(seed);
  for (let i = 0; i < d.length; i += 4) {
    const v = r() * 255;
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 18;
  }
  c.putImageData(img, 0, 0);
  return cv;
}

function buildVignette() {
  const cv = makeCanvas(W, H), c = cv.getContext('2d');
  const g = c.createRadialGradient(W / 2, H * 0.48, H * 0.3, W / 2, H * 0.5, H * 0.75);
  g.addColorStop(0, 'rgba(60,40,15,0)'); g.addColorStop(1, 'rgba(60,40,15,0.30)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  return cv;
}

function buildMapPaths(map) {
  const land = new Path2D(), borders = new Path2D(), grat = new Path2D();
  for (const ring of map.rings) {
    ring.forEach(([lon, lat], i) => (i ? land.lineTo(lon, -mercY(lat)) : land.moveTo(lon, -mercY(lat))));
    land.closePath();
  }
  for (const line of map.borders) line.forEach(([lon, lat], i) => (i ? borders.lineTo(lon, -mercY(lat)) : borders.moveTo(lon, -mercY(lat))));
  for (let lon = 10; lon <= 140; lon += 10) { grat.moveTo(lon, -mercY(-60)); grat.lineTo(lon, -mercY(60)); }
  for (let lat = -60; lat <= 60; lat += 10) { grat.moveTo(10, -mercY(lat)); grat.lineTo(140, -mercY(lat)); }
  return { land, borders, grat };
}

// ---------------------------------------------------------------- drawing helpers
function wrap(ctx, str, f, maxW) {
  const key = `${f}|${maxW}|${str}`;
  wrap.cache ??= new Map();
  if (wrap.cache.has(key)) return wrap.cache.get(key);
  ctx.font = f;
  const words = str.split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  wrap.cache.set(key, lines);
  return lines;
}

// typewriter: lines revealed at cpb characters per beat from u0; returns chars shown
function typeLines(ctx, lines, x, y, lh, f, color, u, u0, cpb = 30, cursor = true) {
  let n = Math.max(0, Math.floor((u - u0) * cpb));
  const total = lines.reduce((a, l) => a + l.length, 0);
  ctx.font = f; ctx.fillStyle = color; ctx.textAlign = 'left';
  let cx = x, cy = y;
  lines.forEach((l, i) => {
    const k = Math.min(l.length, Math.max(0, n));
    if (k > 0 || i === 0) {
      const s = l.slice(0, k);
      ctx.fillText(s, x, y + i * lh);
      if (k > 0 || i === 0) { cx = x + ctx.measureText(s).width; cy = y + i * lh; }
    }
    n -= l.length;
  });
  const shown = Math.min(total, Math.max(0, Math.floor((u - u0) * cpb)));
  if (cursor && u >= u0 && (shown < total || Math.floor((u - u0) * 2.4) % 2 === 0)) {
    const sz = parseInt(f.match(/(\d+)px/)[1], 10);
    ctx.fillRect(cx + 3, cy - sz * 0.72, sz * 0.5, sz * 0.86);
  }
  return shown;
}

function tornRect(ctx, x, y, w, h, seed, jag = 7) {
  const r = mulberry32(seed);
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let px = x; px < x + w; px += 14) ctx.lineTo(px, y + (r() - 0.5) * jag);
  ctx.lineTo(x + w, y);
  for (let py = y; py < y + h; py += 14) ctx.lineTo(x + w + (r() - 0.5) * jag, py);
  ctx.lineTo(x + w, y + h);
  for (let px = x + w; px > x; px -= 14) ctx.lineTo(px, y + h + (r() - 0.5) * jag);
  ctx.lineTo(x, y + h);
  for (let py = y + h; py > y; py -= 14) ctx.lineTo(x + (r() - 0.5) * jag, py);
  ctx.closePath();
}

function paperSlip(ctx, x, y, w, h, seed, color = C.sheet, shadow = 0.28) {
  ctx.save();
  ctx.shadowColor = `rgba(40,25,5,${shadow})`; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
  tornRect(ctx, x, y, w, h, seed);
  ctx.fillStyle = color; ctx.fill();
  ctx.restore();
  // paper texture on the slip
  ctx.save();
  tornRect(ctx, x, y, w, h, seed); ctx.clip();
  ctx.globalAlpha = 0.55;
  ctx.drawImage(PRE.sheetTex, (seed * 37) % 300, (seed * 53) % 600, w, h, x, y, w, h);
  ctx.restore();
}

function pin(ctx, x, y, color = C.red, k = 1) {
  if (k <= 0) return;
  ctx.save();
  ctx.translate(x, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(30,20,5,0.3)';
  ctx.beginPath(); ctx.ellipse(7, 9, 10, 6, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath(); ctx.arc(-4, -4, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function tag(ctx, label, x, y, size = 30, color = C.ink, align = 'left', bg = C.sheet) {
  ctx.font = fU(size);
  const tw = ctx.measureText(label).width, pad = size * 0.4;
  const bx = align === 'left' ? x : align === 'right' ? x - tw - pad * 2 : x - tw / 2 - pad;
  ctx.save();
  ctx.shadowColor = 'rgba(40,25,5,0.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  ctx.fillStyle = bg; ctx.fillRect(bx, y - size * 0.95, tw + pad * 2, size * 1.35);
  ctx.restore();
  ctx.fillStyle = color; ctx.textAlign = 'left';
  ctx.fillText(label, bx + pad, y);
}

// 777 top view, nose +x, length s px
function plane(ctx, x, y, ang, s, color = C.ink, alpha = 1, ghost = false) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.beginPath();
  // fuselage
  ctx.moveTo(0.5, 0); ctx.quadraticCurveTo(0.48, -0.04, 0.42, -0.04); ctx.lineTo(-0.44, -0.035); ctx.lineTo(-0.52, 0);
  ctx.lineTo(-0.44, 0.035); ctx.lineTo(0.42, 0.04); ctx.quadraticCurveTo(0.48, 0.04, 0.5, 0); ctx.closePath();
  // wings
  ctx.moveTo(0.14, -0.035); ctx.lineTo(-0.14, -0.5); ctx.lineTo(-0.21, -0.5); ctx.lineTo(-0.08, -0.035); ctx.closePath();
  ctx.moveTo(0.14, 0.035); ctx.lineTo(-0.14, 0.5); ctx.lineTo(-0.21, 0.5); ctx.lineTo(-0.08, 0.035); ctx.closePath();
  // tailplane
  ctx.moveTo(-0.34, -0.03); ctx.lineTo(-0.47, -0.19); ctx.lineTo(-0.52, -0.19); ctx.lineTo(-0.45, -0.02); ctx.closePath();
  ctx.moveTo(-0.34, 0.03); ctx.lineTo(-0.47, 0.19); ctx.lineTo(-0.52, 0.19); ctx.lineTo(-0.45, 0.02); ctx.closePath();
  if (ghost) {
    ctx.lineWidth = 2 / s; ctx.setLineDash([5 / s, 4 / s]); ctx.strokeStyle = color; ctx.stroke();
  } else {
    ctx.fillStyle = color; ctx.fill();
    // engines
    ctx.beginPath(); ctx.ellipse(0.06, -0.17, 0.06, 0.028, 0, 0, Math.PI * 2); ctx.ellipse(0.06, 0.17, 0.06, 0.028, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// polyline revealed to fraction f (0..1) of its length; points in screen space
function polyReveal(ctx, pts, f) {
  if (f <= 0 || pts.length < 2) return null;
  const seg = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let rem = f * L;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  let head = pts[0], dir = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = seg[i - 1];
    const a = pts[i - 1], b = pts[i];
    dir = Math.atan2(b[1] - a[1], b[0] - a[0]);
    if (rem >= d) { ctx.lineTo(b[0], b[1]); head = b; rem -= d; } else {
      const t = d ? rem / d : 0; head = [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
      ctx.lineTo(head[0], head[1]); break;
    }
  }
  return { head, dir };
}

function redString(ctx, pts, f, width = 5) {
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.translate(3, 5);
  ctx.strokeStyle = 'rgba(40,20,5,0.22)'; ctx.lineWidth = width;
  polyReveal(ctx, pts, f); ctx.stroke();
  ctx.translate(-3, -5);
  ctx.strokeStyle = C.red; ctx.lineWidth = width;
  const r = polyReveal(ctx, pts, f); ctx.stroke();
  // twist highlights
  ctx.strokeStyle = 'rgba(255,200,190,0.35)'; ctx.lineWidth = 1.4; ctx.setLineDash([3, 9]);
  polyReveal(ctx, pts, f); ctx.stroke();
  ctx.restore();
  return r;
}

// smooth a polyline through points (Catmull-Rom -> dense points)
function smooth(pts, n = 8) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const ACTUAL_SMOOTH = smooth(ROUTE_ACTUAL, 10);

// ---------------------------------------------------------------- map layer
const LABELS_NEAR = [
  ['THAILAND', 100.6, 13.2], ['VIETNAM', 107.6, 11.4], ['MALAYSIA', 102.2, 4.0], ['SUMATRA', 99.3, 1.2],
  ['SOUTH CHINA SEA', 106.3, 6.0], ['ANDAMAN SEA', 96.0, 9.6], ['STRAIT OF MALACCA', 97.4, 4.2], ['GULF OF THAILAND', 101.6, 10.4],
];
const LABELS_FAR = [
  ['INDIAN OCEAN', 76, -16], ['AUSTRALIA', 124, -24], ['AFRICA', 40, 6], ['CHINA', 103, 33], ['MADAGASCAR', 46.4, -17.5],
];
const LABELS_DEBRIS = [['AFRICA', 31.0, -12.0], ['MADAGASCAR', 46.3, -18.8], ['INDIAN OCEAN', 66, -9]];

function drawMap(ctx, cam, u, alpha = 1) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = PRE.sea; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2 - cam.x * cam.z, CY - cam.y * cam.z); ctx.scale(cam.z, cam.z);
  ctx.lineWidth = 1 / cam.z; ctx.strokeStyle = 'rgba(87,80,63,0.28)'; ctx.setLineDash([6 / cam.z, 6 / cam.z]);
  ctx.stroke(PRE.paths.grat);
  ctx.setLineDash([]);
  ctx.fillStyle = C.land; ctx.fill(PRE.paths.land, 'evenodd');
  ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.lineWidth = 2.3 / cam.z; ctx.stroke(PRE.paths.land);
  ctx.globalAlpha = alpha * 0.5; ctx.setLineDash([5 / cam.z, 4 / cam.z]); ctx.lineWidth = 1.3 / cam.z;
  ctx.stroke(PRE.paths.borders);
  ctx.restore();
  // place labels, by zoom range
  ctx.globalAlpha = alpha * 0.75;
  const set = cam.z > 45 ? LABELS_NEAR : cam.z > 20 && u > 99 && u < 121 ? LABELS_DEBRIS : cam.z < 20 ? LABELS_FAR : [];
  const sz = cam.z > 45 ? 26 : 28;
  for (const [s, lon, lat] of set) {
    const [x, y] = proj(cam, [lon, lat]);
    if (y < 640 && u > 15) continue; // keep the caption area clean
    text(ctx, s, x, y, fU(sz), C.ink2, 'center', sz * 0.18);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- captions (top of frame)
const CAPS = [
  { u0: 16, u1: 24, ts: '00:41', sub: '8 MARCH 2014 · KUALA LUMPUR', text: 'Flight MH370 takes off for Beijing with 239 people on board.' },
  { u0: 32, u1: 40, ts: '01:21', sub: 'OVER THE SOUTH CHINA SEA', text: 'Near waypoint IGARI, between Malaysia and Vietnam, the transponder goes silent.' },
  { u0: 40, u1: 48, sub: 'MILITARY RADAR', text: 'An unidentified blip crosses back over Malaysia. The plane had turned around.' },
  { u0: 48, u1: 55.4, ts: '02:22', sub: 'ANDAMAN SEA', text: 'The last radar contact. Then — nothing.' },
  { u0: 56, u1: 68, sub: 'SATELLITE DATA', text: 'But the plane kept ‘shaking hands’ with a satellite — about once an hour, for six more hours.' },
  { u0: 68, u1: 74, sub: 'DISTANCE, NOT DIRECTION', text: 'Each ping gave a distance from the satellite: a ring on the map.' },
  { u0: 74, u1: 80, ts: '08:19', sub: 'THE FINAL PING', text: 'One last, partial handshake. The 7th arc.' },
  { u0: 80, u1: 85.5, sub: 'DOPPLER ANALYSIS', text: 'The signal’s frequency shift pointed south, not north.' },
  { u0: 85.5, u1: 92, ts: '24 MARCH', sub: '2014', text: 'Malaysia announces the flight ended in the southern Indian Ocean.' },
  { u0: 92, u1: 98.8, ts: '2014–17', sub: 'AUSTRALIA-LED SEARCH', text: 'A sonar search sweeps the seabed along the 7th arc. Nothing.' },
  { u0: 100, u1: 106.5, ts: 'JULY 2015', sub: 'RÉUNION ISLAND', text: 'A wing flaperon washes ashore. It came from MH370.' },
  { u0: 106.5, u1: 111.8, sub: 'EAST AFRICA', text: 'More pieces turn up along African shores and islands.' },
  { u0: 120, u1: 131, ts: '2018 · 2025–26', sub: 'OCEAN INFINITY · NO FIND, NO FEE', text: 'Two private searches map more than 140,000 km². Still nothing.' },
];
const CAP_SIZE = 48, CAP_LH = 60, CAP_W = 830;

function caption(ctx, u, cap, i) {
  if (u < cap.u0 - 0.7 || u > cap.u1 + 0.7) return;
  const prev = CAPS[i - 1], next = CAPS[i + 1];
  const whipP = (u0) => E.inOutCubic(prog(u, u0 - 0.5, u0 + 0.12));
  const kin = prev && prev.u1 === cap.u0 ? whipP(cap.u0) : springU(u, cap.u0 - 0.35, SPRING.snappy);
  const kout = next && next.u0 === cap.u1 ? whipP(cap.u1) : E.inBack(prog(u, cap.u1 - 0.4, cap.u1 + 0.1), 1.3);
  if (kin <= 0.001 || kout >= 0.999) return;
  const dx = (1 - kin) * -W * 1.05 + kout * W * 1.05;
  const rot = ((i % 2) ? 0.6 : -0.5) * D2R + (1 - kin) * -3 * D2R;
  const lines = wrap(ctx, cap.text, fU(CAP_SIZE), CAP_W);
  const top = 432, h = lines.length * CAP_LH + 40;
  ctx.save();
  ctx.translate(dx, 0);
  // timestamp + sub label
  if (cap.ts) {
    const kt = springU(u, cap.u0 - 0.15, SPRING.bouncy);
    ctx.save(); ctx.translate(TX, 400); ctx.translate(0, (1 - kt) * 40);
    ctx.globalAlpha = clamp(kt * 1.5);
    text(ctx, cap.ts, 0, 0, fD(Math.min(118, M.fitSize(ctx, cap.ts, 900, DISPLAY, 840, 118))), C.ink, 'left', -2);
    ctx.restore();
    text(ctx, cap.sub, TX + 4, 284, fU(33), C.red, 'left', 2);
  } else {
    text(ctx, cap.sub, TX + 4, 396, fU(36), C.red, 'left', 2);
  }
  ctx.translate(540, top + h / 2); ctx.rotate(rot); ctx.translate(-540, -(top + h / 2));
  paperSlip(ctx, 52, top, 976, h, 11 + i * 7);
  typeLines(ctx, lines, TX + 8, top + 60, CAP_LH, fU(CAP_SIZE), C.ink, u, cap.u0 + 0.6, 30);
  ctx.restore();
}

// ---------------------------------------------------------------- S1 hook: the newspaper   (u 0..8)
function sceneHook(ctx, u) {
  ctx.drawImage(PRE.paper, 0, 0);
  const k = springU(u, -0.35, SPRING.snappy);
  const push = E.inExpo(prog(u, 7.0, 8.0));
  const z = 1 * (7 / 1) ** push;
  ctx.save();
  M.shake(ctx, u, 0.9, 10, 5, 0.15);
  // push toward the "777"
  M.zoomAbout(ctx, z * lerp(1.12, 1, k), 790, 690);
  ctx.translate(0, (1 - k) * -120);
  ctx.rotate(-1.2 * D2R);
  // sheet
  ctx.save();
  ctx.shadowColor = 'rgba(40,25,5,0.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = C.sheet; ctx.fillRect(30, 150, 1020, 1640);
  ctx.restore();
  ctx.globalAlpha = 0.6; ctx.drawImage(PRE.sheetTex, 0, 0, 1020, 1640, 30, 150, 1020, 1640); ctx.globalAlpha = 1;
  // masthead rules + dateline (no publication name)
  ctx.fillStyle = C.ink;
  ctx.fillRect(72, 268, 936, 6); ctx.fillRect(72, 282, 936, 2);
  text(ctx, 'SUNDAY, 9 MARCH 2014', 72, 330, fU(30), C.ink, 'left', 1);
  text(ctx, 'LATE EDITION', 1008, 330, fU(30), C.ink, 'right', 1);
  ctx.fillRect(72, 352, 936, 2);
  // headline: line 1 already moving on frame 0, line 2 slams on beat 1.5
  const l1 = 'A BOEING 777', s1 = 128;
  const L1 = layout(ctx, l1, fD(s1), -2);
  const x1 = 540 - L1.width / 2;
  L1.glyphs.forEach((g, j) => {
    const kg = springU(u, -1.1 + j * 0.035, SPRING.bouncy);
    if (kg > 0) glyph(ctx, g.ch, x1 + g.cx, 520 + (1 - kg) * 60, fD(s1), C.ink, 1, kg);
  });
  const l2 = 'VANISHED', s2 = M.fitSize(ctx, 'VANISHED', 900, DISPLAY, 900, 214, -0.02);
  const L2 = layout(ctx, l2, fD(s2), -4);
  const k2 = springU(u, 0.9, SPRING.snappy);
  if (k2 > 0) {
    const sc = lerp(1.7, 1, clamp(k2));
    ctx.save(); ctx.translate(540, 730); ctx.scale(sc, sc); ctx.globalAlpha = clamp(k2 * 3);
    text(ctx, l2, 0, 0, fD(s2), C.ink, 'center', -4);
    ctx.restore();
  }
  ctx.fillRect(72, 790, 936, 3);
  // sub-line types on
  const subl = wrap(ctx, '239 people on board. No wreckage found.', fU(44), 900);
  typeLines(ctx, subl, 82, 866, 56, fU(44), C.ink, u, 2.4, 22, u < 7);
  // halftone illustration: open sea, one aircraft
  const bx = 72, by = 1010, bw = 936, bh = 400;
  ctx.save();
  ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
  ctx.fillStyle = PRE.seaDark; ctx.fillRect(bx, by, bw, bh);
  const g = ctx.createLinearGradient(0, by, 0, by + bh);
  g.addColorStop(0, 'rgba(243,236,219,0.7)'); g.addColorStop(0.45, 'rgba(243,236,219,0.15)'); g.addColorStop(1, 'rgba(243,236,219,0)');
  ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh);
  const px = lerp(260, 820, u / 8);
  plane(ctx, px, by + 150 - u * 4, -8 * D2R, 120, C.ink);
  ctx.restore();
  ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.strokeRect(bx, by, bw, bh);
  text(ctx, 'Illustration', bx, by + bh + 38, fUi(26), C.ink2);
  // body columns (greeked)
  ctx.fillStyle = 'rgba(28,25,20,0.32)';
  const r = mulberry32(7);
  for (let col = 0; col < 3; col++) for (let ln = 0; ln < 10; ln++) {
    const w = 290 - (ln === 9 ? 120 : r() * 30);
    ctx.fillRect(72 + col * 318, 1490 + ln * 24, w, 9);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- S2 title   (u 8..16)
function sceneTitle(ctx, u) {
  ctx.drawImage(PRE.sheetTex, 0, 0);
  const k = springU(u, 7.95, SPRING.gentle);
  const sc = 4.5 ** (1 - clamp(k));
  ctx.save();
  ctx.translate(540, 980); ctx.scale(sc, sc);
  text(ctx, 'MH370', 0, 0, fD(300), C.ink, 'center', -6);
  ctx.restore();
  const kf = springU(u, 8.6, SPRING.snappy);
  ctx.globalAlpha = clamp(kf);
  text(ctx, 'FLIGHT', 540, 690 + (1 - kf) * 30, fU(56), C.ink, 'center', 18);
  ctx.globalAlpha = 1;
  ctx.fillStyle = C.ink;
  const rl = E.outCubic(prog(u, 8.8, 10));
  ctx.fillRect(540 - 380 * rl, 1060, 760 * rl, 4);
  // MISSING stamp
  const ks = prog(u, 11.85, 12.05);
  if (ks > 0) {
    ctx.save();
    M.shake(ctx, u, 12, 6, 2, 0.12);
    ctx.translate(560, 1215); ctx.rotate(-7 * D2R);
    const s = lerp(1.6, 1, E.outQuad(ks));
    ctx.scale(s, s); ctx.globalAlpha = 0.92 * ks;
    ctx.drawImage(PRE.stampMissing, -PRE.stampMissing.width / 2, -PRE.stampMissing.height / 2);
    ctx.restore();
  }
  const subl = ['What we know —', 'and what we don’t.'];
  if (u > 12.6) {
    ctx.save(); ctx.textAlign = 'center';
    const n = Math.floor((u - 12.7) * 22);
    let left = n;
    subl.forEach((l, i) => {
      const s = l.slice(0, Math.max(0, Math.min(l.length, left))); left -= l.length;
      text(ctx, s, 540, 1440 + i * 70, fDi(56), C.ink, 'center');
    });
    ctx.restore();
  }
}

// ---------------------------------------------------------------- S3.. the map story
function planePos(u) {
  // KUL -> IGARI between beats 16.4 and 35, then a little past it
  const a = proj0(P.KUL), b = proj0(P.IGARI), c = proj0(ROUTE_ACTUAL[0]);
  if (u < 35) {
    const p = E.inOutSine(prog(u, 16.4, 35));
    return { w: [lerp(a[0], b[0], p), lerp(a[1], b[1], p)], ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }
  const p = prog(u, 35, 36.6);
  return { w: [lerp(b[0], c[0], p), lerp(b[1], c[1], p)], ang: Math.atan2(c[1] - b[1], c[0] - b[0]) };
}
const proj0 = ([lon, lat]) => [lon, -mercY(lat)];   // world units
const projW = (cam, [x, y]) => [W / 2 + (x - cam.x) * cam.z, CY + (y - cam.y) * cam.z];

function mapOverlaysNear(ctx, u, cam) {
  // planned route: dotted KUL -> IGARI -> towards Beijing
  const a = proj(cam, P.KUL), b = proj(cam, P.IGARI), c = proj(cam, PLANNED_BEYOND);
  const kr = E.outCubic(prog(u, 16.2, 18.5));
  if (kr > 0 && u < 60) {
    ctx.save();
    ctx.globalAlpha = u > 40 ? lerp(1, 0.35, prog(u, 40, 42)) : 1;
    ctx.setLineDash([3, 12]); ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = C.ink2;
    polyReveal(ctx, [a, b, c], kr); ctx.stroke();
    ctx.setLineDash([]);
    if (kr > 0.98) {
      // arrowhead toward Beijing
      const ang = Math.atan2(c[1] - b[1], c[0] - b[0]);
      ctx.fillStyle = C.ink2; ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-10, -11); ctx.lineTo(-10, 11); ctx.closePath(); ctx.fill(); ctx.restore();
      if (u < 30) tag(ctx, 'TO BEIJING', c[0] - 40, c[1] - 40, 28, C.ink2, 'right');
    }
    ctx.restore();
  }
  // KUL pin
  const kp = springU(u, 16.1, SPRING.bouncy);
  if (u < 60) {
    pin(ctx, a[0], a[1], C.ink, kp);
    if (kp > 0.5 && u < 44) tag(ctx, 'KUALA LUMPUR', a[0] + 26, a[1] + 54, 28);
  }
  // IGARI waypoint
  const kw = springU(u, 31.5, SPRING.bouncy);
  if (kw > 0 && u < 60) {
    ctx.save(); ctx.translate(b[0], b[1]); ctx.scale(kw, kw);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(14, 10); ctx.lineTo(-14, 10); ctx.closePath(); ctx.stroke();
    ctx.restore();
    if (u < 48) tag(ctx, 'IGARI', b[0] + 22, b[1] + 50, 28);
  }
  // the aircraft
  if (u >= 16 && u < 40) {
    const { w, ang } = planePos(u);
    const [x, y] = projW(cam, w);
    const lift = 1 - E.outCubic(prog(u, 16.4, 18));
    // radar rings while ATC can see it
    if (u > 31.5 && u < 36.2) {
      for (let k = 0; k < 3; k++) {
        const ph = ((u - 31.5) + k / 3) % 1;
        ctx.strokeStyle = `rgba(28,25,20,${0.5 * (1 - ph)})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, 30 + ph * 120, 0, Math.PI * 2); ctx.stroke();
      }
    }
    const dark = u >= 36;
    const flick = dark ? (u < 37 ? (Math.floor((u - 36) * 14) % 2 ? 0.2 : 0.7) * (1 - prog(u, 36, 37)) : 0) : 1;
    plane(ctx, x, y, ang, lerp(70, 50, lift), C.ink, flick);
    if (dark) plane(ctx, x, y, ang, 70, C.ink2, (1 - prog(u, 38.5, 40)) * prog(u, 36.3, 37), true);
    // ATC data tag
    if (u > 17.5) {
      const kt = springU(u, 17.5, SPRING.snappy);
      const off = u >= 36 ? (Math.floor((u - 36) * 16) % 2 ? 1 : 0) * (u < 36.8 ? 1 : 0) : 1;
      if (off) {
        ctx.save(); ctx.globalAlpha = clamp(kt);
        ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 20, y - 20); ctx.lineTo(x + 70, y - 70); ctx.stroke();
        tag(ctx, 'MH370 · FL350', x + 70, y - 76, 28);
        ctx.restore();
      }
    }
  }
  // red string: the military radar track, then LAST SEEN
  const pts = ACTUAL_SMOOTH.map((p) => proj(cam, p));
  const iPen = ACTUAL_SMOOTH.findIndex((p) => p[0] <= P.PEN[0] + 0.01);
  const fPen = iPen / (ACTUAL_SMOOTH.length - 1);
  const fs = u < 47 ? E.inOutSine(prog(u, 40, 46.2)) * fPen : lerp(fPen, 1, E.inOutSine(prog(u, 48.2, 51.8)));
  if (u >= 40) {
    const r = redString(ctx, pts, fs);
    if (r && u < 53) {
      // radar blip at the head of the string
      const pulse = (u * 2) % 1;
      ctx.strokeStyle = `rgba(179,38,30,${0.8 * (1 - pulse)})`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(r.head[0], r.head[1], 12 + pulse * 30, 0, Math.PI * 2); ctx.stroke();
    }
  }
  // turn-back pin and Penang
  const pp = proj(cam, P.PEN);
  const kpp = springU(u, 46, SPRING.bouncy);
  if (kpp > 0) { pin(ctx, pp[0], pp[1], C.red, kpp); if (u < 56) tag(ctx, 'PENANG', pp[0] - 4, pp[1] + 56, 28, C.ink, 'center'); }
  const pl = proj(cam, P.LAST);
  const kl = springU(u, 52, SPRING.bouncy);
  if (kl > 0) {
    pin(ctx, pl[0], pl[1], C.red, kl * 1.25);
    if (u < 56) tag(ctx, 'LAST SEEN · 02:22', pl[0] - 10, pl[1] + 62, 30, C.sheet, 'center', C.red);
  }
}

// ---------------------------------------------------------------- data card (S3)
function dataCard(ctx, u) {
  const k = springU(u, 20, SPRING.snappy);
  const out = E.inBack(prog(u, 23.4, 24.1));
  if (k <= 0 || out >= 1) return;
  ctx.save();
  ctx.translate(lerp(W + 100, 0, k) - out * 1100, 0);
  ctx.translate(540, 1370); ctx.rotate(1.6 * D2R); ctx.translate(-540, -1370);
  paperSlip(ctx, 80, 1250, 880, 220, 41, '#F7F2E6');
  ctx.strokeStyle = 'rgba(179,38,30,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(150, 1256); ctx.lineTo(150, 1464); ctx.stroke();
  ctx.strokeStyle = 'rgba(80,110,160,0.25)';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(84, 1330 + i * 60); ctx.lineTo(956, 1330 + i * 60); ctx.stroke(); }
  text(ctx, 'BOEING 777-200ER', 176, 1318, fU(40), C.ink);
  text(ctx, 'REG. 9M-MRO', 176, 1378, fU(40), C.ink);
  text(ctx, '227 PASSENGERS · 12 CREW', 176, 1438, fU(40), C.ink);
  ctx.restore();
}

// ---------------------------------------------------------------- S4 the last words   (u 24..32)
function transcript(ctx, u) {
  const k = springU(u, 23.9, SPRING.snappy);
  const out = E.inBack(prog(u, 31.3, 32.2), 1.2);
  if (k <= 0 || out >= 1) return;
  // dim the map a touch
  ctx.fillStyle = `rgba(234,223,198,${0.45 * clamp(k) * (1 - out)})`; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate((1 - k) * W, -out * 1500);
  ctx.translate(540, 900); ctx.rotate((-2.2 + out * -8) * D2R); ctx.translate(-540, -900);
  paperSlip(ctx, 50, 520, 980, 760, 77, '#F7F2E6', 0.35);
  text(ctx, 'AIR TRAFFIC CONTROL · 01:19', 100, 620, fU(32), C.red, 'left', 2);
  ctx.fillStyle = C.ink; ctx.fillRect(100, 646, 880, 2);
  const lines = ['“Good night,', 'Malaysian', 'three seven zero.”'];
  typeLines(ctx, lines, 100, 780, 116, fDi(96), C.ink, u, 25.4, 13, false);
  ctx.fillStyle = C.ink; ctx.fillRect(100, 1110, 880, 2);
  const kf = prog(u, 29.4, 30);
  ctx.globalAlpha = kf;
  text(ctx, 'The last words heard from the cockpit.', 100, 1176, fU(38), C.ink);
  ctx.globalAlpha = 1;
  ctx.restore();
  // pin holds the slip (drawn after so it sits on top)
  const kp = springU(u, 25, SPRING.bouncy);
  if (out < 0.05) pin(ctx, 540 + (1 - k) * W, 548, C.red, kp * 1.2);
}

// ---------------------------------------------------------------- S8-10 the satellite and the arcs
function satellite(ctx, x, y, s, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = C.ink; ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
  ctx.fillRect(-14, -16, 28, 32);
  for (const sx of [-1, 1]) {
    ctx.fillRect(sx * 20 - (sx < 0 ? 4 : 0), -2, 4, 4);
    ctx.save(); ctx.translate(sx * 24 + (sx < 0 ? -56 : 0), -14);
    ctx.strokeRect(0, 0, 56, 28);
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i * 14, 0); ctx.lineTo(i * 14, 28); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(56, 14); ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(0, 30); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 34, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

const PINGS = ['02:25', '03:41', '04:41', '05:41', '06:41', '08:10', '08:19'];
function oceanOverlays(ctx, u, cam) {
  const sp = proj(cam, P.SAT);
  const satY = sp[1] - 220;
  const ka = springU(u, 57, SPRING.gentle);
  const fadeAll = 1 - prog(u, 91, 93);
  if (u > 56.5 && u < 93) {
    ctx.save(); ctx.globalAlpha = clamp(ka) * fadeAll;
    ctx.strokeStyle = C.ink2; ctx.setLineDash([4, 8]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sp[0], satY + 40); ctx.lineTo(sp[0], sp[1]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(sp[0], sp[1], 6, 0, Math.PI * 2); ctx.fill();
    satellite(ctx, sp[0], satY + Math.sin(u * 0.9) * 6 + (1 - ka) * -200, 1.1);
    tag(ctx, 'INMARSAT SATELLITE', sp[0] + 84, satY - 2, 26);
    text(ctx, '64.5°E', sp[0] + 14, sp[1] + 36, fU(24), C.ink2);
    // pings: rings from the satellite on each handshake
    PINGS.forEach((_, i) => {
      const t0 = 58 + i * 1.33;
      const ph = prog(u, t0, t0 + 1.4);
      if (ph > 0 && ph < 1) {
        ctx.strokeStyle = `rgba(28,25,20,${0.7 * (1 - ph)})`; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(sp[0], satY, 30 + ph * 260, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      }
    });
    ctx.restore();
  }
  // handshake chips along the bottom
  if (u > 57.5 && u < 81) {
    const out = E.inBack(prog(u, 79.4, 80.4));
    PINGS.forEach((s, i) => {
      const t0 = 58 + i * 1.33;
      const k = springU(u, t0, SPRING.bouncy);
      if (k <= 0) return;
      const x = 74 + i * 122, y = 1430 + (1 - k) * 60 + out * 500;
      ctx.save(); ctx.globalAlpha = clamp(k * 2);
      const last = i === 6;
      tag(ctx, s, x, y, 30, last ? C.sheet : C.ink, 'left', last ? C.red : C.sheet);
      ctx.restore();
    });
    if (u > 59) text(ctx, 'HANDSHAKES WITH THE SATELLITE (MALAYSIA TIME)', 76, 1346 + E.inBack(prog(u, 79.4, 80.4)) * 500, fU(24), C.ink2, 'left', 1);
  }
  // arcs
  if (u > 67.5 && u < 132) {
    const fadeArcs = 1 - prog(u, 91, 93.5);
    ARCS.forEach((ring, k) => {
      const f = E.inOutCubic(prog(u, 68 + k, 68 + k + 1.4));
      if (f <= 0) return;
      const pts = ring.map((p) => proj(cam, p));
      ctx.save();
      if (k < 6) {
        if (fadeArcs <= 0) { ctx.restore(); return; }
        ctx.globalAlpha = fadeArcs * 0.85; ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5; ctx.setLineDash([10, 8]);
        polyReveal(ctx, pts, f); ctx.stroke();
        if (f > 0.99 && u < 81) {
          const lp = proj(cam, dest(0, 64.5, ARC_TH[k], 168));
          text(ctx, String(k + 1), lp[0] - 8, lp[1] + 30, fU(24), C.ink2);
        }
      } else {
        // the 7th arc: red, stays until the memorial
        const fade = 1 - prog(u, 131, 134);
        ctx.globalAlpha = fade;
        ctx.strokeStyle = C.red; ctx.lineWidth = 6; ctx.lineCap = 'round';
        polyReveal(ctx, pts, f); ctx.stroke();
        if (f > 0.99 && u < 92) {
          const lp = proj(cam, dest(0, 64.5, ARC_TH[6], 150));
          tag(ctx, '7TH ARC · 08:19', lp[0] - 220, lp[1] + 10, 28, C.sheet, 'left', C.red);
        }
      }
      ctx.restore();
    });
  }
  // north vs south (80..92)
  if (u > 80 && u < 93) {
    const a = proj(cam, P.LAST);
    const n = proj(cam, NORTH_END), s = proj(cam, SOUTH_END);
    const curve = (p0, p1, bend) => {
      const mx = (p0[0] + p1[0]) / 2 + bend[0], my = (p0[1] + p1[1]) / 2 + bend[1];
      return Array.from({ length: 41 }, (_, i) => { const t = i / 40; return [(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * mx + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * my + t * t * p1[1]]; });
    };
    const fade = 1 - prog(u, 91, 93);
    const N = curve(a, n, [-60, 0]), S = curve(a, s, [-120, 0]);
    ctx.save(); ctx.globalAlpha = fade;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.setLineDash([14, 10]);
    polyReveal(ctx, N, E.inOutSine(prog(u, 80.3, 82.6))); ctx.stroke();
    polyReveal(ctx, S, E.inOutSine(prog(u, 81, 83.4))); ctx.stroke();
    ctx.setLineDash([]);
    if (u > 82.6) text(ctx, 'NORTH?', n[0] + 26, n[1] + 10, fU(30), C.ink);
    if (u > 83.4) text(ctx, 'SOUTH?', s[0] + 26, s[1] + 10, fU(30), C.ink);
    // red X on the northern route
    const kx = prog(u, 83.9, 84.15), kx2 = prog(u, 84.1, 84.35);
    const mid = N[30];
    ctx.strokeStyle = C.red; ctx.lineWidth = 12; ctx.lineCap = 'round';
    if (kx > 0) { ctx.beginPath(); ctx.moveTo(mid[0] - 50, mid[1] - 50); ctx.lineTo(mid[0] - 50 + 100 * kx, mid[1] - 50 + 100 * kx); ctx.stroke(); }
    if (kx2 > 0) { ctx.beginPath(); ctx.moveTo(mid[0] + 50, mid[1] - 50); ctx.lineTo(mid[0] + 50 - 100 * kx2, mid[1] - 50 + 100 * kx2); ctx.stroke(); }
    // the south route becomes string
    const fsr = E.inOutSine(prog(u, 86.2, 88.6));
    if (fsr > 0) redString(ctx, S, fsr, 6);
    ctx.restore();
    const ap = springU(u, 80, SPRING.bouncy);
    pin(ctx, a[0], a[1], C.red, ap * fade);
  }
}

// ---------------------------------------------------------------- S11 search grid   (u 92..100) and S14 swaths
const GRID_CELLS = (() => {
  const azA = AZ_SOUTH - 7.5, azB = AZ_SOUTH + 6.5, cells = [];
  const nA = 16, nT = 3;
  for (let i = 0; i < nA; i++) for (let j = 0; j < nT; j++) {
    const a0 = lerp(azA, azB, i / nA), a1 = lerp(azA, azB, (i + 1) / nA);
    const t0 = TH7 - 1.5 + (j * 3.0) / nT, t1 = TH7 - 1.5 + ((j + 1) * 3.0) / nT;
    cells.push({ i, j, q: [dest(0, 64.5, t0, a0), dest(0, 64.5, t0, a1), dest(0, 64.5, t1, a1), dest(0, 64.5, t1, a0)] });
  }
  return cells;
})();
const SWATHS = (() => {
  const out = [];
  const bands = [[AZ_SOUTH - 22, AZ_SOUTH - 8.5], [AZ_SOUTH + 6.8, AZ_SOUTH + 9.5]];
  for (const [a, b] of bands) {
    const n = 18, poly = [];
    for (let i = 0; i <= n; i++) poly.push(dest(0, 64.5, TH7 - 1.5, lerp(a, b, i / n)));
    for (let i = n; i >= 0; i--) poly.push(dest(0, 64.5, TH7 + 1.5, lerp(a, b, i / n)));
    out.push(poly);
  }
  return out;
})();

function searchOverlays(ctx, u, cam) {
  if (u < 92 || u > 134) return;
  const fade = 1 - prog(u, 130.5, 133);
  const fadeDebris = u > 99 && u < 121 ? 0.0 : 1;
  ctx.save(); ctx.globalAlpha = fade * (u > 99 && u < 120 ? 0 : 1) || 0;
  if (fadeDebris) {
    for (const c of GRID_CELLS) {
      const t0 = 93 + (c.i / 16) * 4 + c.j * 0.12;
      const k = prog(u, t0, t0 + 0.25);
      if (k <= 0) continue;
      const q = c.q.map((p) => proj(cam, p));
      ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
      ctx.fillStyle = `rgba(28,25,20,${0.16 * k})`; ctx.fill();
      ctx.strokeStyle = `rgba(28,25,20,${0.7 * k})`; ctx.lineWidth = 1.5; ctx.stroke();
    }
    if (u > 120) {
      // Ocean Infinity swaths sweep along the arc
      SWATHS.forEach((poly, si) => {
        const f = E.inOutCubic(prog(u, 121 + si * 1.6, 124.5 + si * 1.6));
        if (f <= 0) return;
        const pts = poly.map((p) => proj(cam, p));
        const n = (pts.length / 2) | 0;
        const m = Math.max(1, Math.round(f * (n - 1)));
        ctx.beginPath();
        for (let i = 0; i <= m; i++) (i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[i][0], pts[i][1]));
        for (let i = pts.length - 1 - m; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        ctx.save(); ctx.clip();
        ctx.fillStyle = PRE.hatch; ctx.fillRect(0, 0, W, H);
        ctx.restore();
        ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.stroke();
      });
      const kl = prog(u, 122, 122.6);
      if (kl > 0) {
        ctx.globalAlpha = fade * kl;
        const a = proj(cam, dest(0, 64.5, TH7 + 2.2, AZ_SOUTH - 16));
        tag(ctx, '2018 · 2025–26', a[0] + 10, a[1], 26);
        const b = proj(cam, dest(0, 64.5, TH7 - 2.4, AZ_SOUTH - 1));
        tag(ctx, '2014–17', b[0] - 120, b[1], 26);
        ctx.globalAlpha = fade;
      }
      text(ctx, 'Search areas shown approximately', 76, 1484, fUi(24), C.ink2);
    }
  }
  ctx.restore();
  // counter (S11)
  if (u > 92.8 && u < 99.6) {
    const out = E.inBack(prog(u, 98.6, 99.4));
    const k = springU(u, 92.8, SPRING.snappy);
    const v = Math.round(E.outCubic(prog(u, 93, 97)) * 120) * 1000;
    ctx.save(); ctx.translate(-out * 1100, (1 - k) * 80); ctx.globalAlpha = clamp(k * 2);
    paperSlip(ctx, 60, 1250, 700, 220, 91, '#F7F2E6');
    text(ctx, v.toLocaleString('en-US'), 500, 1380, fD(96), C.ink, 'right', -1);
    text(ctx, 'km²', 524, 1380, fD(96), C.ink, 'left', -1);
    text(ctx, 'OF SEABED SEARCHED', 100, 1436, fU(30), C.ink2, 'left', 2);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- S12 debris
const DEBRIS = [
  { p: P.REU, label: 'RÉUNION · 2015', main: true },
  { p: P.MRU, label: 'MAURITIUS', dx: 30, dy: -34 },
  { p: P.PEMBA, label: 'TANZANIA', dx: 30, dy: 10 },
  { p: P.MOZ, label: 'MOZAMBIQUE', dx: 24, dy: 52 },
  { p: P.MDG, label: 'MADAGASCAR', dx: 24, dy: 58 },
  { p: P.ROD, label: 'RODRIGUES', dx: 20, dy: 52 },
];
function debrisOverlays(ctx, u, cam) {
  if (u < 99 || u > 121) return;
  const fade = 1 - prog(u, 119.3, 120.3);
  ctx.save(); ctx.globalAlpha = fade;
  // drift: dashed currents arriving from the east, out of frame
  const kd = E.inOutSine(prog(u, 100.5, 104));
  if (kd > 0) {
    ctx.strokeStyle = C.ink2; ctx.lineWidth = 3; ctx.setLineDash([10, 12]);
    for (const [y0, end] of [[1180, P.REU], [1020, P.PEMBA], [1340, P.MDG]]) {
      const e = proj(cam, end);
      const s = [W + 60, y0];
      const pts = Array.from({ length: 31 }, (_, i) => { const t = i / 30; return [lerp(s[0], e[0] + 30, t), lerp(s[1], e[1], t) + Math.sin(t * Math.PI) * 60]; });
      polyReveal(ctx, pts, kd); ctx.stroke();
    }
    ctx.setLineDash([]);
    if (kd > 0.6) text(ctx, 'OCEAN CURRENTS', 690, 1430, fU(26), C.ink2, 'left', 2);
  }
  DEBRIS.forEach((d, i) => {
    const t0 = d.main ? 100.6 : 107.5 + (i - 1) * 0.8;
    const k = springU(u, t0, SPRING.bouncy);
    if (k <= 0) return;
    const [x, y] = proj(cam, d.p);
    pin(ctx, x, y, C.red, k * (d.main ? 1.3 : 0.9));
    if (k > 0.6) {
      if (d.main) tag(ctx, d.label, x - 40, y + 62, 30, C.sheet, 'right', C.red);
      else tag(ctx, d.label, x + d.dx, y + d.dy, 28);
    }
  });
  ctx.restore();
  // flaperon card + CONFIRMED stamp
  const k = springU(u, 102, SPRING.snappy);
  const out = E.inBack(prog(u, 111.2, 112.2));
  if (k > 0 && out < 1) {
    ctx.save();
    ctx.translate((1 - k) * 700 + out * 800, 0);
    ctx.translate(770, 820); ctx.rotate(3 * D2R); ctx.translate(-770, -820);
    paperSlip(ctx, 560, 690, 440, 280, 133, '#F7F2E6');
    // ink sketch of a flaperon (trailing-edge control surface, tapered)
    ctx.save(); ctx.translate(600, 760);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(340, 0); ctx.lineTo(352, 40); ctx.lineTo(10, 96); ctx.closePath();
    ctx.fillStyle = 'rgba(28,25,20,0.08)'; ctx.fill(); ctx.stroke();
    ctx.lineWidth = 1.5;
    for (let i = 1; i < 9; i++) { const t = i / 9; ctx.beginPath(); ctx.moveTo(lerp(0, 340, t), lerp(20, 0, t)); ctx.lineTo(lerp(10, 352, t), lerp(96, 40, t)); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(5, 58); ctx.lineTo(346, 20); ctx.stroke();
    ctx.restore();
    text(ctx, 'WING FLAPERON', 600, 920, fU(30), C.ink, 'left', 2);
    text(ctx, 'found 29 July 2015', 600, 954, fUi(26), C.ink2);
    const ks = prog(u, 105.85, 106.05);
    if (ks > 0) {
      ctx.save(); ctx.translate(800, 800); ctx.rotate(-11 * D2R);
      const s = lerp(1.6, 0.62, E.outQuad(ks)); ctx.scale(s, s); ctx.globalAlpha = 0.9 * ks;
      ctx.drawImage(PRE.stampConfirmed, -PRE.stampConfirmed.width / 2, -PRE.stampConfirmed.height / 2);
      ctx.restore();
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- S13 the report   (u 112..120)
function report(ctx, u) {
  const k = springU(u, 111.6, SPRING.snappy);
  const out = E.inBack(prog(u, 119.3, 120.3), 1.2);
  if (k <= 0 || out >= 1) return;
  ctx.fillStyle = `rgba(234,223,198,${0.5 * clamp(k) * (1 - out)})`; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(0, (1 - k) * 1700 + out * 1800);
  ctx.translate(540, 900); ctx.rotate(1.4 * D2R); ctx.translate(-540, -900);
  ctx.save(); ctx.shadowColor = 'rgba(40,25,5,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  ctx.fillStyle = '#F8F4EA'; ctx.fillRect(70, 270, 940, 1260); ctx.restore();
  ctx.globalAlpha = 0.5; ctx.drawImage(PRE.sheetTex, 100, 0, 940, 1260, 70, 270, 940, 1260); ctx.globalAlpha = 1;
  text(ctx, 'SAFETY INVESTIGATION', 120, 380, fD(62), C.ink);
  text(ctx, 'REPORT', 120, 450, fD(62), C.ink);
  text(ctx, 'MH370 · 9M-MRO · JULY 2018', 122, 512, fU(30), C.red, 'left', 2);
  ctx.fillStyle = C.ink; ctx.fillRect(120, 540, 840, 3);
  // greeked body
  const r = mulberry32(21);
  ctx.fillStyle = 'rgba(28,25,20,0.25)';
  for (let i = 0; i < 6; i++) ctx.fillRect(120, 590 + i * 34, 840 - (i === 5 ? 300 : r() * 60), 11);
  // the finding
  const lines = wrap(ctx, '“The team is unable to determine the real cause for the disappearance of MH370.”', fU(46), 800);
  const hy = 860;
  // highlighter swipe behind the quote
  const kh = E.inOutCubic(prog(u, 115.2, 116.8));
  lines.forEach((l, i) => {
    ctx.font = fU(46);
    const lw = ctx.measureText(l).width;
    const f = clamp(kh * lines.length - i);
    if (f > 0) { ctx.fillStyle = 'rgba(179,38,30,0.22)'; ctx.fillRect(112, hy + i * 66 - 44, (lw + 16) * f, 58); }
  });
  typeLines(ctx, lines, 120, hy, 66, fU(46), C.ink, u, 112.9, 34, u < 119);
  ctx.fillStyle = 'rgba(28,25,20,0.25)';
  for (let i = 0; i < 6; i++) ctx.fillRect(120, 1220 + i * 34, 840 - (i === 5 ? 380 : r() * 60), 11);
  text(ctx, '— Chief investigator, July 2018', 120, 1180, fUi(30), C.ink2);
  ctx.restore();
}

// ---------------------------------------------------------------- S14 quote slip
function quoteSlip(ctx, u) {
  const k = springU(u, 125.8, SPRING.snappy);
  const out = E.inBack(prog(u, 130.6, 131.6));
  if (k <= 0 || out >= 1) return;
  ctx.save();
  ctx.translate((1 - k) * -W + out * -W, 0);
  ctx.translate(540, 1290); ctx.rotate(-1.8 * D2R); ctx.translate(-540, -1290);
  paperSlip(ctx, 70, 1150, 900, 270, 151, '#F7F2E6');
  typeLines(ctx, ['“It isn’t where', 'we looked.”'], 110, 1250, 84, fDi(72), C.ink, u, 126.3, 16, false);
  text(ctx, '— Ocean Infinity CEO, March 2026', 112, 1394, fUi(28), C.ink2);
  ctx.restore();
  pin(ctx, 520 + (1 - k) * -W, 1160, C.red, springU(u, 126, SPRING.bouncy));
}

// ---------------------------------------------------------------- S15 memorial   (u 132..144)
function memorial(ctx, u) {
  if (u < 131.5) return;
  const cols = 15, gap = 54, x0 = 540 - ((cols - 1) * gap) / 2, y0 = 330;
  for (let i = 0; i < 239; i++) {
    const t0 = 132.3 + (i / 239) * 5.4;
    const k = springU(u, t0, SPRING.snappy);
    if (k <= 0) continue;
    const c = i % cols, r = (i / cols) | 0;
    const x = x0 + c * gap + (hash01(i, 3) - 0.5) * 6, y = y0 + r * gap + (hash01(i, 5) - 0.5) * 6;
    ctx.fillStyle = C.ink;
    ctx.globalAlpha = 0.85 + hash01(i, 7) * 0.15;
    ctx.beginPath(); ctx.ellipse(x, y, 13 * k, 12.5 * k, hash01(i, 9), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const k1 = springU(u, 138, SPRING.snappy);
  if (k1 > 0) {
    ctx.save(); ctx.globalAlpha = clamp(k1 * 2); ctx.translate(0, (1 - k1) * 40);
    text(ctx, '239 people.', TX, 1350, fD(116), C.ink, 'left', -2);
    ctx.restore();
  }
  const k2 = springU(u, 139, SPRING.snappy);
  if (k2 > 0) {
    ctx.save(); ctx.globalAlpha = clamp(k2 * 2); ctx.translate(0, (1 - k2) * 40);
    text(ctx, 'Still missing.', TX, 1462, fDi(96), C.red, 'left');
    ctx.restore();
  }
  const k3 = prog(u, 140, 140.8);
  if (k3 > 0) {
    ctx.globalAlpha = k3;
    text(ctx, 'FLIGHT MH370 · 8 MARCH 2014', TX + 4, 1236, fU(30), C.ink2, 'left', 3);
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- the film
function draw(ctx, u) {
  if (u < 8) { sceneHook(ctx, u); return; }
  // the map sheet underneath everything after the title
  const whip = E.inOutCubic(prog(u, 15.4, 16.3));
  if (u < 16.3) {
    // title sheet slides up as the map slides in under it (both on screen)
    ctx.save(); ctx.translate(0, whip * H); drawMapScene(ctx, Math.max(u, 15.5)); ctx.restore();
    ctx.save(); ctx.translate(0, -whip * H); sceneTitle(ctx, u);
    ctx.fillStyle = 'rgba(40,25,5,0.25)'; ctx.fillRect(0, H, W, 24);
    ctx.restore();
    return;
  }
  drawMapScene(ctx, u);
}

function drawMapScene(ctx, u) {
  ctx.drawImage(PRE.paper, 0, 0);
  const cam = camAt(u);
  const mapA = 1 - E.inOutSine(prog(u, 130, 133));
  drawMap(ctx, cam, u, mapA);
  if (u < 58) mapOverlaysNear(ctx, u, cam);
  oceanOverlays(ctx, u, cam);
  searchOverlays(ctx, u, cam);
  debrisOverlays(ctx, u, cam);
  if (u >= 20 && u < 24.2) dataCard(ctx, u);
  CAPS.forEach((c, i) => caption(ctx, u, c, i));
  if (u >= 23.8 && u < 32.4) transcript(ctx, u);
  if (u >= 111.5 && u < 120.4) report(ctx, u);
  if (u >= 125.7 && u < 131.7) quoteSlip(ctx, u);
  memorial(ctx, u);
}

M.film({
  fonts: [fD(100), fDi(100), fU(40), fU(40, 400), fUi(40)],
  hits: HITS,
  samples: 10,
  async init() {
    const map = await fetch('assets/map.json').then((r) => r.json());
    PRE.paths = buildMapPaths(map);
    PRE.paper = buildPaper(W, H, C.paper, 3);
    PRE.sheetTex = buildPaper(W + 400, H + 600, C.sheet, 5);
    PRE.grain = buildGrain(9);
    PRE.vignette = buildVignette();
    PRE.stampMissing = buildStamp('MISSING', C.red, 720, 220, 17);
    PRE.stampConfirmed = buildStamp('CONFIRMED', C.red, 760, 200, 23);
    const dot = (r, a, s = 12) => {
      const t = makeCanvas(s, s), c = t.getContext('2d');
      c.fillStyle = `rgba(28,25,20,${a})`; c.beginPath(); c.arc(s / 2, s / 2, r, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(0, 0, r * 0.6, 0, Math.PI * 2); c.arc(s, s, r * 0.6, 0, Math.PI * 2); c.arc(0, s, r * 0.6, 0, Math.PI * 2); c.arc(s, 0, r * 0.6, 0, Math.PI * 2); c.fill();
      return t;
    };
    const ctx = document.getElementById('film').getContext('2d');
    PRE.sea = ctx.createPattern(dot(1.7, 0.2), 'repeat');
    PRE.seaDark = ctx.createPattern(dot(2.6, 0.5, 10), 'repeat');
    const h = makeCanvas(16, 16), hc = h.getContext('2d');
    hc.strokeStyle = 'rgba(28,25,20,0.45)'; hc.lineWidth = 2;
    hc.beginPath(); hc.moveTo(0, 16); hc.lineTo(16, 0); hc.moveTo(-4, 4); hc.lineTo(4, -4); hc.moveTo(12, 20); hc.lineTo(20, 12); hc.stroke();
    PRE.hatch = ctx.createPattern(h, 'repeat');
  },
  draw(ctx, u) { draw(ctx, u); },
  post(ctx, u, t) {
    ctx.drawImage(PRE.vignette, 0, 0);
    const f = Math.floor(t * 24);
    const ox = Math.floor(hash01(f, 1) * 512), oy = Math.floor(hash01(f, 2) * 512);
    ctx.globalCompositeOperation = 'overlay';
    for (let x = -ox; x < W; x += 512) for (let y = -oy; y < H; y += 512) ctx.drawImage(PRE.grain, x, y);
    ctx.globalCompositeOperation = 'source-over';
  },
});
