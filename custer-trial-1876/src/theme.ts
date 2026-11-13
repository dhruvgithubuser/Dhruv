// Timing + palette for "The Trial After Little Bighorn" (realistic documentary). Every visual is a pure function of the frame.
import { Easing, interpolate } from 'remotion';
import timeline from './data/timeline.json';

export const W = 1920, H = 1080, FPS = 30;
export const DURATION_S = Math.ceil(timeline.duration);
export const DURATION_FRAMES = DURATION_S * FPS;
export const sec = (s: number) => Math.round(s * FPS);

// MG-VOXSTAGE palette: archival red, faded beige, muted green, charcoal, antique paper
export const C = {
  red: '#8e1b16', redHi: '#c0392b', beige: '#d8c9a6', green: '#4b5a3a', greenHi: '#6e7d52', charcoal: '#1d1b19', paper: '#efe6d2',
  ink: '#2a2117', dim: '#7a6b55', blue: '#2f4f7a', blueHi: '#4a74a8', gold: '#f0c96a', snow: '#f4f1ea', fire: '#d9531e', land: '#e2d4b0', sea: '#b9b8a0',
};
export const HEAD = 'Oswald', TYPE = 'Courier Prime', MONO = 'Plex Mono', SANS = 'Inter', SERIF = 'Playfair';
export const N_SCENES = 43;

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
export const lin = (f: number, a: number, b: number, from = 0, to = 1) => (b <= a ? (f >= a ? to : from) : interpolate(f, [a, b], [from, to], clamp));
export const ease = (f: number, a: number, b: number, from = 0, to = 1) =>
  b <= a ? (f >= a ? to : from) : interpolate(f, [a, b], [from, to], { ...clamp, easing: Easing.inOut(Easing.cubic) });

export type Word = { w: string; start: number; end: number };
export type Phrase = { scene: number; text: string; start: number; end: number; words?: Word[] };
export const PHRASES = timeline.phrases as Phrase[];
const ph = (n: number) => PHRASES.filter((p) => p.scene === n);

// Scene n starts a beat before its line (scene 1 at 0, the last scene runs to the end).
export const SCENES = Array.from({ length: N_SCENES }, (_, i) => {
  const n = i + 1;
  const start = n === 1 ? 0 : ph(n)[0].start - 0.3;
  const end = n === N_SCENES ? DURATION_S : ph(n + 1)[0].start - 0.3;
  return { n, start, end, from: sec(start), frames: sec(end) - sec(start) };
});
// local frame (in scene n) of phrase i's start / end, or of a spoken word
export const pf = (n: number, i: number, edge: 'start' | 'end' = 'start') => sec(ph(n)[i][edge]) - SCENES[n - 1].from;
export function wf(n: number, word: string, nth = 0): number {
  const ws = ph(n).flatMap((p) => p.words ?? []);
  const hits = ws.filter((w) => w.w.toLowerCase().replace(/[^a-z0-9]/g, '') === word.toLowerCase());
  const h = hits[Math.min(nth, Math.max(0, hits.length - 1))];
  return h ? sec(h.start) - SCENES[n - 1].from : 0;
}

// seeded noise (no Math.random anywhere)
export const hash01 = (i: number, seed = 1) => {
  let a = (i * 374761393 + seed * 668265263) | 0;
  a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export const noise1 = (x: number, seed = 1) => {
  const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f);
  return (hash01(i, seed) * (1 - s) + hash01(i + 1, seed) * s) * 2 - 1;
};
