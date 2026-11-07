// util.js: seeded randomness and colour maths shared by every set. Pure functions only.
import { mulberry32, clamp, lerp } from './motion.js';

export { clamp, lerp };
export const rng = (seed) => mulberry32((seed * 2654435761) | 0);
export const h01 = (i, s = 1) => mulberry32(((i * 374761393) ^ (s * 668265263)) | 0)();
export const hrange = (i, s, a, b) => a + (b - a) * h01(i, s);
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const win = (t, a, b, fi = 0.5, fo = 0.5) => Math.min(smooth(a, a + fi, t), 1 - smooth(b - fo, b, t));

// 2-D value noise in [-1, 1] and a few octaves of it.
export function vnoise(x, y, s = 1) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const g = (i, j) => h01(i * 7919 + j * 104729, s);
  return (lerp(lerp(g(xi, yi), g(xi + 1, yi), u), lerp(g(xi, yi + 1), g(xi + 1, yi + 1), u), v)) * 2 - 1;
}
export const fbm = (x, y, s = 1, o = 4) => { let a = 0, f = 1, w = 0.5; for (let i = 0; i < o; i++) { a += w * vnoise(x * f, y * f, s + i * 13); f *= 2; w *= 0.5; } return a; };

// Colours as [r, g, b] arrays; css() at the end.
export const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
export const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const C = (h, a = 1) => css(hex(h), a);

export function canvas(w, h) {
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}

// The film's light: one "mood" object every set reads. key 0..1 blends between named looks.
export const LOOKS = {
  dawn:    { sky: ['#7f9cc0', '#e9c79a', '#f6d9a8'], sun: '#ffd9a0', amb: '#9a8ea0', fog: '#e7cfae', fogK: 0.55, light: 1.0 },
  golden:  { sky: ['#5f8fc4', '#a9c6df', '#f1dcb4'], sun: '#ffe2b0', amb: '#8f9ab0', fog: '#dfd2bb', fogK: 0.45, light: 1.1 },
  noon:    { sky: ['#4f86c6', '#93bde0', '#e3e6df'], sun: '#fff1d6', amb: '#8b9bb3', fog: '#d6dce0', fogK: 0.4, light: 1.15 },
  storm:   { sky: ['#4b4f57', '#7d7a74', '#a99a84'], sun: '#d9c3a0', amb: '#6d6a6a', fog: '#9b9187', fogK: 0.6, light: 0.8 },
  ash:     { sky: ['#2c2723', '#4a3f36', '#6e5a46'], sun: '#c98a4a', amb: '#5a514a', fog: '#6a5f55', fogK: 0.85, light: 0.6 },
  dark:    { sky: ['#120f0e', '#211a16', '#3a2a1f'], sun: '#ff8a3a', amb: '#2e2824', fog: '#2b2420', fogK: 0.9, light: 0.35 },
  grey:    { sky: ['#6d6a66', '#9a958d', '#bab3a6'], sun: '#e8dcc6', amb: '#86817a', fog: '#aaa398', fogK: 0.7, light: 0.85 },
  sunset:  { sky: ['#3e4f7a', '#c97b5a', '#f3b46a'], sun: '#ffb46a', amb: '#7a6278', fog: '#e0a678', fogK: 0.5, light: 0.95 },
  modern:  { sky: ['#5d8fca', '#a7c7e3', '#e8e2d2'], sun: '#fff0d8', amb: '#8a98ab', fog: '#d9dad3', fogK: 0.42, light: 1.1 },
};
export function look(a, b = null, k = 0) {
  const A = LOOKS[a], B = b ? LOOKS[b] : null;
  if (!B || k <= 0) return { ...A, sky: A.sky.map(hex), sun: hex(A.sun), amb: hex(A.amb), fog: hex(A.fog) };
  const m = (x, y) => mixc(hex(x), hex(y), k);
  return { sky: A.sky.map((c, i) => m(c, B.sky[i])), sun: m(A.sun, B.sun), amb: m(A.amb, B.amb), fog: m(A.fog, B.fog),
    fogK: lerp(A.fogK, B.fogK, k), light: lerp(A.light, B.light, k) };
}
