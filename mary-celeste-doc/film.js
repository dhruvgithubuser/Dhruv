// Mary Celeste का रहस्य: documentary cut. Pure function of time (see lib/motion.js).
// Each shot is a photoreal reconstruction still (assets/shots, generated locally and labelled as an
// AI reconstruction on screen) turned into a 3-D relief by its depth map: a subdivided plane displaced
// toward the camera, so a moving camera gets real parallax. The sea below each shot's waterline
// moves in the shader. One real archival image: the 1861 painting of the ship (then "Amazon").
// Hindi is laid out by whole words (never per glyph).
import * as M from './lib/motion.js';
import * as G from './lib/gl.js';

const { THREE } = G;
const { W, H, FORMAT, E, prog, lerp, clamp, springU, SPRING, font, text, fill, rrect, bump, hash01, noise1, mulberry32 } = M;

const C = { ink: '#0A1622', deep: '#081521', fog: '#EDE3CC', paper: '#E6D8B8', paperInk: '#3B2E22', amber: '#F2A93B', dim: '#A9B6C2' };
const DISPLAY = 'Display', UI = 'UI';
const SAFE = FORMAT.safe;
const CX = W / 2, TAU = Math.PI * 2;

// ---------------------------------------------------------------- shots: image, waterline, relief, grade
// water: fraction of the image height (from the bottom) that is sea; amp: relief depth (world units)
const IMGS = {
  s01_hook: { water: 0.14, amp: 0.30 }, s02_deck: { water: 0.0, amp: 0.34 }, s03_intact: { water: 0.13, amp: 0.26 },
  s05_newyork: { water: 0.33, amp: 0.30 }, s05_cabin: { water: 0, amp: 0.30 }, s06_found: { water: 0.2, amp: 0.26 },
  s06_davits: { water: 0, amp: 0.30 }, s07_hold: { water: 0, amp: 0.34 }, s08_fog: { water: 0, amp: 0.30 },
  s09_lifeboat: { water: 0.2, amp: 0.26 }, s10_hatch: { water: 0, amp: 0.32 }, s11_storm: { water: 0.2, amp: 0.30, storm: 1 },
  s12_emptyboat: { water: 0.55, amp: 0.22 }, s14_unsolved: { water: 0.12, amp: 0.26 }, s15_cta: { water: 0.38, amp: 0.20 },
};

// camera moves: [from xyz, to xyz] in front of a 2 x 1.143 relief; z ~2.0-2.45, |x| <= .57-.205z
const MOVES = {
  push: [[0, 0.02, 2.45], [0, 0.0, 2.05]],
  pushL: [[0.05, 0.03, 2.4], [-0.08, 0.0, 2.05]],
  pushR: [[-0.05, 0.03, 2.4], [0.08, 0.0, 2.05]],
  truckR: [[-0.07, 0.0, 2.3], [0.07, 0.02, 2.25]],
  truckL: [[0.07, 0.0, 2.3], [-0.07, 0.02, 2.25]],
  craneUp: [[0, -0.1, 2.3], [0, 0.08, 2.2]],
  craneDn: [[0, 0.1, 2.3], [0, -0.06, 2.2]],
  pull: [[0, 0.0, 2.05], [0, 0.03, 2.45]],
  drift: [[-0.03, 0.0, 2.35], [0.03, 0.02, 2.3]],
};

// the cut list, in beats: [u0, u1, kind, data]
const CUTS = [
  [0, 7, 'relief', { img: 's01_hook', move: 'push' }],
  [7, 9.5, 'relief', { img: 's02_deck', move: 'pushL' }],
  [9.5, 17, 'relief', { img: 's03_intact', move: 'truckR' }],
  [17, 23, 'archival', {}],
  [23, 26.5, 'relief', { img: 's05_newyork', move: 'truckL' }],
  [26.5, 31.5, 'map', {}],
  [31.5, 35, 'relief', { img: 's05_cabin', move: 'push' }],
  [35, 39, 'relief', { img: 's06_found', move: 'pushR' }],
  [39, 43, 'relief', { img: 's06_davits', move: 'craneDn' }],
  [43, 50.5, 'relief', { img: 's07_hold', move: 'push' }],
  [50.5, 54.5, 'relief', { img: 's08_fog', move: 'push' }],
  [54.5, 61.5, 'relief', { img: 's09_lifeboat', move: 'pull' }],
  [61.5, 66, 'relief', { img: 's10_hatch', move: 'craneUp' }],
  [66, 70.5, 'relief', { img: 's07_hold', move: 'truckL', fumes: 1 }],
  [70.5, 76.5, 'relief', { img: 's11_storm', move: 'drift' }],
  [76.5, 80.5, 'relief', { img: 's12_emptyboat', move: 'push' }],
  [80.5, 87.5, 'triptych', {}],
  [87.5, 93, 'relief', { img: 's14_unsolved', move: 'pull' }],
  [93, 999, 'relief', { img: 's15_cta', move: 'drift' }],
];
// dissolves (beats where the two shots overlap for `d` beats); other cuts are hard, on the beat
const DISSOLVE = { 17: 0.75, 23: 0.75, 26.5: 0.6, 31.5: 0.6, 54.5: 0.75, 87.5: 0.5, 93: 1.0 };

// ---------------------------------------------------------------- hits (sfx.mjs)
const HITS = [
  [0, 'cold open', 'swell', { len: 0.6, gain: 0.2 }],
  [7, 'crew gayab', 'thud', { gain: 0.45 }],
  [9.5, 'cut intact', 'click', { gain: 0.15 }],
  [10.5, 'callout 1', 'tick'], [12, 'callout 2', 'tick'], [13.5, 'callout 3', 'tick'],
  [17, 'archival', 'crash', { len: 1.4, gain: 0.12 }],
  [18.2, '10 log', 'thud', { gain: 0.3 }],
  [23, 'new york', 'click', { gain: 0.18 }],
  [26.5, 'map', 'whoosh', { len: 0.5, from: 1800, to: 500, gain: 0.2 }],
  [31.5, 'cabin', 'click', { gain: 0.15 }],
  [35, 'found', 'thud', { gain: 0.35 }],
  [39, 'davits', 'click', { gain: 0.15 }],
  [40.5, 'lifeboat gayab', 'blip', { pitch: 'A4', gain: 0.15 }],
  [44, 'row 1', 'click'], [45, 'row 2', 'click'], [46.5, 'row 3', 'thud', { gain: 0.3 }], [47.5, 'row 4', 'thud', { gain: 0.3 }],
  [50.5, 'kyon', 'impact', { gain: 0.4 }],
  [54.5, 'theory 1', 'whoosh', { len: 0.5, from: 500, to: 2200, gain: 0.2 }],
  [61.5, 'theory 2', 'whoosh', { len: 0.5, from: 2200, to: 500, gain: 0.2 }],
  [70.5, 'theory 3', 'crash', { len: 1.2, gain: 0.18 }],
  [72.5, 'lightning', 'sub', { len: 1.2, gain: 0.4 }],
  [76.5, 'theory != proof', 'impact', { gain: 0.55 }],
  [81.5, 'cross 1', 'thud', { gain: 0.35 }], [82.5, 'cross 2', 'thud', { gain: 0.35 }], [83.5, 'cross 3', 'thud', { gain: 0.35 }],
  [88.5, 'ansuljha', 'thud', { gain: 0.5 }],
  [95, 'opt A', 'pop', { pitch: 'D5', gain: 0.18 }], [95.75, 'opt B', 'pop', { pitch: 'E5', gain: 0.18 }],
  [96.5, 'opt C', 'pop', { pitch: 'F5', gain: 0.18 }], [97.25, 'opt D', 'pop', { pitch: 'A5', gain: 0.18 }],
  [98.5, 'comment', 'bell', { pitch: 'D6', gain: 0.16 }],
];

// ---------------------------------------------------------------- data
let OFF = null, VO = null, MAP = null, CAPS = [], TEX = {}, RELIEF = null, MAPSET = null, IMG2D = {};
const rgba = (hex, a) => { const [r, g, b] = M.hexRgb(hex); return `rgba(${r},${g},${b},${a})`; };
function withAlpha(ctx, a, fn) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }

// ---------------------------------------------------------------- the relief set (one mesh, textures swapped per shot)
const VS = `
uniform sampler2D uDepth; uniform float uAmp;
varying vec2 vUv;
void main() {
  vUv = uv;
  float d = texture2D(uDepth, uv).r;
  vec3 p = position; p.z += d * uAmp;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;
const FS = `
uniform sampler2D uMap; uniform float uTime, uWater, uWaterAmp, uExpo, uSat, uStorm;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  if (uv.y < uWater) {
    float k = clamp((uWater - uv.y) / max(uWater, 0.001), 0.0, 1.0);
    float a = 0.0011 * uWaterAmp * (0.4 + k);
    uv.x += a * sin(uv.y * 210.0 + uTime * 1.7) + a * 0.6 * sin(uv.y * 77.0 - uTime * 1.1);
    uv.y += a * 0.8 * sin(uv.x * 95.0 + uTime * 1.3 + uv.y * 40.0);
  }
  vec3 c = texture2D(uMap, uv).rgb;
  // documentary grade: gentle S-curve, a little desaturation, cool shadows, warm highlights
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uSat);
  c = c * uExpo;
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.35);
  c += vec3(-0.012, 0.0, 0.018) * (1.0 - l) + vec3(0.02, 0.01, -0.01) * l;
  c *= 1.0 + uStorm;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;
function reliefSet() {
  const scene = new THREE.Scene();
  const cam = G.camera(40, 0.05, 50);
  const geo = new THREE.PlaneGeometry(2 * 768 / 1344, 2, 150, 262);
  const mat = new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS, toneMapped: false,
    uniforms: { uMap: { value: null }, uDepth: { value: null }, uAmp: { value: 0.3 }, uTime: { value: 0 }, uWater: { value: 0 }, uWaterAmp: { value: 1 }, uExpo: { value: 1 }, uSat: { value: 0.85 }, uStorm: { value: 0 } },
  });
  const mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
  return {
    scene, camera: cam,
    update(t, u, o) {
      const s = IMGS[o.img], T = TEX[o.img];
      mat.uniforms.uMap.value = T.map; mat.uniforms.uDepth.value = T.depth;
      mat.uniforms.uAmp.value = s.amp; mat.uniforms.uWater.value = s.water; mat.uniforms.uTime.value = t;
      mat.uniforms.uWaterAmp.value = s.storm ? 3 : 1; mat.uniforms.uExpo.value = o.expo ?? 1; mat.uniforms.uSat.value = o.sat ?? 0.85;
      mat.uniforms.uStorm.value = o.flash ?? 0;
      const [a, b] = MOVES[o.move];
      const p = E.inOutSine(clamp(o.p));
      const pos = [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
      // handheld breathing: tiny, smooth, seeded
      pos[0] += 0.006 * noise1(t * 0.35, 3); pos[1] += 0.005 * noise1(t * 0.3, 5);
      cam.position.set(...pos);
      cam.lookAt(pos[0] * 0.4, pos[1] * 0.4, 0);
      cam.rotation.z += 0.004 * noise1(t * 0.25, 9) + (o.roll || 0);
      cam.updateProjectionMatrix();
    },
  };
}

// ---------------------------------------------------------------- the map set: a tilted chart in 3-D
const LON = (lon) => 24.491 * lon + 1959.2;
const LAT = (lat) => 1418.3 - 1403.2 * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
const PT = (lon, lat) => [LON(lon), LAT(lat)];
const ROUTE = [PT(-74, 40.7), PT(-62, 39.6), PT(-45, 38.6), PT(-30, 37.6), PT(-17.25, 38.33), PT(-9.8, 36.9), PT(-5.6, 35.95), PT(-1, 36.6), PT(4.6, 38.7), PT(7.2, 41.6), PT(8.6, 43.9)];
const RL = ROUTE.reduce((L, p, i) => { L.push(i ? L[i - 1] + Math.hypot(p[0] - ROUTE[i - 1][0], p[1] - ROUTE[i - 1][1]) : 0); return L; }, []);
function routeAt(d) {
  for (let i = 1; i < ROUTE.length; i++) if (d <= RL[i]) { const t = (d - RL[i - 1]) / (RL[i] - RL[i - 1]); return [lerp(ROUTE[i - 1][0], ROUTE[i][0], t), lerp(ROUTE[i - 1][1], ROUTE[i][1], t)]; }
  return ROUTE[ROUTE.length - 1];
}
function mapSet() {
  const scene = new THREE.Scene();
  const cam = G.camera(38, 0.05, 50);
  const TW = 2400, TH = 1300, OY = 220;               // texture: the 2400 x 866 map with paper margins
  const tex = G.canvasTexture(TW, TH);
  tex.anisotropy = 16;
  const geo = new THREE.PlaneGeometry(4.4, 4.4 * TH / TW);
  const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const mesh = new THREE.Mesh(geo, mat); mesh.rotation.x = -1.05; scene.add(mesh);
  // the table under the chart: the same paper, darker, so the frame never shows a void
  const ptex = new THREE.Texture(IMG2D.parchment); ptex.needsUpdate = true; ptex.colorSpace = THREE.SRGBColorSpace;
  ptex.wrapS = ptex.wrapT = THREE.RepeatWrapping; ptex.repeat.set(3, 3);
  const table = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshBasicMaterial({ map: ptex, color: 0x5e5044, toneMapped: false }));
  table.rotation.x = -1.05; table.position.set(0, -0.02 * Math.cos(1.05), -0.02 * Math.sin(1.05)); scene.add(table);
  const toWorld = ([x, y]) => [(x / TW - 0.5) * 4.4, ((y + OY) / TH - 0.5) * -4.4 * TH / TW];
  return {
    scene, camera: cam,
    update(t, u) {
      const dPlan = RL[RL.length - 1] * E.inOutSine(prog(u, 27, 31));
      tex.draw((c, w, h) => {
        if (IMG2D.parchment) c.drawImage(IMG2D.parchment, 0, 0, w, h); else { c.fillStyle = C.paper; c.fillRect(0, 0, w, h); }
        c.save(); c.translate(0, OY);
        c.strokeStyle = 'rgba(59,46,34,0.18)'; c.lineWidth = 2;
        for (let lon = -80; lon <= 20; lon += 10) { c.beginPath(); c.moveTo(LON(lon), LAT(60)); c.lineTo(LON(lon), LAT(15)); c.stroke(); }
        for (let lat = 20; lat <= 55; lat += 10) { c.beginPath(); c.moveTo(LON(-90), LAT(lat)); c.lineTo(LON(25), LAT(lat)); c.stroke(); }
        c.fillStyle = 'rgba(105,78,48,0.55)'; c.strokeStyle = 'rgba(50,38,26,0.95)'; c.lineWidth = 4; c.lineJoin = 'round';
        for (const r of MAP.rings) { c.beginPath(); c.moveTo(r[0][0], r[0][1]); for (let i = 1; i < r.length; i++) c.lineTo(r[i][0], r[i][1]); c.closePath(); c.fill(); c.stroke(); }
        // planned route
        c.setLineDash([34, 20]); c.strokeStyle = 'rgba(120,40,20,0.95)'; c.lineWidth = 12;
        c.beginPath(); c.moveTo(...ROUTE[0]);
        for (let i = 1; i < ROUTE.length && RL[i - 1] < dPlan; i++) c.lineTo(...(RL[i] <= dPlan ? ROUTE[i] : routeAt(dPlan)));
        c.stroke(); c.setLineDash([]);
        const pin = (p, label, sub, a, right = true) => {
          if (a <= 0) return;
          c.globalAlpha = a;
          c.fillStyle = 'rgb(120,40,20)'; c.beginPath(); c.arc(p[0], p[1], 24, 0, TAU); c.fill();
          c.font = font(84, 700, UI); c.textAlign = right ? 'left' : 'right'; c.fillStyle = C.paperInk;
          c.fillText(label, p[0] + (right ? 36 : -36), p[1] + 28);
          if (sub) { c.font = font(60, 600, UI); c.fillStyle = 'rgba(59,46,34,0.8)'; c.fillText(sub, p[0] + (right ? 36 : -36), p[1] + 100); }
          c.globalAlpha = 1;
        };
        pin(ROUTE[0], 'New York', '7 नवंबर 1872', prog(u, 26.6, 27.2));
        pin(PT(8.93, 44.41), 'Genoa', 'मंज़िल', prog(u, 30.6, 31.2), false);
        if (dPlan > 140 && dPlan < RL[RL.length - 1] - 80) { const [px, py] = routeAt(dPlan); c.fillStyle = C.ink; c.beginPath(); c.arc(px, py, 28, 0, TAU); c.fill(); c.strokeStyle = C.paper; c.lineWidth = 6; c.stroke(); }
        c.restore();
      });
      // camera glides east along the route, low over the tilted chart
      const head = routeAt(RL[RL.length - 1] * E.inOutSine(prog(u, 26.5, 31.5)));
      const [hx, hz] = toWorld(head);
      const yW = Math.sin(-1.05), zW = Math.cos(-1.05);
      const tx = lerp(hx, 0.0, 0.2), ty = hz * yW * -1, tz = hz * zW;
      const lift = lerp(3.4, 4.2, E.inOutSine(prog(u, 26.5, 31.5)));
      cam.position.set(tx - 0.15, ty + lift, tz + lift * 0.62);
      cam.lookAt(tx, ty, tz);
      cam.updateProjectionMatrix();
    },
  };
}

// ---------------------------------------------------------------- 2-D overlays
function scrimTop(ctx, a = 0.6, h = 900) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, h);
}
function fogBank(ctx, u, density = 1, y = 1000, seed = 1) {
  if (density <= 0) return;
  for (let i = 0; i < 7; i++) {
    const r = 380 + hash01(i, seed) * 420;
    const x = ((hash01(i, seed + 1) * (W + 800) + u * (10 + 12 * hash01(i, seed + 2))) % (W + 800)) - 400;
    const yy = y + (hash01(i, seed + 3) - 0.5) * 620;
    const g = ctx.createRadialGradient(x, yy, 0, x, yy, r);
    g.addColorStop(0, rgba('#D9DEE2', 0.12 * density)); g.addColorStop(1, rgba('#D9DEE2', 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, yy - r, r * 2, r * 2);
  }
}
function rain(ctx, u, a = 1) {
  ctx.strokeStyle = `rgba(200,210,220,${0.28 * a})`; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = 0; i < 220; i++) {
    const x = (hash01(i, 75) * (W + 400) + u * 90) % (W + 400) - 200, y = (hash01(i, 76) * H + u * (700 + 500 * hash01(i, 77))) % H;
    ctx.moveTo(x, y); ctx.lineTo(x - 16, y + 70);
  }
  ctx.stroke();
}
function fumes(ctx, u, a) {
  for (let i = 0; i < 10; i++) {
    const x0 = 80 + i * 105, ph = hash01(i, 61) * TAU;
    ctx.strokeStyle = `rgba(230,225,210,${(0.07 + 0.04 * Math.sin(u + i)) * a})`; ctx.lineWidth = 14 + 10 * hash01(i, 62);
    ctx.beginPath();
    for (let y = 1500; y > 300; y -= 20) { const x = x0 + Math.sin(y * 0.01 + u * 1.2 + ph) * 50 * (1500 - y) / 1200; y === 1500 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
  }
}

// whole-word title: words rise out of a clip line
function headline(ctx, line, x, y, f, color, u, u0, step = 0.4, opts = {}) {
  ctx.font = f;
  const words = line.split(' '), sp = ctx.measureText(' ').width, ws = words.map((w) => ctx.measureText(w).width);
  const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let cx = (opts.align || 'center') === 'center' ? x - total / 2 : x;
  const m = ctx.measureText('ज़Mg'), asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
  const out = opts.exit ? E.inCubic(prog(u, opts.exit, opts.exit + 0.5)) : 0;
  words.forEach((w, i) => {
    const k = springU(u, u0 + i * step, opts.spring || SPRING.gentle);
    if (k > 0.001) {
      ctx.save(); ctx.beginPath(); ctx.rect(cx - 30, y - asc - 40, ws[i] + 60, asc + desc + 70); ctx.clip();
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 24;
      ctx.fillStyle = (opts.colors && opts.colors[i]) || color; ctx.textAlign = 'left';
      ctx.globalAlpha *= 1 - out;
      ctx.fillText(w, cx, y + (1 - k) * (asc + desc + 20) - out * 30);
      ctx.restore();
    }
    cx += ws[i] + sp;
  });
}

// documentary super: amber rule, place/date line, a detail line; types on by word
function superTitle(ctx, u, u0, u1, line1, line2) {
  const a = prog(u, u0, u0 + 0.4) * (1 - prog(u, u1 - 0.4, u1));
  if (a <= 0) return;
  const x = SAFE.x + 10, y = SAFE.y + 70;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = C.amber; ctx.fillRect(x, y - 48, 70 * E.outCubic(prog(u, u0, u0 + 0.6)), 5);
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 16;
  const typeOn = (str, f, yy, ua, col) => {
    const words = str.split(' '); const n = Math.floor(clamp((u - ua) / 0.12, 0, words.length));
    if (n > 0) text(ctx, words.slice(0, n).join(' '), x, yy, f, col);
  };
  typeOn(line1, font(46, 700, UI), y + 8, u0 + 0.2, C.fog);
  if (line2) typeOn(line2, font(36, 500, UI), y + 60, u0 + 0.8, C.dim);
  ctx.restore();
}
function aiTag(ctx, label = 'AI पुनर्निर्माण · सांकेतिक') {
  ctx.save(); ctx.font = font(26, 600, UI); ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(237,227,204,0.55)';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8;
  ctx.fillText(label, SAFE.x + SAFE.w - 10, SAFE.y + 12); ctx.restore();
}

function wrap(ctx, str, f, maxW) {
  ctx.font = f; const words = str.split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
const CAP_F = font(54, 600, UI);
function buildCaptions(ctx) {
  CAPS = [];
  for (const p of VO.phrases) {
    if (p.key) continue;
    const lines = wrap(ctx, p.text, CAP_F, SAFE.w - 40); const pages = [];
    for (let i = 0; i < lines.length; i += 2) pages.push(lines.slice(i, i + 2));
    const chars = pages.map((pg) => pg.join(' ').length), tot = chars.reduce((a, b) => a + b, 0);
    let a = p.u0;
    pages.forEach((pg, i) => { const b = i === pages.length - 1 ? p.u1 : a + (p.u1 - p.u0) * chars[i] / tot; CAPS.push({ u0: a, u1: b, lines: pg }); a = b; });
  }
}
function captions(ctx, u) {
  for (let i = 0; i < CAPS.length; i++) {
    const c = CAPS[i], next = CAPS[i + 1];
    const end = next ? Math.min(c.u1 + 0.6, next.u0 - 0.05) : c.u1 + 0.8;
    if (u < c.u0 - 0.15 || u > end + 0.2) continue;
    const kin = E.outCubic(prog(u, c.u0 - 0.15, c.u0 + 0.15)), a = Math.min(kin, 1 - prog(u, end, end + 0.2));
    const lh = 66, base = SAFE.y + SAFE.h - 26 - (c.lines.length - 1) * lh;
    ctx.save(); ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, base - 260, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.45, 'rgba(0,0,0,0.42)'); g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, base - 260, W, H - base + 260);
    c.lines.forEach((ln, j) => {
      ctx.font = CAP_F; ctx.textAlign = 'center'; ctx.lineJoin = 'round';
      const y = base + j * lh + (1 - kin) * 12;
      ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.strokeText(ln, CX - 20, y);
      ctx.fillStyle = C.fog; ctx.fillText(ln, CX - 20, y);
    });
    ctx.restore();
  }
}
function tickMark(ctx, x, y, s, color, k = 1) {
  ctx.strokeStyle = color; ctx.lineWidth = 8 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const P = [[-14, 0], [-3, 12], [18, -14]], k1 = clamp(k * 2), k2 = clamp(k * 2 - 1);
  ctx.beginPath(); ctx.moveTo(x + P[0][0] * s, y + P[0][1] * s);
  ctx.lineTo(x + lerp(P[0][0], P[1][0], k1) * s, y + lerp(P[0][1], P[1][1], k1) * s);
  if (k2 > 0) ctx.lineTo(x + lerp(P[1][0], P[2][0], k2) * s, y + lerp(P[1][1], P[2][1], k2) * s);
  ctx.stroke();
}
function crossMark(ctx, x, y, s, color, k = 1, lw = 9) {
  ctx.strokeStyle = color; ctx.lineWidth = lw * s; ctx.lineCap = 'round';
  const k1 = clamp(k * 2), k2 = clamp(k * 2 - 1);
  ctx.beginPath(); ctx.moveTo(x - 16 * s, y - 16 * s); ctx.lineTo(x + lerp(-16, 16, k1) * s, y + lerp(-16, 16, k1) * s); ctx.stroke();
  if (k2 > 0) { ctx.beginPath(); ctx.moveTo(x + 16 * s, y - 16 * s); ctx.lineTo(x + lerp(16, -16, k2) * s, y + lerp(-16, 16, k2) * s); ctx.stroke(); }
}

// ---------------------------------------------------------------- per-shot text and effects
function overlays(ctx, u, t, cut) {
  const [u0, u1, kind, data] = cut;
  if (kind === 'relief') aiTag(ctx);
  // fog / rain / fumes
  if (data.img === 's01_hook') fogBank(ctx, u, 1.2, 1150, 3);
  if (data.img === 's08_fog' || data.img === 's14_unsolved') fogBank(ctx, u, 1.4, 1100, 41);
  if (data.img === 's09_lifeboat') fogBank(ctx, u, 0.8 + prog(u, 54.5, 61.5), 1050, 51);
  if (data.img === 's11_storm') rain(ctx, u);
  if (data.fumes) fumes(ctx, u, prog(u, u0, u0 + 1));
  scrimTop(ctx, 0.72, 950);

  // S1 hook
  if (u < 7) {
    headline(ctx, 'समुद्र में मिला जहाज़', CX, 520, font(98, 400, DISPLAY), C.fog, u, -0.25, 0.4);
    headline(ctx, 'सामान मौजूद…', CX, 640, font(64, 600, UI), C.amber, u, 2.5, 0.4);
    superTitle(ctx, u, 0.5, 6.6, 'अटलांटिक महासागर', 'दिसंबर 1872');
  }
  if (u >= 7 && u < 9.5) {
    const k = springU(u, 7, SPRING.snappy);
    ctx.save(); M.shake(ctx, u, 7, 10); ctx.translate(CX, 600); const s = lerp(1.35, 1, clamp(k, 0, 1.2)); ctx.scale(s, s);
    ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 30; ctx.globalAlpha = clamp(k * 1.5);
    text(ctx, 'पूरा crew', 0, -40, font(110, 400, DISPLAY), C.fog, 'center');
    text(ctx, 'गायब', 0, 140, font(200, 400, DISPLAY), C.amber, 'center');
    ctx.restore();
  }
  if (u >= 9.5 && u < 17) {
    headline(ctx, 'जहाज़ टूटा नहीं था', CX, 470, font(88, 400, DISPLAY), C.fog, u, 9.6, 0.35, { exit: 16.4 });
    const calls = [[10.5, 'पतवार ठीक'], [12, 'मस्तूल ठीक'], [13.5, 'सामान मौजूद']];
    calls.forEach(([cu, label], i) => {
      const k = springU(u, cu, SPRING.snappy); if (k <= 0) return;
      ctx.save(); ctx.globalAlpha = clamp(k) * (1 - prog(u, 16.2, 16.7));
      const y = 600 + i * 90, x = SAFE.x + 40;
      ctx.font = font(50, 700, UI); const w = ctx.measureText(label).width + 100;
      rrect(ctx, x + (1 - k) * -60, y - 40, w, 76, 38); ctx.fillStyle = 'rgba(8,21,33,0.72)'; ctx.fill();
      tickMark(ctx, x + 40 + (1 - k) * -60, y - 2, 1.1, C.amber, prog(u, cu + 0.2, cu + 0.7));
      text(ctx, label, x + 72 + (1 - k) * -60, y + 16, font(50, 700, UI), C.fog);
      ctx.restore();
    });
  }
  if (u >= 23 && u < 26.5) superTitle(ctx, u, 23.1, 26.5, 'New York बंदरगाह', '7 नवंबर 1872 · मंज़िल: Genoa, इटली');
  if (u >= 26.5 && u < 31.5) headline(ctx, 'नवंबर 1872', CX, 470, font(110, 400, DISPLAY), C.fog, u, 26.7, 0.3);
  if (u >= 31.5 && u < 35) {
    superTitle(ctx, u, 31.6, 35, 'Captain Benjamin Briggs', 'जहाज़ पर कुल 10 लोग');
    headline(ctx, '10 लोग सवार', CX, 640, font(96, 400, DISPLAY), C.fog, u, 32.2, 0.35, { colors: [C.amber] });
  }
  if (u >= 35 && u < 39) {
    superTitle(ctx, u, 35.1, 39, '4 दिसंबर 1872', 'Azores और Portugal के बीच');
    headline(ctx, 'जहाज़ मिला', CX, 560, font(100, 400, DISPLAY), C.fog, u, 35.3, 0.35);
    headline(ctx, 'crew नहीं', CX, 680, font(80, 700, UI), C.amber, u, 36.6, 0.35);
  }
  if (u >= 39 && u < 43) {
    headline(ctx, 'lifeboat भी', CX, 470, font(76, 700, UI), C.fog, u, 39.3, 0.35);
    headline(ctx, 'गायब', CX, 640, font(170, 400, DISPLAY), C.amber, u, 40.5, 0.35);
  }
  if (u >= 43 && u < 50.5) {
    const rows = [[44, 'चलने लायक', true], [45, 'सामान मौजूद', true], [46.5, 'crew', false], [47.5, 'lifeboat', false]];
    const k0 = springU(u, 43.2, SPRING.gentle);
    withAlpha(ctx, clamp(k0) * (1 - prog(u, 50, 50.5)), () => {
      const top = 420, rh = 120, x0 = SAFE.x + 40, x1 = SAFE.x + SAFE.w - 40;
      rrect(ctx, x0, top - 110, x1 - x0, rh * 4 + 150, 28); ctx.fillStyle = 'rgba(6,14,22,0.78)'; ctx.fill();
      text(ctx, 'जहाज़ की हालत', CX, top - 35, font(52, 400, DISPLAY), C.dim, 'center');
      rows.forEach(([ru, label, ok], i) => {
        const k = springU(u, ru, SPRING.snappy); if (k <= 0.001) return;
        const y = top + 55 + i * rh;
        ctx.save(); ctx.globalAlpha *= clamp(k); ctx.translate((1 - k) * -60, 0);
        text(ctx, label, x0 + 60, y + 22, font(64, 700, UI), ok ? C.fog : C.amber);
        if (ok) tickMark(ctx, x1 - 90, y + 4, 1.5, C.fog, prog(u, ru + 0.1, ru + 0.5)); else crossMark(ctx, x1 - 90, y, 1.3, C.amber, prog(u, ru + 0.1, ru + 0.5));
        ctx.restore();
      });
    });
  }
  if (u >= 50.5 && u < 54.5) {
    headline(ctx, 'सबने जहाज़ क्यों छोड़ा?', CX, 470, font(80, 400, DISPLAY), C.fog, u, 50.6, 0.25);
    const k = springU(u, 50.5, SPRING.bouncy);
    withAlpha(ctx, clamp(k * 2), () => { ctx.save(); ctx.translate(CX, 760); const s = Math.pow(1.08, prog(u, 50.5, 54.5)) * lerp(0.5, 1, clamp(k, 0, 1.2)); ctx.scale(s, s); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 30; text(ctx, 'क्यों?', 0, 0, font(260, 400, DISPLAY), C.amber, 'center'); ctx.restore(); });
  }
  const theory = (n, ua, ub, l1, l2) => {
    if (u < ua || u >= ub) return;
    const k = springU(u, ua + 0.1, SPRING.snappy);
    withAlpha(ctx, clamp(k) * (1 - prog(u, ub - 0.5, ub)), () => {
      ctx.save(); ctx.translate(CX, 360); ctx.font = font(38, 800, UI); const tw = ctx.measureText(`THEORY ${n}`).width + 60;
      rrect(ctx, -tw / 2, -44, tw, 60, 30); ctx.fillStyle = C.amber; ctx.fill(); text(ctx, `THEORY ${n}`, 0, -2, font(38, 800, UI), C.ink, 'center', 3); ctx.restore();
    });
    headline(ctx, l1, CX, 500, font(84, 400, DISPLAY), C.fog, u, ua + 0.3, 0.3, { exit: ub - 0.6 });
    if (l2) headline(ctx, l2, CX, 605, font(60, 700, UI), C.amber, u, ua + 1.2, 0.3, { exit: ub - 0.55 });
  };
  theory(1, 54.5, 61.5, 'खतरा समझकर', 'lifeboat में निकल गए?');
  theory(2, 61.5, 70.5, 'alcohol के fumes?', 'आग का डर?');
  theory(3, 70.5, 76.5, 'समुद्री तूफ़ान?', 'या कुछ और?');
  if (u >= 76.5 && u < 80.5) {
    ctx.save(); M.shake(ctx, u, 76.5, 10);
    const st = (k, fn) => { if (k <= 0.001) return; ctx.save(); ctx.globalAlpha = clamp(k * 1.5); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 30; fn(lerp(1.5, 1, clamp(k, 0, 1.3))); ctx.restore(); };
    st(springU(u, 76.5, SPRING.snappy), (s) => { ctx.translate(CX, 470); ctx.scale(s, s); text(ctx, 'Theory', 0, 0, font(170, 400, DISPLAY), C.fog, 'center'); });
    st(springU(u, 77, SPRING.bouncy), (s) => { ctx.translate(CX, 600); ctx.scale(s, s); ctx.fillStyle = C.amber; rrect(ctx, -110, -46, 220, 28, 14); ctx.fill(); rrect(ctx, -110, 18, 220, 28, 14); ctx.fill(); ctx.rotate(-1.05); rrect(ctx, -100, -14, 200, 28, 14); ctx.fill(); });
    st(springU(u, 77.5, SPRING.snappy), (s) => { ctx.translate(CX, 800); ctx.scale(s, s); text(ctx, 'proof', 0, 0, font(170, 400, DISPLAY), C.fog, 'center'); });
    ctx.restore();
  }
  if (u >= 87.5 && u < 93) {
    headline(ctx, 'आज तक', CX, 420, font(72, 700, UI), C.fog, u, 87.6, 0.3);
    const k = springU(u, 88.5, SPRING.snappy);
    if (k > 0) {
      ctx.save(); M.shake(ctx, u, 88.5, 8); ctx.translate(CX, 590); ctx.rotate(-0.05); const s = lerp(1.7, 1, clamp(k, 0, 1.2)); ctx.scale(s, s);
      ctx.globalAlpha = clamp(k * 1.5); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 20;
      ctx.strokeStyle = C.amber; ctx.lineWidth = 8; rrect(ctx, -320, -120, 640, 168, 16); ctx.stroke();
      text(ctx, 'अनसुलझा', 0, 20, font(145, 400, DISPLAY), C.amber, 'center'); ctx.restore();
    }
    withAlpha(ctx, prog(u, 89.5, 90.2), () => { ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 14; text(ctx, '1872 से आज तक', CX, 770, font(56, 600, UI), C.fog, 'center'); });
  }
  if (u >= 93) {
    headline(ctx, 'आपकी theory', CX, 430, font(104, 400, DISPLAY), C.fog, u, 92.9, 0.25);
    headline(ctx, 'क्या है?', CX, 550, font(104, 400, DISPLAY), C.amber, u, 93.5, 0.3);
    const opts = [['A', 'खतरा समझकर भागे'], ['B', 'alcohol fumes / आग'], ['C', 'समुद्री तूफ़ान'], ['D', 'कुछ और?']];
    opts.forEach(([l, tx], i) => {
      const k = springU(u, 95 + i * 0.75, SPRING.bouncy); if (k <= 0) return;
      const y = 700 + i * 140, x = SAFE.x + 40, w = SAFE.w - 80;
      ctx.save(); ctx.globalAlpha = clamp(k); ctx.translate(x + w / 2, y + Math.sin(u * 0.8 + i) * 3); ctx.scale(clamp(k, 0, 1.15), clamp(k, 0, 1.15));
      rrect(ctx, -w / 2, -50, w, 104, 52); ctx.fillStyle = 'rgba(6,14,22,0.72)'; ctx.fill(); ctx.strokeStyle = 'rgba(237,227,204,0.35)'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(-w / 2 + 56, 2, 34, 0, TAU); ctx.fillStyle = C.amber; ctx.fill();
      text(ctx, l, -w / 2 + 56, 18, font(42, 800, UI), C.ink, 'center'); text(ctx, tx, -w / 2 + 116, 20, font(54, 600, UI), C.fog);
      ctx.restore();
    });
    const kb = springU(u, 98.5, SPRING.bouncy);
    if (kb > 0) {
      ctx.save(); ctx.globalAlpha = clamp(kb); ctx.translate(CX, 1330 + Math.sin((u - 98.5) * Math.PI * 0.5) * 8); ctx.scale(clamp(kb, 0, 1.2), clamp(kb, 0, 1.2));
      ctx.font = font(60, 700, UI); const w = ctx.measureText('comment में बताइए').width + 170;
      rrect(ctx, -w / 2, -60, w, 120, 60); ctx.fillStyle = C.amber; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-w / 2 + 70, 55); ctx.lineTo(-w / 2 + 50, 100); ctx.lineTo(-w / 2 + 110, 58); ctx.fill();
      ctx.fillStyle = C.ink; rrect(ctx, -w / 2 + 34, -26, 62, 44, 14); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-w / 2 + 46, 14); ctx.lineTo(-w / 2 + 42, 32); ctx.lineTo(-w / 2 + 62, 16); ctx.fill();
      text(ctx, 'comment में बताइए', -w / 2 + 120, 20, font(60, 700, UI), C.ink);
      ctx.restore();
    }
  }
}

// ---------------------------------------------------------------- 2-D shots: archival painting, triptych
function archival(ctx, u) {
  fill(ctx, '#0B0B0C');
  const im = IMG2D.amazon; if (!im) return;
  const p = prog(u, 17, 23.75);
  // the painting fills the height, slow drift right-to-left across the hull (Ken Burns)
  const s = (H * 0.62 / im.height) * Math.pow(1.12, p);
  const w = im.width * s, h = im.height * s;
  const x = lerp(-w * 0.18, -w * 0.32, E.inOutSine(p)) + W * 0.15, y = 760 - h / 2 + 140;
  ctx.save(); ctx.filter = 'sepia(0.25) contrast(1.05) brightness(0.92)'; ctx.drawImage(im, x, y, w, h); ctx.filter = 'none'; ctx.restore();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(11,11,12,0.95)'); g.addColorStop(0.3, 'rgba(11,11,12,0)'); g.addColorStop(0.8, 'rgba(11,11,12,0)'); g.addColorStop(1, 'rgba(11,11,12,0.95)');
  ctx.fillStyle = g; ctx.fillRect(0, y, W, h);
  const k = springU(u, 17.1, SPRING.gentle);
  withAlpha(ctx, clamp(k), () => {
    text(ctx, 'MARY CELESTE', CX, 380 + (1 - k) * 30, font(108, 400, DISPLAY), C.fog, 'center', 6);
    text(ctx, 'का रहस्य', CX, 470 + (1 - k) * 30, font(64, 600, UI), C.amber, 'center');
  });
  headline(ctx, '10 लोग कहाँ गए?', CX, 1180, font(92, 400, DISPLAY), C.fog, u, 18.2, 0.3, { colors: [C.amber] });
  ctx.save(); ctx.font = font(30, 600, UI); ctx.fillStyle = 'rgba(237,227,204,0.7)'; ctx.textAlign = 'right';
  ctx.fillText('असली पेंटिंग, 1861 · तब नाम: Amazon', SAFE.x + SAFE.w - 10, SAFE.y + 12); ctx.restore();
}
function triptych(ctx, u) {
  fill(ctx, '#07090B');
  headline(ctx, 'किसी theory का', CX, 400, font(82, 400, DISPLAY), C.fog, u, 80.6, 0.3);
  headline(ctx, 'पक्का सबूत नहीं', CX, 505, font(82, 400, DISPLAY), C.amber, u, 81.0, 0.3);
  const items = [['s09_lifeboat', 'खतरा'], ['s10_hatch', 'alcohol'], ['s11_storm', 'तूफ़ान']];
  const pw = 290, ph = 520, gap = 24, x0 = CX - (pw * 3 + gap * 2) / 2, y0 = 620;
  items.forEach(([key, label], i) => {
    const k = springU(u, 80.6 + i * 0.25, SPRING.gentle); if (k <= 0) return;
    const im = IMG2D[key]; const x = x0 + i * (pw + gap), y = y0 + (1 - k) * 60;
    ctx.save(); ctx.globalAlpha = clamp(k);
    const z = 1.0 + 0.06 * prog(u, 80.5, 87.5);
    if (im) M.cover(ctx, im, x, y, pw, ph, { zoom: z, radius: 18 });
    // desaturate once crossed
    const kc = prog(u, 81.5 + i, 81.9 + i);
    if (kc > 0) { ctx.fillStyle = `rgba(0,0,0,${0.45 * kc})`; rrect(ctx, x, y, pw, ph, 18); ctx.fill(); }
    ctx.strokeStyle = 'rgba(237,227,204,0.25)'; ctx.lineWidth = 2; rrect(ctx, x, y, pw, ph, 18); ctx.stroke();
    text(ctx, label, x + pw / 2, y + ph + 70, font(50, 700, UI), C.fog, 'center');
    if (kc > 0) { ctx.save(); ctx.translate(x + pw / 2, y + ph / 2); const s = lerp(1.4, 1, E.outBack(kc)); ctx.scale(s, s); crossMark(ctx, 0, 0, 4.4, C.amber, kc, 5); ctx.restore(); }
    ctx.restore();
  });
}

// ---------------------------------------------------------------- render one cut
function renderCut(ctx, u, t, cut) {
  const [u0, u1, kind, data] = cut;
  if (kind === 'relief') {
    const len = (u1 === 999 ? 108 : u1) - u0;
    const flash = data.img === 's11_storm' ? bump(u, 72.6, 0.25) * 0.9 + bump(u, 73.1, 0.15) * 0.5 : 0;
    G.renderSet(ctx, RELIEF, t, u, { img: data.img, move: data.move, p: (u - u0 + 0.75) / (len + 1.5), flash });
  } else if (kind === 'map') {
    fill(ctx, '#0B0B0C');
    G.renderSet(ctx, MAPSET, t, u, {});
    const g = ctx.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, 'rgba(11,11,12,1)'); g.addColorStop(1, 'rgba(11,11,12,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 700);
  } else if (kind === 'archival') archival(ctx, u);
  else if (kind === 'triptych') triptych(ctx, u);
  overlays(ctx, u, t, cut);
}

M.film({
  fonts: [font(100, 400, DISPLAY), font(40, 400, UI), font(40, 500, UI), font(40, 600, UI), font(40, 700, UI), font(40, 800, UI)],
  images: {
    amazon: 'assets/archival/amazon_1861.jpg', parchment: 'assets/shots/s00_parchment.jpg',
    s09_lifeboat: 'assets/shots/s09_lifeboat.jpg', s10_hatch: 'assets/shots/s10_hatch.jpg', s11_storm: 'assets/shots/s11_storm.jpg',
  },
  samples: 2,
  hits: HITS,
  async init(ctx, IMG) {
    Object.assign(IMG2D, IMG);
    [VO, MAP] = await Promise.all([fetch('vo.json').then((r) => r.json()), fetch('assets/map.json').then((r) => r.json())]);
    await G.initGL({ exposure: 1.0 });
    const loader = new THREE.TextureLoader();
    const load = (src) => new Promise((res, rej) => loader.load(src, res, undefined, rej));
    await Promise.all(Object.keys(IMGS).map(async (k) => {
      const [map, depth] = await Promise.all([load(`assets/shots/${k}.jpg`), load(`assets/shots/${k}_depth.png`)]);
      map.colorSpace = THREE.NoColorSpace; map.anisotropy = 8; map.minFilter = THREE.LinearMipmapLinearFilter;
      depth.colorSpace = THREE.NoColorSpace;
      TEX[k] = { map, depth };
    }));
    RELIEF = reliefSet(); MAPSET = mapSet();
    await Promise.all([document.fonts.load(font(100, 400, DISPLAY), 'रहस्य'), ...[400, 500, 600, 700, 800].map((w) => document.fonts.load(font(40, w, UI), 'रहस्य'))]);
    buildCaptions(ctx);
  },
  draw(ctx, u, t) {
    ctx.textBaseline = 'alphabetic';
    let i = CUTS.findIndex(([a, b]) => u >= a && u < b); if (i < 0) i = CUTS.length - 1;
    const cut = CUTS[i];
    const d = DISSOLVE[cut[0]];
    if (d && i > 0 && u < cut[0] + d) {
      // dissolve: the incoming shot fades up over the outgoing one (both moving)
      renderCut(ctx, u, t, CUTS[i - 1]);
      const p = E.inOutSine(prog(u, cut[0], cut[0] + d));
      if (!OFF) { OFF = document.createElement('canvas'); OFF.width = W; OFF.height = H; }
      const o = OFF.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.clearRect(0, 0, W, H); o.textBaseline = 'alphabetic';
      renderCut(o, u, t, cut);
      ctx.save(); ctx.globalAlpha = p; ctx.drawImage(OFF, 0, 0); ctx.restore();
    } else renderCut(ctx, u, t, cut);
    captions(ctx, u);
  },
  post(ctx, u, t) {
    const fr = Math.floor(t * 24), rnd = mulberry32(fr * 7919 + 13);
    ctx.fillStyle = 'rgba(255,255,255,0.045)'; for (let i = 0; i < 2200; i++) ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.07)'; for (let i = 0; i < 2200; i++) ctx.fillRect(rnd() * W, rnd() * H, 2, 2);
    const g = ctx.createRadialGradient(CX, H * 0.45, H * 0.28, CX, H * 0.5, H * 0.78);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  },
});
